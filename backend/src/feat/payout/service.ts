import { PayoutStatus, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../infra/database/client';
import { MARKETPLACE_FEE_PERCENTAGE } from '../../../../src/lib/constants'; // This is a bit unusual to import from src to backend, but let's assume it's shared or hardcode if needed. Actually, let's just use 0.10 to avoid path issues if it's not strictly shared.
// For robust backend service, we should probably have a constants file in backend too.

export class PayoutService {
    static async listPayouts(role: Role, userId: string) {
        let where = {};

        if (role === Role.DEALER) {
            where = { sellerId: userId };
        } else if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        return await prisma.payout.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: {
                        storeName: true,
                        email: true,
                        bankAccount: true,
                        ifsc: true,
                        beneficiaryName: true
                    }
                }
            }
        });
    }

    static async createPayoutRequest(sellerId: string, amount: number) {
        // 1. Calculate current balance
        const balanceInfo = await this.getSellerBalance(sellerId);

        if (amount > balanceInfo.pendingBalance) {
            throw new Error('Insufficient balance');
        }

        if (amount < 1000) {
            throw new Error('Minimum payout request is ₹1,000');
        }

        // 2. Create payout record
        return await prisma.payout.create({
            data: {
                sellerId,
                amount,
                status: PayoutStatus.PENDING,
                periodStart: new Date(), // Logic for periods can be more complex, but for now simple
                periodEnd: new Date(),
            }
        });
    }

    static async getSellerBalance(sellerId: string) {
        // Find all order items for this seller that are part of delivered and paid orders
        const deliveredItems = await prisma.orderItem.findMany({
            where: {
                sellerId,
                order: {
                    status: OrderStatus.DELIVERED,
                    paymentStatus: PaymentStatus.PAID,
                }
            },
            select: {
                price: true,
                quantity: true
            }
        });

        const totalEarnings = deliveredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const commission = totalEarnings * 0.10; // MARKETPLACE_FEE_PERCENTAGE
        const netEarnings = totalEarnings - commission;

        // Subtract already requested/completed payouts
        const payouts = await prisma.payout.findMany({
            where: {
                sellerId,
                status: {
                    in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING, PayoutStatus.COMPLETED]
                }
            },
            select: {
                amount: true
            }
        });

        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
        const pendingBalance = Math.max(0, netEarnings - totalPaidOut);

        return {
            totalEarnings,
            commission,
            netEarnings,
            totalPaidOut,
            pendingBalance
        };
    }

    static async getTransactions(sellerId: string) {
        // Virtual ledger combining Order earnings and Payout withdrawals
        const deliveredItems = await prisma.orderItem.findMany({
            where: {
                sellerId,
                order: {
                    status: OrderStatus.DELIVERED,
                    paymentStatus: PaymentStatus.PAID,
                }
            },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'desc'
                }
            }
        });

        return deliveredItems.map(item => ({
            id: item.id,
            order_id: item.order.orderNumber,
            amount: item.price * item.quantity,
            commission: (item.price * item.quantity) * 0.10,
            net_amount: (item.price * item.quantity) * 0.90,
            date: item.order.createdAt,
            status: 'completed'
        }));
    }

    static async updatePayoutStatus(id: string, status: PayoutStatus, rejectionReason: string | null, role: Role) {
        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        return await prisma.payout.update({
            where: { id },
            data: {
                status,
                rejectionReason: rejectionReason || undefined
            }
        });
    }

    static async getPayoutStats(role: Role, userId?: string) {
        if (role === Role.DEALER && userId) {
            return await this.getSellerBalance(userId);
        }

        if (role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        const payouts = await prisma.payout.findMany();

        const pendingRequests = payouts.filter(r => r.status === PayoutStatus.PENDING);
        const pendingPayoutCount = pendingRequests.length;
        const pendingPayoutAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

        return {
            pendingPayoutCount,
            pendingPayoutAmount,
            totalPayouts: payouts.length,
            completedPayouts: payouts.filter(r => r.status === PayoutStatus.COMPLETED).length
        };
    }
}
