import { PayoutStatus, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../infra/database/client';
import MarketplaceConfig from '../../shared/config/marketplace';

export class PayoutService {
    static async listPayouts(role: Role, userId: string, skip: number = 0, take: number = 10) {
        let where = {};

        if (role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (!vendor) return [];
            where = { vendorId: vendor.id };
        } else if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
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

        // 2. Create payout record
        return await prisma.payout.create({
            data: {
                vendorId: vendorId,
                amount,
                status: PayoutStatus.PENDING
            }
        });
    }

    static async getVendorBalance(vendorId: string) {
        // Find all orders for this vendor that are delivered and paid
        const orders = await prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.PAID
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
                paymentStatus: PaymentStatus.PAID
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
        if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
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
        if (role === Role.SELLER && userId) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (!vendor) throw new Error('Vendor not found');
            return await this.getVendorBalance(vendor.id);
        }

        if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
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
