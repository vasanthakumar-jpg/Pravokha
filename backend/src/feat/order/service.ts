import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { stripe } from '../../infra/stripe';
import { prisma } from '../../infra/database/client';

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
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        return await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderItems = [];
            let tshirtCount = 0;

            // 1. Validate Stock and Calculate Subtotal
            for (const item of data.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) throw new Error(`Product with ID ${item.productId} not found`);
                if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.title}`);

                // Atomic stock decrement
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                if (product.price === 325) {
                    tshirtCount += item.quantity;
                }

                subtotal += product.price * item.quantity;
                orderItems.push({
                    productId: product.id,
                    sellerId: product.dealerId,
                    title: product.title,
                    price: product.price,
                    quantity: item.quantity,
                    variantId: item.variantId,
                    color: item.color,
                    size: item.size,
                });
            }

            // 2. Apply Combo Offer (3 T-shirts for 949)
            const comboSets = Math.floor(tshirtCount / 3);
            const comboSavings = comboSets * (3 * 325 - 949);

            const shipping = 99;
            const discountedSubtotal = subtotal - comboSavings;
            const tax = Math.round(discountedSubtotal * 0.18);
            const totalTotal = discountedSubtotal + shipping + tax;

            // 3. Map Statuses (Handle FE's "CONFIRMED")
            let orderStatus: OrderStatus = OrderStatus.PENDING;
            if (data.status === 'CONFIRMED') orderStatus = OrderStatus.PENDING; // Map to PENDING until reviewed or automated

            let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
            if (data.paymentStatus === 'PAID') paymentStatus = PaymentStatus.PAID;

            // 4. Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    total: totalTotal,
                    status: orderStatus,
                    paymentStatus: paymentStatus,
                    paymentMethod: data.paymentMethod || 'stripe',
                    stripeIntentId: data.stripeIntentId,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    customerPhone: data.customerPhone,
                    shippingAddress: data.shippingAddress,
                    shippingCity: data.shippingCity,
                    shippingPincode: data.shippingPincode,
                    userId: data.userId,
                    items: { create: orderItems }
                },
                include: { items: true }
            });

            // 5. Stripe Integration (Optional if not COD/already paid)
            let clientSecret = null;
            if (data.paymentMethod === 'stripe' && !data.stripeIntentId) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(totalTotal * 100),
                    currency: 'inr',
                    metadata: { orderId: order.id, orderNumber: order.orderNumber },
                    receipt_email: data.customerEmail,
                });

                await tx.order.update({
                    where: { id: order.id },
                    data: { stripeIntentId: paymentIntent.id }
                });
                clientSecret = paymentIntent.client_secret;
            }

            // 6. Notify Sellers
            const sellerIds = Array.from(new Set(orderItems.map(item => item.sellerId)));
            const { NotificationService } = await import('../notification/service');
            for (const sellerId of sellerIds) {
                await NotificationService.notifyNewOrder(sellerId, orderNumber).catch(e => console.error("Notification failed:", e));
            }

            return { order, clientSecret };
        });
    }

    static async getOrderById(id: string, userId?: string, role?: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { title: true, dealerId: true }
                        }
                    }
                }
            }
        });

        if (!order) return null;

        // Access Control - Strict data isolation
        if (role === Role.ADMIN) {
            // Admin can view all orders
            return order;
        }

        if (role === Role.DEALER) {
            // DEALER can only view orders containing at least one of their products
            const hasSellerItem = order.items.some(item => item.product.dealerId === userId);
            if (!hasSellerItem) {
                throw new Error('Forbidden: This order does not contain your products');
            }
            return order;
        }

        // Regular USER/CUSTOMER can only view their own orders
        if (order.userId !== userId) {
            throw new Error('Unauthorized access to order');
        }

        return order;
    }

    static async listOrders(userId?: string, role?: string, options: {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        search?: string;
        after?: string;
    } = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;
        const take = limit;

        let where: any = {};

        // 1. Role/Type Context Filtering
        const contextType = options.type || (role === Role.ADMIN ? 'admin' : (role === Role.DEALER ? 'seller' : 'buyer'));

        if (contextType === 'admin') {
            if (role !== Role.ADMIN) throw new Error('Unauthorized context for admin');
            // No base filter for admin
        } else if (contextType === 'seller') {
            // Filter orders containing items from this seller
            where.items = {
                some: {
                    sellerId: role === Role.ADMIN && options.type === 'seller' ? undefined : userId
                }
            };
        } else {
            // Default to buyer context
            where.userId = userId;
        }

        // 2. Status Filtering
        if (options.status && options.status !== 'all') {
            where.status = options.status as any;
        }

        // 3. Search Filtering
        if (options.search) {
            where.OR = [
                { orderNumber: { contains: options.search } },
                { customerName: { contains: options.search } },
                { customerEmail: { contains: options.search } }
            ];
        }

        // 4. Date Filtering
        if (options.after) {
            where.createdAt = { gte: new Date(options.after) };
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { title: true, slug: true }
                            }
                        }
                    }
                }
            }),
            prisma.order.count({ where: where as any })
        ]);

        return { orders, total };
    }

    static async getOrderStats(userId: string, role: string) {
        const stats: any = {
            buyerCount: 0,
            sellerCount: 0,
            adminCount: 0
        };

        // 1. Buyer Stats
        stats.buyerCount = await prisma.order.count({ where: { userId } });

        // 2. Seller Stats (if applicable)
        if (role === Role.DEALER || role === Role.ADMIN) {
            const sellerOrders = await prisma.orderItem.groupBy({
                by: ['orderId'],
                where: { sellerId: userId }
            });
            stats.sellerCount = sellerOrders.length;
        }

        // 3. Admin Stats (if applicable)
        if (role === Role.ADMIN) {
            stats.adminCount = await prisma.order.count();
        }

        return stats;
    }

    static async cancelOrder(id: string, userId: string, role: string) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order) throw new Error('Order not found');

            // Access Control: Only ADMIN or the owner can cancel
            if (role !== Role.ADMIN && order.userId !== userId) {
                throw new Error('Unauthorized');
            }

            // Business Logic: Cannot cancel if already shipped/delivered or already cancelled
            if (order.status === OrderStatus.SHIPPED ||
                order.status === OrderStatus.DELIVERED ||
                order.status === OrderStatus.CANCELLED) {
                throw new Error(`Cannot cancel order in ${order.status} status`);
            }

            // 1. Restore Stock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }

            // 2. Handle Stripe Refund if paid
            if (order.paymentStatus === PaymentStatus.PAID && order.stripeIntentId) {
                try {
                    await stripe.refunds.create({
                        payment_intent: order.stripeIntentId,
                    });
                } catch (stripeError) {
                    console.error('Stripe refund failed:', stripeError);
                    // We might not want to block cancellation if refund fails, 
                    // or we might want to flag it for manual review.
                }
            }

            // 3. Update Order Status
            return await tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.CANCELLED,
                    paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus
                },
                include: { items: true }
            });
        });
    }

    static async updateOrderStatus(id: string, newStatus: OrderStatus, options: {
        userId: string;
        role: Role;
        trackingNumber?: string;
        trackingCarrier?: string;
        trackingUpdates?: any;
        version?: number;
    }) {
        const { isValidTransition, getRequiredFieldsForTransition } = await import('./stateMachine');

        return await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id },
                include: { items: { select: { sellerId: true } } }
            });

            if (!currentOrder) throw new Error('Order not found');

            // 1. Authorization: ADMIN (All), DEALER (Owned items)
            if (options.role === Role.DEALER) {
                const ownsOrder = currentOrder.items.some(item => item.sellerId === options.userId);
                if (!ownsOrder) throw new Error('Unauthorized: You do not own any products in this order');
            } else if (options.role !== Role.ADMIN) {
                throw new Error('Unauthorized');
            }

            // 2. Concurrency Control: Optimistic Locking
            if (options.version !== undefined && currentOrder.version !== options.version) {
                throw new Error('Concurrency conflict: The order has been updated by another user. Please refresh and try again.');
            }

            // 3. State Machine Validation
            if (!isValidTransition(currentOrder.status, newStatus, options.role)) {
                throw new Error(`Invalid status transition from ${currentOrder.status} to ${newStatus} for role ${options.role}`);
            }

            // 4. Missing Field Validation
            const requiredFields = getRequiredFieldsForTransition(currentOrder.status, newStatus);
            for (const field of requiredFields) {
                if (!(options as any)[field]) {
                    throw new Error(`Required field missing for transition to ${newStatus}: ${field}`);
                }
            }

            // 5. Build Update Data
            const updateData: any = {
                status: newStatus,
                version: { increment: 1 },
                trackingUpdates: options.trackingUpdates || (currentOrder.trackingUpdates as any || []),
            };

            if (options.trackingNumber) updateData.trackingNumber = options.trackingNumber;
            if (options.trackingCarrier) updateData.trackingCarrier = options.trackingCarrier;

            // Set timestamps for milestones
            if (newStatus === OrderStatus.SHIPPED) {
                updateData.shippedAt = new Date();
                updateData.shippedBySellerId = options.role === Role.DEALER ? options.userId : null;
            } else if (newStatus === OrderStatus.DELIVERED) {
                updateData.deliveredAt = new Date();
            }

            // Add new tracking marker if not present
            const marker = {
                status: newStatus,
                timestamp: new Date().toISOString(),
                actorId: options.userId,
                actorRole: options.role
            };

            if (Array.isArray(updateData.trackingUpdates)) {
                updateData.trackingUpdates.push(marker);
            } else {
                updateData.trackingUpdates = [marker];
            }

            // 6. Execute Update
            const updatedOrder = await tx.order.update({
                where: {
                    id,
                    version: options.version // Triple safety
                },
                data: updateData,
                include: { items: true }
            });

            // 7. Trigger Notification
            const { NotificationService } = await import('../notification/service');
            if (updatedOrder.userId) {
                let additionalInfo = '';
                if (newStatus === OrderStatus.SHIPPED && options.trackingNumber) {
                    additionalInfo = `Tracking Number: ${options.trackingNumber}`;
                }
                await NotificationService.notifyOrderUpdate(updatedOrder.userId, updatedOrder.orderNumber, newStatus, additionalInfo).catch(e => console.error("Notification failed:", e));
            }

            return updatedOrder;
        });
    }

    static async deleteOrder(id: string, role: Role) {
        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        return await prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    static async restoreOrder(id: string, role: Role) {
        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        return await prisma.order.update({
            where: { id },
            data: { deletedAt: null }
        });
    }

    static async refundOrder(id: string, role: Role) {
        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) throw new Error('Order not found');

        // Stripe Refund if paid
        if (order.paymentStatus === PaymentStatus.PAID && order.stripeIntentId) {
            try {
                await stripe.refunds.create({
                    payment_intent: order.stripeIntentId,
                });
            } catch (stripeError) {
                console.error('Stripe refund failed:', stripeError);
            }
        }

        return await prisma.order.update({
            where: { id },
            data: { paymentStatus: PaymentStatus.REFUNDED }
        });
    }

    static async markOrderAsShipped(id: string, data: {
        sellerId: string;
        trackingNumber: string;
        trackingCarrier?: string;
        version?: number;
    }) {
        return await this.updateOrderStatus(id, OrderStatus.SHIPPED, {
            userId: data.sellerId,
            role: Role.DEALER,
            trackingNumber: data.trackingNumber,
            trackingCarrier: data.trackingCarrier,
            version: data.version
        });
    }

    static async verifySellerOwnsOrder(sellerId: string, orderId: string): Promise<boolean> {
        const count = await prisma.orderItem.count({
            where: {
                orderId,
                sellerId,
            }
        });
        return count > 0;
    }
}
