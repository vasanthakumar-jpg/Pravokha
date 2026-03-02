import { prisma } from '../../infra/database/client';
import { Role, OrderStatus } from '@prisma/client';

export class AnalyticsService {
    static async getSellerStats(vendorId: string) {
        const [totalProducts, totalOrders, reviews] = await Promise.all([
            prisma.product.count({ where: { vendorId } }),
            prisma.order.count({ where: { vendorId } }),
            prisma.productReview.findMany({
                where: {
                    product: {
                        vendorId: vendorId
                    }
                },
                select: { rating: true }
            })
        ]);

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Revenue aggregation
        const revenueResult = await prisma.order.aggregate({
            where: {
                vendorId,
                status: OrderStatus.DELIVERED
            },
            _sum: { totalAmount: true }
        });

        return {
            totalProducts,
            totalOrders,
            totalRevenue: revenueResult._sum.totalAmount || 0,
            avgRating
        };
    }

    static async getPlatformStats() {
        const [totalUsers, totalVendors, totalProducts, totalOrders] = await Promise.all([
            prisma.user.count({ where: { role: Role.CUSTOMER } }),
            prisma.vendor.count(),
            prisma.product.count(),
            prisma.order.count()
        ]);

        const revenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: OrderStatus.DELIVERED }
        });

        return {
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders,
            totalRevenue: revenue._sum.totalAmount || 0
        };
    }
}
