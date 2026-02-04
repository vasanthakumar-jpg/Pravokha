import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { stripe } from '../../infra/stripe';
import { Role, PaymentStatus, OrderStatus } from '@prisma/client';

export class PaymentController {
    static listPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const methods = await prisma.paymentMethod.findMany({
            where: { userId: user.id },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({ success: true, paymentMethods: methods });
    });

    static addPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { cardLast4, cardBrand, cardExpMonth, cardExpYear, cardHolderName, isDefault, type, label, details } = req.body;

        const method = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.paymentMethod.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
            }
            return tx.paymentMethod.create({
                data: {
                    userId: user.id,
                    cardLast4,
                    cardBrand,
                    cardExpMonth,
                    cardExpYear,
                    cardHolderName,
                    isDefault: isDefault || false,
                    type: type || 'card',
                    label: label || 'Personal',
                    details: details || {}
                }
            });
        });
        res.status(201).json({ success: true, paymentMethod: method });
    });

    static deletePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        await prisma.paymentMethod.delete({ where: { id, userId: user.id } });
        res.json({ success: true, message: 'Payment method removed' });
    });

    static createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { items, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Fetch dynamic settings from database
        const settings = await prisma.siteSetting.findUnique({ where: { id: 'primary' } });
        const taxRate = settings?.taxRate || 18;
        const baseShippingFee = 50; // New Requirement: Flat ₹50

        // Check if user is eligible for free shipping (first 3 orders)
        let applicableShipping = baseShippingFee;
        if (user?.id) {
            const orderCount = await prisma.order.count({
                where: { customerId: user.id }
            });
            if (orderCount < 3) {
                applicableShipping = 0;
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const vendorGroupedItems: Record<string, any[]> = {};

            // 1. Validate products and group by vendor
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { vendor: true }
                });

                if (!product || !product.vendorId) {
                    throw new Error(`Product ${item.productId} not found or vendor missing`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.title}`);
                }

                const itemPrice = product.price;
                const subtotal = itemPrice * item.quantity;
                totalAmount += subtotal;

                if (!vendorGroupedItems[product.vendorId]) {
                    vendorGroupedItems[product.vendorId] = [];
                }

                vendorGroupedItems[product.vendorId].push({
                    productId: product.id,
                    priceAtPurchase: itemPrice,
                    quantity: item.quantity,
                    subtotal,
                    variantId: item.variantId,
                    color: item.color,
                    size: item.size
                });
            }

            // 2. Add Shipping and Tax
            const taxAmount = Math.round((totalAmount + applicableShipping) * (taxRate / 100)); // GST on product + shipping
            const grandTotal = totalAmount + applicableShipping + taxAmount;

            // 3. Validate Stripe Minimum (₹50)
            if (grandTotal < 50) {
                const error = new Error(`Orders below ₹50 cannot be processed online. Please add more items or choose COD.`);
                (error as any).statusCode = 400;
                throw error;
            }

            // 4. Create Stripe Payment Intent for full amount
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(grandTotal * 100),
                currency: 'inr',
                metadata: {
                    userId: user?.id || 'GUEST',
                    vendorCount: Object.keys(vendorGroupedItems).length.toString()
                }
            });

            // 4. Create Orders (Split by Vendor)
            const orders = [];
            const vendorCount = Object.keys(vendorGroupedItems).length;

            // We'll distribute the shipping fee to the first vendor's order for simplicity in accounting
            let remainingShipping = applicableShipping;

            for (const [vendorId, vendorItems] of Object.entries(vendorGroupedItems)) {
                const vendorSubtotal = vendorItems.reduce((sum, i) => sum + i.subtotal, 0);
                const vendorTax = Math.round(vendorSubtotal * (taxRate / 100));

                // Assign shipping fee to the first order, or keep it 0 for others
                const orderShipping = remainingShipping;
                remainingShipping = 0; // Only first order gets the shipping fee record

                const vendorTotal = vendorSubtotal + vendorTax + orderShipping;
                const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });

                if (!vendor) {
                    throw new Error(`Vendor not found for product (Vendor ID: ${vendorId}). Contact support.`);
                }

                const platformFee = vendorTotal * ((vendor?.commissionRate || settings?.commissionRate || 10) / 100);
                const vendorEarnings = vendorTotal - platformFee;

                const order = await tx.order.create({
                    data: {
                        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                        customerId: user?.id || 'GUEST',
                        vendorId,
                        totalAmount: vendorTotal,
                        platformFee,
                        vendorEarnings,
                        shippingFee: orderShipping,
                        taxAmount: vendorTax,
                        status: OrderStatus.PENDING,
                        paymentStatus: PaymentStatus.UNPAID,
                        paymentMethod: 'stripe',
                        stripeIntentId: paymentIntent.id,
                        customerName: shippingAddress.name,
                        customerEmail: shippingAddress.email,
                        customerPhone: shippingAddress.phone,
                        shippingAddress: JSON.stringify(shippingAddress),
                        items: { create: vendorItems }
                    }
                });
                orders.push(order);
            }

            return {
                clientSecret: paymentIntent.client_secret,
                orderId: orders[0]?.id,
                orderNumber: orders[0]?.orderNumber,
                orders: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber })),
                totalAmount: grandTotal,
                amount: grandTotal, // Match frontend expectations
                subtotal: totalAmount,
                shipping: applicableShipping,
                tax: taxAmount
            };
        });

        res.json({ success: true, ...result });
    });

    static refundOrder = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const { amount, reason } = req.body;
        const user = (req as any).user;

        if (user.role !== Role.SUPER_ADMIN) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.stripeIntentId) {
            return res.status(404).json({ success: false, message: 'Order or payment intent not found' });
        }

        const refund = await stripe.refunds.create({
            payment_intent: order.stripeIntentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });

        const isPartial = amount && amount < order.totalAmount;
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: isPartial ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
                refundedAmount: amount || order.totalAmount,
                refundReason: reason || 'Admin initiated refund',
                refundedAt: new Date()
            }
        });

        res.json({ success: true, order: updatedOrder, refundId: refund.id });
    });

    static getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const user = (req as any).user;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });

        if (!order || (order.customerId !== user.id && user.role === Role.CUSTOMER)) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let currentStatus = order.paymentStatus;
        let paidAt = order.paidAt;

        // Proactive Sync: If DB says NOT PAID, but we have a Stripe ID, check Stripe directly
        if (currentStatus !== PaymentStatus.PAID && order.stripeIntentId) {
            try {
                const intent = await stripe.paymentIntents.retrieve(order.stripeIntentId);
                if (intent.status === 'succeeded') {
                    console.log(`[PaymentStatus] Proactively updated order ${order.id} to PAID via Stripe check.`);

                    // Update DB immediately (mimic webhook logic)
                    const updated = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: PaymentStatus.PAID,
                            status: OrderStatus.CONFIRMED,
                            paidAt: new Date(),
                            paymentMethod: intent.payment_method_types[0] || 'card'
                        }
                    });
                    currentStatus = updated.paymentStatus;
                    paidAt = updated.paidAt;
                }
            } catch (err) {
                console.error(`[PaymentStatus] Failed to check Stripe for intent ${order.stripeIntentId}:`, err);
            }
        }

        res.json({
            success: true,
            orderNumber: order.orderNumber,
            paymentStatus: currentStatus,
            totalAmount: order.totalAmount,
            paidAt: paidAt,
            refundedAt: order.refundedAt,
            refundedAmount: order.refundedAmount
        });
    });

    static getPublicSettings = asyncHandler(async (req: Request, res: Response) => {
        const settings = await prisma.siteSetting.findUnique({ where: { id: 'primary' } });
        res.json({
            success: true,
            settings: {
                taxRate: settings?.taxRate || 18,
                shippingFee: settings?.defaultShippingFee || 99,
                storeName: settings?.storeName || 'Pravokha'
            }
        });
    });
}
