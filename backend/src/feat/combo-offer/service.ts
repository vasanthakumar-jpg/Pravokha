import { prisma } from '../../infra/database/client';
import { marketplaceEmitter, MARKETPLACE_EVENTS } from '../../shared/util/events';

export class ComboOfferService {
    static async createOffer(data: any) {
        const offer = await prisma.comboOffer.create({
            data: {
                title: data.title,
                description: data.description,
                // Handle both frontend (camelCase) and raw API (snake_case)
                productIds: JSON.stringify(data.productIds || data.product_ids || []),
                originalPrice: data.originalPrice ?? data.original_price,
                comboPrice: data.comboPrice ?? data.combo_price,
                discountPercentage: data.discountPercentage ?? data.discount_percentage,
                active: data.active ?? true,
                imageUrl: data.imageUrl || data.image_url,
                startDate: (data.startDate || data.start_date) ? new Date(data.startDate || data.start_date) : null,
                endDate: (data.endDate || data.end_date) ? new Date(data.endDate || data.end_date) : null
            }
        });

        // Trigger Audit Log
        marketplaceEmitter.emit(MARKETPLACE_EVENTS.ADMIN_ACTION_PERFORMED, {
            adminId: data.adminId, // Expecting admin info in request
            role: data.adminRole,
            action: 'CREATE_COMBO_OFFER',
            entity: 'ComboOffer',
            entityId: offer.id,
            changes: data,
            ip: data.ip
        });

        return offer;
    }

    static async getOffers() {
        return await prisma.comboOffer.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getOfferById(id: string) {
        return await prisma.comboOffer.findUnique({
            where: { id }
        });
    }

    static async getOffersForProduct(productId: string) {
        const allOffers = await prisma.comboOffer.findMany({
            where: { active: true }
        });

        const relevantOffers = allOffers.filter(offer => {
            try {
                const ids = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
                return Array.isArray(ids) && ids.includes(productId);
            } catch (e) {
                return false;
            }
        });

        // Enrich with product details
        const enrichedOffers = await Promise.all(relevantOffers.map(async (offer) => {
            const ids = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
            const products = await prisma.product.findMany({
                where: { id: { in: ids } },
                include: {
                    variants: {
                        take: 1,
                        include: { sizes: true }
                    }
                }
            });
            return { ...offer, products };
        }));

        return enrichedOffers;
    }

    static async updateOffer(id: string, data: any) {
        const updateData: any = { ...data };

        // Standardize input fields (support both camelCase and snake_case)
        if (data.productIds || data.product_ids) updateData.productIds = JSON.stringify(data.productIds || data.product_ids);
        if (data.originalPrice || data.original_price) updateData.originalPrice = data.originalPrice ?? data.original_price;
        if (data.comboPrice || data.combo_price) updateData.comboPrice = data.comboPrice ?? data.combo_price;
        if (data.discountPercentage || data.discount_percentage) updateData.discountPercentage = data.discountPercentage ?? data.discount_percentage;
        if (data.imageUrl || data.image_url) updateData.imageUrl = data.imageUrl || data.image_url;
        if (data.startDate || data.start_date) updateData.startDate = new Date(data.startDate || data.start_date);
        if (data.endDate || data.end_date) updateData.endDate = new Date(data.endDate || data.end_date);

        // Remove redundant snake_case keys to keep Prisma clean
        ['product_ids', 'original_price', 'combo_price', 'discount_percentage', 'image_url', 'start_date', 'end_date'].forEach(k => delete updateData[k]);

        const offer = await prisma.comboOffer.update({
            where: { id },
            data: updateData
        });

        // Trigger Audit Log
        marketplaceEmitter.emit(MARKETPLACE_EVENTS.ADMIN_ACTION_PERFORMED, {
            adminId: data.adminId,
            role: data.adminRole,
            action: 'UPDATE_COMBO_OFFER',
            entity: 'ComboOffer',
            entityId: id,
            changes: data,
            ip: data.ip
        });

        return offer;
    }

    static async toggleStatus(id: string, active: boolean) {
        return await prisma.comboOffer.update({
            where: { id },
            data: { active }
        });
    }

    static async deleteOffer(id: string) {
        return await prisma.comboOffer.delete({
            where: { id }
        });
    }

    static async calculateComboDiscount(items: any[]) {
        const activeOffers = await prisma.comboOffer.findMany({
            where: { active: true }
        });

        let totalDiscount = 0;
        const appliedOffers: any[] = [];

        for (const offer of activeOffers) {
            if (!offer.productIds) continue;

            let offerProductIds: string[];
            try {
                offerProductIds = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
            } catch (e) {
                offerProductIds = [];
            }

            if (offerProductIds.length === 0) continue;

            // Simple logic: Check if all products in the offer are in the items list
            // In a more complex "real-world" scenario, we'd handle multiples (e.g., 2 sets of the same combo)
            // For now, let's implement the "Buy these specific items for a set price" logic

            const cartProductIds = items.map(i => i.productId);
            const hasAllProducts = offerProductIds.every(id => cartProductIds.includes(id));

            if (hasAllProducts) {
                // For a real-world system, we calculate the discount as:
                // Sum(Original Prices) - ComboPrice

                // Fetch the actual prices of these products to be sure
                const products = await prisma.product.findMany({
                    where: { id: { in: offerProductIds } }
                });

                const originalTotal = products.reduce((sum, p) => sum + p.price, 0);
                const discount = originalTotal - offer.comboPrice;

                if (discount > 0) {
                    totalDiscount += discount;
                    appliedOffers.push({
                        id: offer.id,
                        title: offer.title,
                        discount
                    });
                }
            }
        }

        return { totalDiscount, appliedOffers };
    }
}
