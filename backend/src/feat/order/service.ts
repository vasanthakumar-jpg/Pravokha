import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { stripe } from '../../infra/stripe';
import { prisma } from '../../infra/database/client';
import { ProductService } from '../product/service';

export class OrderService {
    static async createOrder(data: {
        userId?: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        shippingAddress: string;
        shippingCity: string;
        shippingPincode: string;
        items: {
            productId: string;
            quantity: number;
            variantId?: string;
            color?: string;
            size?: string;
        }[];
        paymentMethod?: string;
        status?: string;
        paymentStatus?: string;
        stripeIntentId?: string;
    }) {
        const orderNumberBase = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const { userId, items } = data;

        const shippingAddressJson = {
            address: data.shippingAddress,
            city: data.shippingCity,
            pincode: data.shippingPincode
        };

        return await prisma.$transaction(async (tx) => {
            const productIds = items.map((i) => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: { vendor: true }
            });

            // 1. Group items by Vendor and validate stock
            const vendorGroups = new Map<string, any[]>();
            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) throw new Error(`Product ${item.productId} not found`);
                if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.title}`);

                const vId = product.vendorId;
                if (!vId) throw new Error(`Product ${product.title} has no vendor assigned`);

                if (!vendorGroups.has(vId)) vendorGroups.set(vId, []);
                vendorGroups.get(vId)!.push({ item, product });

                // Atomic stock decrement
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            // 3. Create Orders (Split by Vendor)
            const createdOrders: any[] = [];
            let grandTotal = 0;
            let counter = 1;

            for (const [vId, group] of vendorGroups) {
                const vendorSubtotal = group.reduce((sum, g) => sum + (g.product.price * g.item.quantity), 0);

                // Get dynamic tax rate (fallback to 18)
                const settings = await tx.siteSetting.findUnique({ where: { id: 'primary' } });
                const taxRate = settings?.taxRate || 18;

                // Calculate shipping eligibility
                const baseShippingFee = 50;
                let applicableShipping = 0;
                if (userId && counter === 1) { // Only add shipping to the first vendor order if applicable
                    const orderCount = await tx.order.count({ where: { customerId: userId } });
                    if (orderCount >= 3) {
                        applicableShipping = baseShippingFee;
                    }
                }

                const vendorTax = Math.round((vendorSubtotal + applicableShipping) * (taxRate / 100));
                const vendorTotal = vendorSubtotal + vendorTax + applicableShipping;

                const vendor = group[0].product.vendor;
                const commissionRate = vendor?.commissionRate || settings?.commissionRate || 10;
                const platformFee = (vendorTotal * commissionRate) / 100;
                const vendorEarnings = vendorTotal - platformFee;

                const order = await tx.order.create({
                    data: {
                        orderNumber: `${orderNumberBase}-${counter++}`,
                        customerId: userId || null,
                        vendorId: vId,
                        totalAmount: vendorTotal,
                        platformFee,
                        vendorEarnings,
                        shippingFee: applicableShipping,
                        taxAmount: vendorTax,
                        status: (data.status as OrderStatus) || OrderStatus.PENDING,
                        paymentStatus: (data.paymentStatus as PaymentStatus) || PaymentStatus.UNPAID,
                        paymentMethod: data.paymentMethod || 'COD',
                        customerName: data.customerName,
                        customerEmail: data.customerEmail,
                        customerPhone: data.customerPhone,
                        shippingAddress: JSON.stringify(shippingAddressJson),
                        stripeIntentId: data.stripeIntentId,
                        items: {
                            create: group.map(g => ({
                                productId: g.product.id,
                                quantity: g.item.quantity,
                                priceAtPurchase: g.product.price,
                                subtotal: g.product.price * g.item.quantity,
                                variantId: g.item.variantId,
                                color: g.item.color,
                                size: g.item.size
                            }))
                        },
                        statusHistory: {
                            create: {
                                status: (data.status as OrderStatus) || OrderStatus.PENDING,
                                notes: 'Order created'
                            }
                        }
                    },
                    include: { items: true }
                });

                createdOrders.push(order);
                grandTotal += vendorTotal;
            }

            // 4. Stripe Integration
            let clientSecret = null;
            if (data.paymentMethod === 'stripe' && !data.stripeIntentId && createdOrders.length > 0) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(grandTotal * 100),
                    currency: 'inr',
                    metadata: {
                        customerEmail: data.customerEmail,
                        orderNumbers: createdOrders.map(o => o.orderNumber).join(',')
                    },
                    receipt_email: data.customerEmail,
                });

                for (const o of createdOrders) {
                    await tx.order.update({
                        where: { id: o.id },
                        data: { stripeIntentId: paymentIntent.id }
                    });
                }
                clientSecret = paymentIntent.client_secret;
            }

            // 5. Notifications
            const { NotificationService } = await import('../notification/service');
            for (const order of createdOrders) {
                await NotificationService.createNotification({
                    userId: order.vendorId,
                    title: 'New Order Received',
                    message: `You have a new order ${order.orderNumber}. Total: ₹${order.totalAmount}`,
                    type: 'order',
                    link: `/seller/orders/${order.id}`,
                }).catch(e => console.error("Notification failed:", e));
            }

            return { orders: createdOrders, clientSecret, grandTotal };
        });
    }

    static async getOrderById(id: string, userId: string, role: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                variants: true
                            }
                        }
                    }
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!order) return null;

        // Transform product images for each item
        if (order.items) {
            order.items = order.items.map((item: any) => {
                if (item.product) {
                    item.product = (ProductService as any).transformProduct(item.product);
                }
                return item;
            });
        }

        // Access Control
        if (role === Role.CUSTOMER && order.customerId !== userId) return null;
        if (role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (order.vendorId !== vendor?.id) return null;
        }

        return order;
    }

    static async listOrders(userId: string, role: string, options: {
        page?: number;
        limit?: number;
        status?: string;
        vendorId?: string;
        customerId?: string;
        search?: string;
        after?: string;
        type?: string;
    }) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (role === Role.CUSTOMER) where.customerId = userId;
        if (role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (vendor) {
                where.vendorId = vendor.id;
            } else {
                console.warn(`[OrderService.listOrders] Role is SELLER but no vendor found for user ${userId}`);
                // If they are a seller but have no vendor record, they shouldn't see any orders
                where.vendorId = 'non_existent_id';
            }
        }

        if (options.status) {
            const statusUpper = options.status.toUpperCase();
            // Safer check for valid status
            const validStatuses = Object.keys(OrderStatus);
            if (validStatuses.includes(statusUpper)) {
                where.status = statusUpper as OrderStatus;
            }
        }
        if (options.vendorId) where.vendorId = options.vendorId;
        if (options.customerId) where.customerId = options.customerId;

        if (options.search) {
            where.OR = [
                { orderNumber: { contains: options.search } },
                { customerName: { contains: options.search } },
                { customerEmail: { contains: options.search } }
            ];
        }

        try {
            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                        variants: true
                                    }
                                }
                            }
                        },
                        vendor: true
                    }
                }),
                prisma.order.count({ where })
            ]);

            // Transform product images for each item in each order
            const transformedOrders = orders.map((order: any) => {
                if (order.items) {
                    order.items = order.items.map((item: any) => {
                        if (item.product) {
                            item.product = (ProductService as any).transformProduct(item.product);
                        }
                        return item;
                    });
                }
                return order;
            });

            return { orders: transformedOrders, total };
        } catch (error: any) {
            console.error('[OrderService.listOrders] Error:', error.message);
            throw error;
        }
    }

    static async getOrderStats(userId: string, role: string) {
        const stats: any = {
            totalOrders: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
            totalRevenue: 0
        };

        const where: any = {};
        if (role === Role.CUSTOMER) where.customerId = userId;
        if (role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            where.vendorId = vendor?.id;
        }

        stats.totalOrders = await prisma.order.count({ where });
        stats.pendingOrders = await prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } });
        stats.deliveredOrders = await prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } });

        const revenueResult = await prisma.order.aggregate({
            where: { ...where, paymentStatus: PaymentStatus.PAID },
            _sum: { totalAmount: true }
        });
        stats.totalRevenue = revenueResult._sum.totalAmount || 0;

        return stats;
    }

    static async cancelOrder(id: string, userId: string, role: string, reason?: string, comments?: string) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order) throw new Error('Order not found');

            const isSuperAdmin = role === Role.SUPER_ADMIN;
            const isCustomer = role === Role.CUSTOMER && order.customerId === userId;

            let isVendor = false;
            if (role === Role.SELLER) {
                const vendor = await tx.vendor.findUnique({ where: { ownerId: userId } });
                isVendor = vendor?.id === order.vendorId;
            }

            if (!isSuperAdmin && !isCustomer && !isVendor) {
                throw new Error('Unauthorized');
            }

            if (order.status === OrderStatus.SHIPPED ||
                order.status === OrderStatus.DELIVERED ||
                order.status === OrderStatus.CANCELLED) {
                throw new Error(`Cannot cancel order in ${order.status} status`);
            }

            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }

            if (order.paymentStatus === PaymentStatus.PAID && order.stripeIntentId) {
                try {
                    const refund = await stripe.refunds.create({
                        payment_intent: order.stripeIntentId,
                        reason: 'requested_by_customer'
                    });
                    console.log(`[OrderService] Stripe refund successful for intent ${order.stripeIntentId}: ${refund.id}`);
                } catch (stripeError: any) {
                    console.error('[OrderService] Stripe refund failed during cancellation:', stripeError.message);
                    // We continue the cancellation even if automated refund fails; 
                    // Manual intervention might be required if Stripe is down or intent is too old.
                }
            }

            return await tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.CANCELLED,
                    paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
                    statusHistory: {
                        create: {
                            status: OrderStatus.CANCELLED,
                            notes: reason ? `Cancelled: ${reason}${comments ? ` (${comments})` : ''}` : 'Order Cancelled'
                        }
                    }
                },
                include: { items: true }
            });
        });
    }

    static async updateOrderStatus(id: string, newStatus: OrderStatus, options: {
        userId: string;
        role: string;
        trackingNumber?: string;
        trackingCarrier?: string;
        packingNotes?: string;
        version?: number;
    }) {
        return await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id }
            });

            if (!currentOrder) throw new Error('Order not found');

            // Access Control
            if (options.role === Role.SELLER) {
                const vendor = await tx.vendor.findUnique({ where: { ownerId: options.userId } });
                if (!vendor || currentOrder.vendorId !== vendor.id) {
                    throw new Error('Forbidden: You can only update orders for your own vendor');
                }
            } else if (options.role !== Role.SUPER_ADMIN && options.role !== Role.ADMIN) {
                throw new Error('Unauthorized');
            }

            if (options.version !== undefined && currentOrder.version !== options.version) {
                throw new Error(`Concurrency conflict: Order has been updated (Local: ${options.version}, DB: ${currentOrder.version})`);
            }

            const updateData: any = {
                status: newStatus,
                version: { increment: 1 }
            };

            if (options.trackingNumber) updateData.trackingNumber = options.trackingNumber;
            if (options.trackingCarrier) updateData.trackingCarrier = options.trackingCarrier;
            if (newStatus === OrderStatus.SHIPPED) updateData.shippedAt = new Date();
            if (newStatus === OrderStatus.DELIVERED) updateData.deliveredAt = new Date();

            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    ...updateData,
                    statusHistory: {
                        create: {
                            status: newStatus,
                            notes: options.packingNotes || `Status updated to ${newStatus}`
                        }
                    }
                },
                include: { items: true }
            });

            return updatedOrder;
        });
    }

    static async markOrderAsShipped(id: string, data: {
        vendorId: string;
        trackingNumber: string;
        trackingCarrier?: string;
        version?: number;
    }) {
        // Find owner of vendor to get correct userId for updateOrderStatus access check
        const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
        if (!vendor) throw new Error('Vendor not found');

        return await this.updateOrderStatus(id, OrderStatus.SHIPPED, {
            userId: vendor.ownerId,
            role: Role.SELLER,
            trackingNumber: data.trackingNumber,
            trackingCarrier: data.trackingCarrier,
            version: data.version
        });
    }

    static async getOrderHistory(id: string, userId: string, role: string) {
        const order = await this.getOrderById(id, userId, role);
        if (!order) throw new Error('Order not found or access denied');
        return order.statusHistory;
    }

    static async updateItemStatus(orderId: string, itemId: string, userId: string, role: string, data: any) {
        // In this architecture, status is primarily per-order since orders are already split by vendor
        // But we can update individual item status if we had that field. 
        // For now, let's just update the order status if it's the only item or intended for all.
        return this.updateOrderStatus(orderId, data.status as OrderStatus, {
            userId,
            role,
            trackingNumber: data.trackingNumber,
            trackingCarrier: data.trackingCarrier
        });
    }

    static async deleteOrder(id: string, role: Role) {
        if (role !== Role.SUPER_ADMIN) throw new Error('Unauthorized');
        return await prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    static async restoreOrder(id: string, role: Role) {
        if (role !== Role.SUPER_ADMIN) throw new Error('Unauthorized');
        return await prisma.order.update({
            where: { id },
            data: { deletedAt: null }
        });
    }

    static async refundOrder(id: string, userId: string, role: string, data: {
        amount?: number;
        reason?: string;
        restoreInventory?: boolean;
    }) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });
            if (!order) throw new Error('Order not found');

            // 1. Authorization
            const isSuperAdmin = role === Role.SUPER_ADMIN;
            let isVendor = false;
            if (role === Role.SELLER) {
                const vendor = await tx.vendor.findUnique({ where: { ownerId: userId } });
                isVendor = vendor?.id === order.vendorId;
            }
            if (!isSuperAdmin && !isVendor) throw new Error('Unauthorized to issue refunds');

            // 2. Validation
            if (order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED) {
                throw new Error('Can only refund paid orders');
            }

            const refundAmount = data.amount || order.totalAmount;
            const alreadyRefunded = order.refundedAmount || 0;
            const remainingToRefund = order.totalAmount - alreadyRefunded;

            if (refundAmount > remainingToRefund) {
                throw new Error(`Refund amount exceeds remaining balance. Max: ₹${remainingToRefund}`);
            }

            // 3. Process Stripe Refund
            if (order.stripeIntentId) {
                try {
                    await stripe.refunds.create({
                        payment_intent: order.stripeIntentId,
                        amount: Math.round(refundAmount * 100), // convert to cents
                        reason: 'requested_by_customer',
                        metadata: { orderId: order.id, processedBy: userId }
                    });
                } catch (stripeError: any) {
                    console.error('[OrderService] Stripe refund API call failed:', stripeError.message);
                    throw new Error(`Stripe Refund Failed: ${stripeError.message}`);
                }
            }

            // 4. Update Database
            const isFullRefund = Math.abs(refundAmount - remainingToRefund) < 0.01;
            const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
            const newOrderStatus = isFullRefund ? OrderStatus.CANCELLED : order.status;

            // 5. Restore Inventory if requested
            if (data.restoreInventory) {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }

            return await tx.order.update({
                where: { id },
                data: {
                    paymentStatus: newPaymentStatus,
                    status: newOrderStatus,
                    refundedAmount: (order.refundedAmount || 0) + refundAmount,
                    refundReason: data.reason || 'Admin/Vendor processed refund',
                    refundedAt: new Date(),
                    statusHistory: {
                        create: {
                            status: newOrderStatus,
                            notes: `Refund processed: ₹${refundAmount.toFixed(2)}. ${data.reason || ''}`
                        }
                    }
                },
                include: { items: true }
            });
        });
    }
}
