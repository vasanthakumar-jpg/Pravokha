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
        items: { productId: string; quantity: number }[];
    }) {
        // 1. Generate Order Number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        return await prisma.$transaction(async (tx) => {
            let total = 0;
            const orderItems = [];

            // 2. Validate Stock and Calculate Total
            for (const item of data.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product.title}`);
                }

                // Atomic stock decrement
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                total += product.price * item.quantity;
                orderItems.push({
                    productId: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: item.quantity,
                });
            }

            // 3. Create Order in Database
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    total: total,
                    status: OrderStatus.PENDING,
                    paymentStatus: PaymentStatus.PENDING,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    customerPhone: data.customerPhone,
                    shippingAddress: data.shippingAddress,
                    shippingCity: data.shippingCity,
                    shippingPincode: data.shippingPincode,
                    userId: data.userId,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: true
                }
            });

            // 4. Create Stripe PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(total * 100), // Stripe expects cents
                currency: 'inr',
                metadata: { orderId: order.id, orderNumber: order.orderNumber },
                receipt_email: data.customerEmail,
            });

            // Update order with payment intent ID
            await tx.order.update({
                where: { id: order.id },
                data: { stripeIntentId: paymentIntent.id } as any
            });

            return {
                order,
                clientSecret: paymentIntent.client_secret,
            };
        });
    }

    static async getOrderById(id: string, userId?: string, role?: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) return null;

        // Access Control
        if (role !== 'ADMIN' && order.userId !== userId) {
            throw new Error('Unauthorized access to order');
        }

        return order;
    }

    static async listOrders(userId?: string, role?: string) {
        if (role === Role.ADMIN) {
            return await prisma.order.findMany({
                orderBy: { createdAt: 'desc' },
                include: { items: true }
            });
        }

        return await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
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

    static async updateOrderStatus(id: string, status: OrderStatus, trackingUpdates: any, role: Role) {
        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        return await prisma.order.update({
            where: { id },
            data: {
                status,
                trackingUpdates: trackingUpdates || undefined
            },
            include: { items: true }
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
}
