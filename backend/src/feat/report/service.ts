import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export class ReportService {
    static async generateOrdersReport(userId: string, role: Role, format: 'csv' | 'json' = 'json') {
        let where: any = { deletedAt: null };

        if (role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
            if (!vendor) return [];
            where.vendorId = vendor.id;
        } else if (role === Role.CUSTOMER) {
            where.customerId = userId;
        } else if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
            throw new Error('Unauthorized');
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: { include: { product: true } },
                vendor: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'csv') {
            const header = 'Order ID,Date,Customer,Total,Vendor,Status\n';
            const rows = orders.map(o =>
                `${o.orderNumber},${o.createdAt.toISOString()},${o.customerName},${o.totalAmount},${o.vendor?.storeName || 'N/A'},${o.status}`
            ).join('\n');
            return header + rows;
        }

        return orders;
    }
}
