import { prisma } from '../../infra/database/client';

export class ComboOfferService {
    static async createOffer(data: any) {
        return await prisma.comboOffer.create({
            data: {
                title: data.title,
                description: data.description,
                productIds: data.product_ids || [], // Standardize for Prisma Json
                originalPrice: data.original_price,
                comboPrice: data.combo_price,
                discountPercentage: data.discount_percentage,
                active: data.active ?? true,
                imageUrl: data.image_url,
                startDate: data.start_date ? new Date(data.start_date) : null,
                endDate: data.end_date ? new Date(data.end_date) : null
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

        // Map frontend keys to backend camelCase if necessary
        if (data.product_ids) updateData.productIds = data.product_ids;
        if (data.original_price) updateData.originalPrice = data.original_price;
        if (data.combo_price) updateData.comboPrice = data.combo_price;
        if (data.discount_percentage) updateData.discountPercentage = data.discount_percentage;
        if (data.image_url) updateData.imageUrl = data.image_url;
        if (data.start_date) updateData.startDate = new Date(data.start_date);
        if (data.end_date) updateData.endDate = new Date(data.end_date);

        // Remove snake_case keys before passing to Prisma
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
