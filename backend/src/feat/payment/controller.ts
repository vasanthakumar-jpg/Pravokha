import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { isCustomer } from '../../shared/utils/role.utils';
import { Role, PaymentStatus, OrderStatus, TransactionStatus } from '@prisma/client';
import { RazorpayService } from './razorpay.service';
import { verifyRazorpaySignature } from '../../infra/payment/razorpay';
import { ShippingService } from '../../services/ShippingService';

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

        // Security: Check if user is suspended
        if (user && user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your account is under compliance review and cannot perform new transactions.'
            });
        }

        // Fetch dynamic settings from database
        const settings = await prisma.siteSetting.findUnique({ where: { id: 'primary' } });
        const taxRate = settings?.taxRate || 18;

        const { pincode } = shippingAddress;
        if (!pincode) {
            return res.status(400).json({ success: false, message: 'Shipping pincode is required' });
        }

        // 1. Calculate Shipping Fee upfront (multi-vendor aware)
        const shippingResult = await ShippingService.calculateShipping(
            items.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity,
                sellerId: i.sellerId
            })),
            pincode,
            false, // Online payment intent
            false
        );

        const baseShippingFee = (settings as any)?.freeShippingThreshold && items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) >= (settings as any).freeShippingThreshold
            ? 0
            : shippingResult.totalShippingFee;

        const applicableShipping = baseShippingFee;

        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const vendorGroupedItems: Record<string, any[]> = {};

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

            const { ComboOfferService } = require('../combo-offer/service');
            const { totalDiscount, appliedOffers } = await ComboOfferService.calculateComboDiscount(items);

            const subtotalAfterCombos = totalAmount - totalDiscount;
            const taxAmount = Math.round((subtotalAfterCombos + applicableShipping) * (taxRate / 100));
            const grandTotal = subtotalAfterCombos + applicableShipping + taxAmount;

            const orders = [];
            let remainingShipping = applicableShipping;

            for (const [vendorId, vendorItems] of Object.entries(vendorGroupedItems)) {
                const vendorSubtotal = vendorItems.reduce((sum, i) => sum + i.subtotal, 0);
                const vendorTax = Math.round(vendorSubtotal * (taxRate / 100));

                const orderShipping = remainingShipping;
                remainingShipping = 0;

                const vendorTotal = vendorSubtotal + vendorTax + orderShipping;
                const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });

                if (!vendor) {
                    throw new Error(`Vendor not found for product (Vendor ID: ${vendorId})`);
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
                        status: OrderStatus.PENDING,
                        paymentStatus: PaymentStatus.UNPAID,
                        paymentMethod: 'online',
                        customerName: shippingAddress.name,
                        customerEmail: shippingAddress.email,
                        customerPhone: shippingAddress.phone,
                        shippingAddress: JSON.stringify(shippingAddress),
                        // Snap shipping details to the order
                        shippingFee: orderShipping,
                        taxAmount: vendorTax,
                        chargeableWeight: shippingResult.breakdown.find(b => b.vendorId === vendorId)?.chargeableWeight || 0.5,
                        appliedZone: shippingResult.breakdown.find(b => b.vendorId === vendorId)?.zone || 'Default',
                        shippingBreakdownJson: JSON.stringify(shippingResult.breakdown.find(b => b.vendorId === vendorId)),
                        items: { create: vendorItems }
                    } as any
                });
                orders.push(order);
            }

            const razorpayOrder = await RazorpayService.createRazorpayOrder(orders[0].id, grandTotal);

            // Link other orders in metadata for reconciliation
            if (orders.length > 1) {
                await tx.paymentTransaction.update({
                    where: { razorpayOrderId: razorpayOrder.id },
                    data: {
                        metadata: JSON.stringify({
                            otherOrderIds: orders.slice(1).map(o => o.id),
                            itemsCount: items.length
                        })
                    }
                });
            }

            return {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: orders[0]?.id,
                orderNumber: orders[0]?.orderNumber,
                orders: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber })),
                totalAmount: grandTotal,
                discount: totalDiscount,
                appliedOffers,
                shipping: applicableShipping,
                tax: taxAmount
            };
        });

        res.json({ success: true, data: result });
    });

    static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        if (!isValid) {
            await prisma.paymentTransaction.update({
                where: { razorpayOrderId: razorpayOrderId },
                data: {
                    status: TransactionStatus.FAILED,
                    failureReason: 'Signature verification failed'
                }
            });
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const result = await RazorpayService.handlePaymentSuccess(
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        res.json({ success: true, data: result });
    });

    static refundOrder = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const { amount, reason } = req.body;
        const user = (req as any).user;

        if (user.role !== Role.SUPER_ADMIN) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

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

        res.json({ success: true, order: updatedOrder, message: 'Refund processed in database' });
    });

    static getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const user = (req as any).user;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });

        if (!order || (order.customerId !== user.id && isCustomer(user.role))) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            paidAt: order.paidAt,
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
                freeShippingThreshold: (settings as any)?.freeShippingThreshold || 1999,
                storeName: settings?.storeName || 'Pravokha'
            }
        });
    });
}
