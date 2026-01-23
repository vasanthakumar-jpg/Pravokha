import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export class AnalyticsService {
    static async getSellerStats(sellerId: string) {
        // This mirrors the frontend aggregation but on the backend for performance/structure
        const [totalProducts, totalOrders, reviews] = await Promise.all([
            prisma.product.count({ where: { dealerId: sellerId } }),
            prisma.order.count({
                where: {
                    items: {
                        some: {
                            sellerId: sellerId
                        }
                    }
                }
            }),
            prisma.productReview.findMany({
                where: {
                    product: {
                        dealerId: sellerId
                    }
                },
                select: { rating: true }
            })
        ]);

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Revenue aggregation
        const orders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        sellerId: sellerId
                    }
                },
                status: 'DELIVERED'
            },
            select: { total: true }
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

        return {
            totalProducts,
            totalOrders,
            totalRevenue,
            avgRating
        };
    }

    static async getPlatformStats() {
        const [totalUsers, totalSellers, totalProducts, totalOrders] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: Role.DEALER } }),
            prisma.product.count(),
            prisma.order.count()
        ]);

        const revenue = await prisma.order.aggregate({
            _sum: { total: true },
            where: { status: 'DELIVERED' }
        });

        return {
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            totalRevenue: revenue._sum.total || 0
        };
    }
}
