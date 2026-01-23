import { PayoutStatus, Role } from '@prisma/client';
import { prisma } from '../../infra/database/client';

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
                        name: true,
                        email: true,
                        bankAccount: true,
                        ifsc: true,
                        beneficiaryName: true
                    }
                }
            }
        });
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

    static async getPayoutStats(role: Role) {
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
