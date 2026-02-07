import { PrismaClient } from '@prisma/client';
import { emailService } from '../email/service';

const prisma = new PrismaClient();

export class InventoryService {
    /**
     * Check stock levels and create alerts for low stock
     */
    async checkLowStockProducts() {
        // Find products below threshold
        const allProducts = await prisma.product.findMany({
            where: {
                isBlocked: false,
                deletedAt: null
            },
            include: {
                vendor: true
            }
        });

        // Filter products where stock < lowStockThreshold
        const lowStockProducts = allProducts.filter(
            product => product.stock < product.lowStockThreshold
        );

        for (const product of lowStockProducts) {
            await this.createStockAlert(product.id, product.vendorId, product.stock, product.lowStockThreshold);
        }
    }

    /**
     * Create stock alert
     */
    async createStockAlert(productId: string, vendorId: string, currentStock: number, threshold: number) {
        // Check if alert already exists and not notified
        const existingAlert = await prisma.stockAlert.findFirst({
            where: {
                productId,
                notified: false
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        // Create alert
        const alert = await prisma.stockAlert.create({
            data: {
                productId,
                vendorId,
                currentStock,
                threshold
            },
            include: {
                product: true,
                vendor: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        // Send email to vendor
        await this.sendLowStockEmail(alert);

        // Update product's last stock alert timestamp
        await prisma.product.update({
            where: { id: productId },
            data: { lastStockAlert: new Date() }
        });

        // Mark alert as notified
        await prisma.stockAlert.update({
            where: { id: alert.id },
            data: { notified: true }
        });

        return alert;
    }

    /**
     * Send low stock email
     */
    private async sendLowStockEmail(alert: any) {
        const vendor = alert.vendor;
        const product = alert.product;

        if (vendor.owner) {
            await emailService.sendLowStockAlert({
                sellerEmail: vendor.owner.email,
                sellerName: vendor.owner.name || vendor.storeName,
                productTitle: product.title,
                currentStock: alert.currentStock,
                threshold: alert.threshold,
                productUrl: `${process.env.CLIENT_URL}/seller/products`
            });
        }
    }

    /**
     * Manually trigger stock check for a product
     */
    async checkProductStock(productId: string) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { vendor: { include: { owner: true } } }
        });

        if (!product) {
            throw new Error('Product not found');
        }

        if (product.stock < product.lowStockThreshold) {
            return await this.createStockAlert(
                product.id,
                product.vendorId,
                product.stock,
                product.lowStockThreshold
            );
        }

        return null;
    }

    /**
     * Get stock alerts for a vendor
     */
    async getVendorAlerts(vendorId: string, limit: number = 20) {
        return await prisma.stockAlert.findMany({
            where: { vendorId },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Dismiss alert (when stock is replenished)
     */
    async dismissAlert(alertId: string) {
        return await prisma.stockAlert.delete({
            where: { id: alertId }
        });
    }
}

export const inventoryService = new InventoryService();
