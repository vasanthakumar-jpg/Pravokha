import { Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class AdminController {
    static getStats = asyncHandler(async (req: any, res: Response) => {
        // 1. Basic counts
        const [totalProducts, totalUsers, totalSellers, totalSales, pendingOrders] = await Promise.all([
            prisma.product.count(),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'DEALER' } }),
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } })
        ]);

        // 2. Revenue and Orders for derived stats
        const orders = await prisma.order.findMany({
            select: {
                total: true,
                createdAt: true,
                items: true,
                status: true
            }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

        // 3. Sales Trend (Last 7 days)
        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.createdAt.toISOString().startsWith(dateStr)).length;
            salesTrend.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: dayOrders
            });
        }

        // 4. Revenue Growth (Last 6 months)
        const monthlyRevenue: { [key: string]: number } = {};
        orders.forEach(order => {
            const monthKey = order.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.total;
        });

        const revenueGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
            revenueGrowth.push({
                month: monthLabel,
                revenue: monthlyRevenue[monthKey] || 0
            });
        }

        // 5. Top Products & Category Distribution
        const productSales: { [key: string]: number } = {};
        const categoryCounts: { [key: string]: number } = {};

        orders.forEach(order => {
            // Note: In Prisma, items is a JsonValue. We need to cast it or handle it carefully.
            const items = order.items as any[];
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const productName = item.title || 'Unknown';
                    const category = item.category || 'Uncategorized';
                    const quantity = item.quantity || 1;

                    productSales[productName] = (productSales[productName] || 0) + quantity;
                    categoryCounts[category] = (categoryCounts[category] || 0) + quantity;
                });
            }
        });

        const topProducts = Object.entries(productSales)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        const categoryDistribution = Object.entries(categoryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        res.json({
            success: true,
            stats: {
                totalProducts,
                totalUsers,
                totalSellers,
                totalSales,
                pendingOrders,
                revenue: totalRevenue,
                salesTrend,
                topProducts,
                categoryDistribution,
                revenueGrowth
            }
        });
    });
    static getReports = asyncHandler(async (req: any, res: Response) => {
        const { range } = req.query; // '24h', '7d', '30d', 'all'

        const now = new Date();
        let startDate = new Date(0); // Default to all time

        if (range === '24h') startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (range === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (range === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        else if (range === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        else if (range === '1y') startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: startDate } },
            include: { items: true },
            orderBy: { createdAt: 'asc' }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const orderCount = orders.length;

        // Sales over time (timeline)
        const salesData: { [key: string]: { revenue: number, orders: number } } = {};
        orders.forEach(order => {
            const dateStr = order.createdAt.toISOString().split('T')[0];
            if (!salesData[dateStr]) salesData[dateStr] = { revenue: 0, orders: 0 };
            salesData[dateStr].revenue += order.total;
            salesData[dateStr].orders += 1;
        });

        const timeline = Object.entries(salesData).map(([date, data]) => ({
            name: date,
            ...data
        }));

        // Category distribution and product stats
        const categoryCounts: { [key: string]: number } = {};
        const productStats: { [key: string]: { name: string, sales: number, revenue: number } } = {};

        orders.forEach(order => {
            const items = order.items as any[];
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const category = item.category || 'Uncategorized';
                    const productName = item.title || 'Unknown';
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;

                    categoryCounts[category] = (categoryCounts[category] || 0) + quantity;

                    if (!productStats[productName]) {
                        productStats[productName] = { name: productName, sales: 0, revenue: 0 };
                    }
                    productStats[productName].sales += quantity;
                    productStats[productName].revenue += price * quantity;
                });
            }
        });

        const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const activeSellers = await prisma.user.count({ where: { role: 'DEALER', status: 'ACTIVE' } });

        res.json({
            success: true,
            reports: {
                totalRevenue,
                orderCount,
                activeSellers,
                timeline,
                categoryDistribution,
                topProducts
            }
        });
    });
    static getSiteSettings = asyncHandler(async (req: any, res: Response) => {
        let settings = await prisma.siteSetting.findUnique({ where: { id: 'primary' } });
        if (!settings) {
            settings = await prisma.siteSetting.create({ data: { id: 'primary' } });
        }
        res.json({ success: true, settings });
    });

    static updateSiteSettings = asyncHandler(async (req: any, res: Response) => {
        const settings = await prisma.siteSetting.update({
            where: { id: 'primary' },
            data: req.body
        });
        res.json({ success: true, settings });
    });

    static getNotificationSettings = asyncHandler(async (req: any, res: Response) => {
        let settings = await prisma.adminNotificationSetting.findUnique({
            where: { adminId: req.user.id }
        });
        if (!settings) {
            settings = await prisma.adminNotificationSetting.create({
                data: { adminId: req.user.id }
            });
        }
        res.json({ success: true, settings });
    });

    static updateNotificationSettings = asyncHandler(async (req: any, res: Response) => {
        const settings = await prisma.adminNotificationSetting.update({
            where: { adminId: req.user.id },
            data: req.body
        });
        res.json({ success: true, settings });
    });

    static getRoleCounts = asyncHandler(async (req: any, res: Response) => {
        const [super_admins, sellers, support] = await Promise.all([
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'DEALER' } }),
            prisma.user.count({ where: { role: 'USER' } })
        ]);

        res.json({
            success: true,
            counts: {
                super_admins,
                sellers,
                support
            }
        });
    });

    static listProductUpdateRequests = asyncHandler(async (req: any, res: Response) => {
        const requests = await prisma.productUpdateRequest.findMany({
            include: {
                product: {
                    select: {
                        title: true,
                        sku: true,
                        price: true,
                        description: true,
                        categoryId: true
                    }
                },
                seller: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, requests });
    });

    static handleProductUpdateRequest = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const request = await prisma.productUpdateRequest.findUnique({
            where: { id },
            include: { product: true }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (status === 'approved') {
            const requestedChanges = request.requestedChanges as any;
            const { reason, ...changes } = requestedChanges;

            await prisma.product.update({
                where: { id: request.productId },
                data: changes
            });
        }

        await prisma.productUpdateRequest.update({
            where: { id },
            data: { status, adminNotes }
        });

        res.json({ success: true, message: `Request ${status}` });
    });
}
