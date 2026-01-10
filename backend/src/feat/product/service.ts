import { prisma } from '../../infra/database/client';
import { Product, Role } from '@prisma/client';

export class ProductService {
    static async createProduct(dealerId: string, data: Omit<Product, 'id' | 'dealerId' | 'createdAt' | 'updatedAt'>) {
        return await prisma.product.create({
            data: {
                ...data,
                dealerId,
            },
        });
    }

    static async getProducts(user?: { id: string; role: Role }, filters: { search?: string; category?: string; page?: number; limit?: number } = {}) {
        const { search, category, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (category) {
            where.category = category;
        }

        const include = {
            variants: {
                include: {
                    sizes: true
                }
            },
            dealer: {
                select: {
                    name: true,
                    email: true
                }
            }
        };

        if (!user) {
            // Public view: only published products
            where.published = true;
        } else if (user.role === Role.ADMIN) {
            // Admin sees everything (including unpublished)
        } else if (user.role === Role.DEALER) {
            // Dealer sees their own and other published
            // Actually, usually a dealer "getProducts" in this context might mean their own?
            // Let's stick to the current logic: dealer sees only their own if not public.
            where.dealerId = user.id;
        } else {
            // Regular user sees published
            where.published = true;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    static async getProductById(idOrSlug: string, user?: { id: string; role: Role }) {
        const include = {
            variants: {
                include: {
                    sizes: true
                }
            },
            dealer: {
                select: {
                    name: true,
                    email: true
                }
            }
        };

        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ],
                deletedAt: null
            },
            include
        });

        if (!product) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (user && user.role === Role.ADMIN) return product;

        if (!product.published && (!user || product.dealerId !== user.id)) {
            throw { statusCode: 403, message: 'Forbidden' };
        }

        return product;
    }

    static async updateProduct(id: string, user: { id: string; role: Role }, data: Partial<Omit<Product, 'id' | 'dealerId'>>) {
        const product = await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.update({
            where: { id },
            data,
        });
    }

    static async deleteProduct(id: string, user: { id: string; role: Role }) {
        await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() } as any
        });
    }
}
