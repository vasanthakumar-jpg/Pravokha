import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export class ReportService {
    static async generateOrdersReport(userId: string, role: Role, format: 'csv' | 'json' = 'json') {
        let where: any = {};

        if (role === Role.DEALER) {
            where.items = {
                some: { sellerId: userId }
            };
        } else if (role !== Role.ADMIN) {
            where.userId = userId;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'csv') {
            // Basic CSV generation logic
            const header = 'Order ID,Date,Customer,Total,Status\n';
            const rows = orders.map(o =>
                `${o.orderNumber},${o.createdAt.toISOString()},${o.customerName},${o.total},${o.status}`
            ).join('\n');
            return header + rows;
        }

        return orders;
    }
}
