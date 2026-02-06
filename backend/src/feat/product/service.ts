import { prisma } from '../../infra/database/client';
import { Product, Role } from '@prisma/client';

export class ProductService {
    public static transformProduct(product: any) {
        if (!product) return product;

        // Inject 'published' boolean for frontend UI compatibility
        product.published = product.status === 'ACTIVE';

        if (product.variants) {
            product.variants = product.variants.map((v: any) => {
                if (typeof v.images === 'string') {
                    try {
                        v.images = JSON.parse(v.images);
                    } catch (e) {
                        v.images = [];
                    }
                }
                return v;
            });
        }
        return product;
    }

    private static mapProductData(data: any) {
        // Explicitly pick only the scalar fields that belong to the Product model
        // This prevents Prisma errors from passing relation fields (like 'category') as strings
        const mappedData: any = {
            title: data.title,
            slug: data.slug,
            description: data.description,
            sku: data.sku,
            tags: data.tags,
            commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : undefined,
            adminNotes: data.adminNotes,
        };

        // Handle Price logic
        const finalDiscountPrice = data.discountPrice !== undefined ? data.discountPrice : data.discount_price;
        const finalBasePrice = Number(data.price);

        if (!isNaN(finalBasePrice)) {
            mappedData.price = finalDiscountPrice ? Number(finalDiscountPrice) : finalBasePrice;
            mappedData.compareAtPrice = finalDiscountPrice ? finalBasePrice : (data.compareAtPrice !== undefined ? Number(data.compareAtPrice) : null);
        }

        // Handle Status and Toggles
        // Priority: 1. data.status (string), 2. data.published (boolean), 3. Default DRAFT
        if (data.status !== undefined) {
            mappedData.status = data.status;
        } else if (data.published !== undefined) {
            mappedData.status = data.published === true ? 'ACTIVE' : 'DRAFT';
        } else {
            mappedData.status = 'DRAFT';
        }

        if (data.isVerified !== undefined) mappedData.isVerified = !!data.isVerified;
        else if (data.is_verified !== undefined) mappedData.isVerified = !!data.is_verified;

        if (data.isFeatured !== undefined) mappedData.isFeatured = !!data.isFeatured;
        else if (data.is_featured !== undefined) mappedData.isFeatured = !!data.is_featured;

        if (data.isBlocked !== undefined) mappedData.isBlocked = !!data.isBlocked;
        else if (data.is_blocked !== undefined) mappedData.isBlocked = !!data.is_blocked;

        console.log(`[ProductService] Mapped Governance Flags:`, {
            isVerified: mappedData.isVerified,
            isFeatured: mappedData.isFeatured,
            isBlocked: mappedData.isBlocked,
            originalData: {
                isFeatured: data.isFeatured,
                is_featured: data.is_featured,
                isVerified: data.isVerified,
                is_verified: data.is_verified
            }
        });
        // Removed is_new toggle as per instruction

        // Handle Category
        const cId = data.category_id || data.categoryId;
        if (cId) mappedData.categoryId = cId;

        // Handle Variants if present
        if (data.variants && Array.isArray(data.variants)) {
            let totalStock = 0;
            mappedData.variants = {
                create: data.variants.map((v: any) => ({
                    name: v.color_name || v.colorName || "Standard",
                    colorName: v.color_name || v.colorName,
                    colorHex: v.color_hex || v.colorHex,
                    images: Array.isArray(v.images) ? JSON.stringify(v.images) : (v.images || "[]"),
                    sizes: {
                        create: (v.sizes || []).map((s: any) => {
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
        } else if (data.stock !== undefined) {
            mappedData.stock = Number(data.stock);
        }

        return mappedData;
    }

    static async createProduct(userId: string, data: any) {
        const mappedData = this.mapProductData(data);

        // Fetch Vendor record for this user
        let vendor = await prisma.vendor.findUnique({
            where: { ownerId: userId }
        });

        // Auto-create vendor profile for Super Admin if missing
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!vendor && user?.role === Role.SUPER_ADMIN) {
            vendor = await prisma.vendor.create({
                data: {
                    ownerId: userId,
                    storeName: "Official Platform Store",
                    slug: `official-store-${Date.now()}`,
                    status: 'ACTIVE',
                    supportEmail: user.email
                }
            });
        }

        if (!vendor) throw { statusCode: 403, message: "Only registered vendors can create products. Please create a Seller Profile first." };

        const vendorId = vendor.id;

        // Security: Ensure vendor is active to publish
        const isPlatformAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;

        if (mappedData.status === 'ACTIVE' && vendor.status !== 'ACTIVE' && !isPlatformAdmin) {
            // Auto-convert to DRAFT for unverified sellers so they can still create products
            console.log(`[ProductService] Vendor ${vendor.id} is not ACTIVE (status: ${vendor.status}). Forcing product to DRAFT.`);
            mappedData.status = 'DRAFT';
        }

        const newProduct = await prisma.product.create({
            data: {
                ...mappedData,
                vendorId,
            },
            include: {
                variants: {
                    include: {
                        sizes: true
                    }
                },
                category: true,
                vendor: true
            }
        });
        return this.transformProduct(newProduct);
    }

    static async getProducts(user?: { id: string; role: Role }, filters: { search?: string; category?: string; subcategory?: string; page?: number | string; limit?: number | string; vendorId?: string; tag?: string; scope?: string; sort?: string; minPrice?: number; maxPrice?: number } = {}) {
        const pageNum = typeof filters.page === 'string' ? parseInt(filters.page) : (Number(filters.page) || 1);
        const limitNum = typeof filters.limit === 'string' ? parseInt(filters.limit) : (Number(filters.limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { deletedAt: null };

        if (filters.search) {
            const searchPattern = filters.search.trim();
            where.OR = [
                { title: { contains: searchPattern } },
                { tags: { contains: searchPattern } },
                { description: { contains: searchPattern } }
            ];
        }

        if (filters.subcategory) {
            // Priority: Filter by specific subcategory slug
            where.category = { slug: filters.subcategory };
        } else if (filters.category) {
            // Recursive Category Logic: Fetch products from parent category AND all its children
            const parentCategory = await prisma.category.findUnique({
                where: { slug: filters.category },
                include: { subcategories: { select: { id: true } } }
            });

            if (parentCategory) {
                const categoryIds = [parentCategory.id, ...parentCategory.subcategories.map(s => s.id)];
                where.categoryId = { in: categoryIds };
            } else {
                where.category = { slug: filters.category };
            }
        }

        if (filters.vendorId) {
            where.vendorId = filters.vendorId;
        }

        if (filters.tag === 'deals') {
            where.compareAtPrice = { not: null };
        }

        // Filter by Price Range
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            where.price = {};
            if (filters.minPrice !== undefined) where.price.gte = Number(filters.minPrice);
            if (filters.maxPrice !== undefined) where.price.lte = Number(filters.maxPrice);
        }

        // Sorting Logic (Real-world Marketplace Implementation)
        let orderBy: any = [];

        switch (filters.sort) {
            case 'price_asc':
                orderBy = [{ price: 'asc' }];
                break;
            case 'price_desc':
                orderBy = [{ price: 'desc' }];
                break;
            case 'rating':
                orderBy = [
                    { rating: 'desc' },
                    { reviewCount: 'desc' },
                    { createdAt: 'desc' }
                ];
                break;
            case 'featured':
                orderBy = [
                    { isFeatured: 'desc' },
                    { createdAt: 'desc' }
                ];
                break;
            default:
                orderBy = [{ createdAt: 'desc' }];
        }

        const include = {
            variants: {
                include: {
                    sizes: true
                }
            },
            vendor: {
                select: {
                    storeName: true,
                    slug: true,
                    supportEmail: true
                }
            },
            category: true,
        };

        if (!user) {
            where.status = 'ACTIVE';
        } else if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
            // No extra filters for platform admins
        } else if (user.role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
            if (vendor && (filters.vendorId === vendor.id || filters.scope === 'vendor')) {
                if (filters.scope === 'vendor') where.vendorId = vendor.id;
            } else {
                where.status = 'ACTIVE';
            }
        } else {
            where.status = 'ACTIVE';
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include,
                skip,
                take: limitNum,
                orderBy // Apply dynamic sorting
            }),
            prisma.product.count({ where })
        ]);

        const transformedProducts = products.map(p => this.transformProduct(p));

        return { products: transformedProducts, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    }

    static async getProductById(idOrSlug: string, user?: { id: string; role: Role }) {
        console.log('[ProductService] getProductById called:', {
            idOrSlug,
            userId: user?.id,
            userRole: user?.role
        });

        const include = {
            variants: {
                include: {
                    sizes: true
                }
            },
            vendor: {
                include: {
                    owner: {
                        select: {
                            name: true,
                            email: true,
                        }
                    }
                }
            },
            category: true,
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

        console.log('[ProductService] Database query result:', {
            found: !!product,
            productId: product?.id,
            productTitle: product?.title,
            productStatus: product?.status,
            vendorId: product?.vendorId
        });

        if (!product) {
            console.error('[ProductService] Product not found in database:', idOrSlug);
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (user && (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN)) {
            console.log('[ProductService] Returning product to admin/super_admin');
            return this.transformProduct(product);
        }

        if (product.status !== 'ACTIVE') {
            if (!user) {
                console.warn('[ProductService] Inactive product access denied for unauthenticated user');
                throw { statusCode: 403, message: 'Forbidden' };
            }
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
            if (!vendor || product.vendorId !== vendor.id) {
                console.warn('[ProductService] Inactive product access denied for non-owner');
                throw { statusCode: 403, message: 'Forbidden' };
            }
        }

        console.log('[ProductService] Returning product successfully');
        return this.transformProduct(product);
    }

    static async updateProduct(id: string, user: { id: string; role: Role }, data: any) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, vendorId: true, status: true, deletedAt: true }
        });

        if (!product || product.deletedAt) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        const isPlatformAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
        const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });

        if (!isPlatformAdmin && (!vendor || product.vendorId !== vendor.id)) {
            throw {
                statusCode: 403,
                message: 'Forbidden: You can only update your own products'
            };
        }

        const mappedData = this.mapProductData(data);

        // Security: Ensure vendor is active to publish
        if (mappedData.status === 'ACTIVE' && (!vendor || vendor.status !== 'ACTIVE') && !isPlatformAdmin) {
            // Auto-convert to DRAFT for unverified sellers
            console.log(`[ProductService] Vendor ${vendor?.id || 'unknown'} is not ACTIVE (status: ${vendor?.status || 'missing'}). Forcing product update to DRAFT.`);
            mappedData.status = 'DRAFT';
        }

        return await prisma.$transaction(async (tx) => {
            if (mappedData.variants) {
                await tx.productVariant.deleteMany({
                    where: { productId: id }
                });
            }

            const updatedProduct = await tx.product.update({
                where: { id },
                data: mappedData,
                include: {
                    variants: {
                        include: {
                            sizes: true
                        }
                    },
                    category: true,
                }
            });
            return this.transformProduct(updatedProduct);
        });
    }

    static async deleteProduct(id: string, user: { id: string; role: Role }) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, vendorId: true, deletedAt: true }
        });

        if (!product || product.deletedAt) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        const isPlatformAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
        const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });

        if (!isPlatformAdmin && (!vendor || product.vendorId !== vendor.id)) {
            throw {
                statusCode: 403,
                message: 'Forbidden: You can only delete your own products'
            };
        }

        return await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    static async checkSkuAvailable(sku: string, excludeId?: string) {
        const where: any = { sku, deletedAt: null };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        const count = await prisma.product.count({ where });
        return count === 0;
    }
}
