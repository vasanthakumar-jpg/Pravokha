import { prisma } from '../../infra/database/client';

export class ComboOfferService {
    static async createOffer(data: any) {
        return await prisma.comboOffer.create({
            data: {
                title: data.title,
                description: data.description,
                // Handle both frontend (camelCase) and raw API (snake_case)
                productIds: data.productIds || data.product_ids || [],
                originalPrice: data.originalPrice ?? data.original_price,
                comboPrice: data.comboPrice ?? data.combo_price,
                discountPercentage: data.discountPercentage ?? data.discount_percentage,
                active: data.active ?? true,
                imageUrl: data.imageUrl || data.image_url,
                startDate: (data.startDate || data.start_date) ? new Date(data.startDate || data.start_date) : null,
                endDate: (data.endDate || data.end_date) ? new Date(data.endDate || data.end_date) : null
            }
        });
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

    static async updateOffer(id: string, data: any) {
        const updateData: any = { ...data };

        // Standardize input fields (support both camelCase and snake_case)
        if (data.productIds || data.product_ids) updateData.productIds = data.productIds || data.product_ids;
        if (data.originalPrice || data.original_price) updateData.originalPrice = data.originalPrice ?? data.original_price;
        if (data.comboPrice || data.combo_price) updateData.comboPrice = data.comboPrice ?? data.combo_price;
        if (data.discountPercentage || data.discount_percentage) updateData.discountPercentage = data.discountPercentage ?? data.discount_percentage;
        if (data.imageUrl || data.image_url) updateData.imageUrl = data.imageUrl || data.image_url;
        if (data.startDate || data.start_date) updateData.startDate = new Date(data.startDate || data.start_date);
        if (data.endDate || data.end_date) updateData.endDate = new Date(data.endDate || data.end_date);

        // Remove redundant snake_case keys to keep Prisma clean
        ['product_ids', 'original_price', 'combo_price', 'discount_percentage', 'image_url', 'start_date', 'end_date'].forEach(k => delete updateData[k]);

        return await prisma.comboOffer.update({
            where: { id },
            data: updateData
        });
    }

    static async deleteOffer(id: string) {
        return await prisma.comboOffer.delete({
            where: { id }
        });
    }

    static async toggleStatus(id: string, active: boolean) {
        return await prisma.comboOffer.update({
            where: { id },
            data: { active }
        });
    }
}
