import { PayoutStatus, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../infra/database/client';
import { isRole, isSuperAdmin, isAdmin, isSeller } from '../../shared/utils/role.utils';
import MarketplaceConfig from '../../shared/config/marketplace';

export class PayoutService {
    static async listPayouts(role: Role, userId: string, skip: number = 0, take: number = 10) {
        let where: any = {};

        if (isSeller(role)) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
            where.vendorId = vendor.id;
        } else if (!isSuperAdmin(role) && !isAdmin(role)) {
            throw new Error('Unauthorized');
        }

        return await prisma.payout.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                vendor: {
                    select: {
                        storeName: true,
                        bankAccountNumber: true,
                        bankIfscCode: true,
                        beneficiaryName: true,
                        owner: {
                            select: { email: true, name: true }
                        }
                    }
                }
            }
        });
    }

    static async createPayoutRequest(vendorId: string, amount: number) {
        // 1. Calculate current balance
        const balanceInfo = await this.getVendorBalance(vendorId);

        if (amount > balanceInfo.pendingBalance) {
            throw new Error('Insufficient balance');
        }

        if (amount < MarketplaceConfig.payout.minAmount) {
            throw new Error(`Minimum payout request is ₹${MarketplaceConfig.payout.minAmount}`);
        }

        // 2. Use transaction to prevent race conditions
        return await prisma.$transaction(async (tx) => {
            // Re-calculate balance inside transaction for absolute safety
            const balanceInfo = await this.getVendorBalance(vendorId);

            if (amount > balanceInfo.pendingBalance) {
                throw new Error(`Insufficient balance. Available: ₹${balanceInfo.pendingBalance}`);
            }

            return await tx.payout.create({
                data: {
                    vendorId: vendorId,
                    amount,
                    status: PayoutStatus.PENDING
                }
            });
        }, { isolationLevel: 'Serializable' });
    }

    static async getVendorBalance(vendorId: string) {
        // Enforce 7-day Cooling Off Period (Perfect 10)
        const coolingOffDate = new Date();
        coolingOffDate.setDate(coolingOffDate.getDate() - 7);

        const orders = await prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.PAID,
                deliveredAt: {
                    lte: coolingOffDate
                }
            },
            select: {
                vendorEarnings: true
            }
        });

        const totalNetEarnings = orders.reduce((sum, o) => sum + (o.vendorEarnings || 0), 0);

        // Subtract already requested/completed payouts
        const payouts = await prisma.payout.findMany({
            where: {
                vendorId,
                status: {
                    in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING, PayoutStatus.PAID, PayoutStatus.COMPLETED]
                }
            },
            select: {
                amount: true
            }
        });

        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
        const pendingBalance = Math.max(0, totalNetEarnings - totalPaidOut);

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        return {
            totalEarnings: totalNetEarnings, // Already net in Order model
            commissionRate: vendor?.commissionRate || 10,
            minPayoutAmount: MarketplaceConfig.payout.minAmount,
            totalPaidOut,
            pendingBalance
        };
    }

    static async getTransactions(vendorId: string) {
        // Fetch delivered orders as "earnings" transactions
        const orders = await prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.PAID,
                // We show all delivered orders in transactions, but balance is filtered by cooling off
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return orders.map(order => ({
            id: order.id,
            order_id: order.orderNumber,
            amount: order.totalAmount,
            commission: order.platformFee,
            net_amount: order.vendorEarnings,
            date: order.createdAt,
            status: 'completed'
        }));
    }

    static async updatePayoutStatus(id: string, status: PayoutStatus, rejectionReason: string | null, role: Role) {
        if (!isSuperAdmin(role) && !isAdmin(role)) {
            throw new Error('Unauthorized');
        }

        return await prisma.payout.update({
            where: { id },
            data: {
                status,
                rejectionReason: rejectionReason || null,
                paidAt: (status === PayoutStatus.PAID || status === PayoutStatus.COMPLETED) ? new Date() : undefined
            }
        });
    }

    static async getPayoutStats(role: Role, userId?: string) {
        if (isSeller(role) && userId) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (!vendor) throw new Error('Vendor not found');
            return await this.getVendorBalance(vendor.id);
        }

        if (!isSuperAdmin(role) && !isAdmin(role)) {
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
            completedPayouts: payouts.filter(r => r.status === PayoutStatus.PAID || r.status === PayoutStatus.COMPLETED).length
        };
    }
}
