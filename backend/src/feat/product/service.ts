import { prisma } from '../../infra/database/client';
import { Product, Role } from '@prisma/client';

export class ProductService {
    private static mapProductData(data: any) {
        console.log("[ProductService] Raw data input to mapProductData:", JSON.stringify(data, null, 2));
        const {
            discount_price,
            is_featured,
            is_new,
            variants,
            category,
            is_verified,
            seller_id,
            stock,
            ...rest
        } = data;

        const mappedData: any = {
            ...rest,
            discountPrice: discount_price !== undefined ? discount_price : data.discountPrice,
            isFeatured: is_featured !== undefined ? is_featured : data.isFeatured,
            isNew: is_new !== undefined ? is_new : data.isNew,
            isVerified: is_verified !== undefined ? is_verified : (data.isVerified !== undefined ? data.isVerified : data.is_verified),
            dealerId: seller_id !== undefined ? seller_id : data.dealerId,
        };

        // CRITICAL: Strip primary keys and metadata that shouldn't be updated or could cause Prisma errors
        delete mappedData.id;
        delete mappedData.uuid;
        delete mappedData.createdAt;
        delete mappedData.updatedAt;
        delete mappedData.deletedAt;
        delete mappedData.actorId;
        delete mappedData.product_variants;
        delete mappedData.product_sizes;
        delete mappedData.category_id;
        delete mappedData.subcategory_id;

        // Also strip the fields we explicitly mapped to avoid duplicates
        delete mappedData.discount_price;
        delete mappedData.is_featured;
        delete mappedData.is_new;
        delete mappedData.seller_id;
        delete mappedData.is_verified;

        if (variants && Array.isArray(variants)) {
            console.log("[ProductService] Mapping variants:", variants.length);
            let totalStock = 0;
            mappedData.variants = {
                create: variants.map((v: any) => ({
                    colorName: v.color_name,
                    colorHex: v.color_hex,
                    images: v.images,
                    sizes: {
                        create: v.sizes.map((s: any) => {
                            totalStock += (s.stock || 0);
                            return {
                                size: s.size,
                                stock: s.stock || 0
                            };
                        })
                    }
                }))
            };
            mappedData.stock = totalStock;
        } else if (stock !== undefined) {
            mappedData.stock = stock;
        }

        console.log("[ProductService] Mapped Payload for Prisma:", JSON.stringify(mappedData, null, 2));
        return mappedData;
    }

    static async createProduct(dealerId: string, data: any) {
        const mappedData = this.mapProductData(data);
        return await prisma.product.create({
            data: {
                ...mappedData,
                dealerId,
            },
            include: {
                variants: {
                    include: {
                        sizes: true
                    }
                },
                category: true,
                subcategory: true
            }
        });
    }

    static async getProducts(user?: { id: string; role: Role }, filters: { search?: string; category?: string; page?: number | string; limit?: number | string; sellerId?: string } = {}) {
        const { search, category, sellerId } = filters;
        const pageNum = typeof filters.page === 'string' ? parseInt(filters.page) : (Number(filters.page) || 1);
        const limitNum = typeof filters.limit === 'string' ? parseInt(filters.limit) : (Number(filters.limit) || 10);
        const skip = (pageNum - 1) * limitNum;

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

        if (sellerId) {
            where.dealerId = sellerId;
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
            },
            category: true,
            subcategory: true
        };

        if (!user) {
            where.published = true;
        } else if (user.role === Role.ADMIN) {
        } else if (user.role === Role.DEALER) {
            if (!sellerId) {
                where.published = true;
            } else if (sellerId !== user.id) {
                where.published = true;
            }
        } else {
            where.published = true;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        return { products, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
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
            },
            category: true,
            subcategory: true
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

    static async updateProduct(id: string, user: { id: string; role: Role }, data: any) {
        console.log("[ProductService] updateProduct called for ID:", id);
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, dealerId: true, title: true, published: true, deletedAt: true }
        });

        if (!product) {
            console.error("[ProductService] Product not found:", id);
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (product.deletedAt) {
            throw { statusCode: 404, message: 'Product has been deleted' };
        }

        if (user.role === Role.DEALER && product.dealerId !== user.id) {
            throw {
                statusCode: 403,
                message: 'Forbidden: You can only update your own products'
            };
        }

        const mappedData = this.mapProductData(data);

        return await prisma.$transaction(async (tx) => {
            if (mappedData.variants) {
                console.log("[ProductService] Replacing variants for:", id);
                await tx.productVariant.deleteMany({
                    where: { productId: id }
                });
            }

            console.log("[ProductService] Calling prisma.product.update for ID:", id);
            const updated = await tx.product.update({
                where: { id },
                data: mappedData,
                include: {
                    variants: {
                        include: {
                            sizes: true
                        }
                    },
                    category: true,
                    subcategory: true
                }
            });
            console.log("[ProductService] Database update successful.");
            return updated;
        });
    }

    static async deleteProduct(id: string, user: { id: string; role: Role }) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, dealerId: true, title: true, deletedAt: true }
        });

        if (!product) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (product.deletedAt) {
            throw { statusCode: 404, message: 'Product already deleted' };
        }

        if (user.role === Role.DEALER && product.dealerId !== user.id) {
            throw {
                statusCode: 403,
                message: 'Forbidden: You can only delete your own products'
            };
        }

        return await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() } as any
        });
    }
}
