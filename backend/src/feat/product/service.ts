import { prisma } from '../../infra/database/client';
import { Product, Role } from '@prisma/client';
import { isSuperAdmin, isAdmin, isRole } from '../../shared/utils/role.utils';
import { PermissionService } from '../auth/permission.service';

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
            // Price is always the final selling price
            mappedData.price = (finalDiscountPrice !== null && finalDiscountPrice !== undefined) ? Number(finalDiscountPrice) : finalBasePrice;
            // compareAtPrice stores the original price if discounted, otherwise it's null
            mappedData.compareAtPrice = (finalDiscountPrice !== null && finalDiscountPrice !== undefined) ? finalBasePrice : null;
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

        if (data.isBlocked !== undefined) mappedData.isBlocked = !!data.isBlocked;
        else if (data.is_blocked !== undefined) mappedData.isBlocked = !!data.is_blocked;

        console.log(`[ProductService] Mapped Governance Flags:`, {
            isVerified: mappedData.isVerified,
            isBlocked: mappedData.isBlocked,
            originalData: {
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
            console.log('[ProductService.mapProductData] Received variants:', data.variants.length);
            console.log('[ProductService.mapProductData] First variant structure:', JSON.stringify(data.variants[0], null, 2));

            // INTEGRITY CHECK: Ensure at least one variant has sizes (Amazon/Shopify pattern)
            const hasSizes = data.variants.some((v: any) => v.sizes && Array.isArray(v.sizes) && v.sizes.length > 0);

            if (!hasSizes) {
                console.error('[ProductService] ❌ CRITICAL DATA INTEGRITY ERROR: No sizes found in any variant!');
                console.error('[ProductService] Full Payload Variants:', JSON.stringify(data.variants, null, 2));
                // Inspect first variant keys
                if (data.variants && data.variants[0]) {
                    console.error('[ProductService] First variant keys:', Object.keys(data.variants[0]));
                }
                throw new Error(`Product must have at least one size option. Received ${data.variants.length} variants. First variant keys: ${data.variants[0] ? Object.keys(data.variants[0]).join(',') : 'none'}`);
            }

            let totalStock = 0;
            mappedData.variants = {
                create: data.variants.map((v: any, vIdx: number) => {
                    const sizeCount = (v.sizes || []).length;
                    console.log(`[ProductService.mapProductData] Variant ${vIdx} (${v.color_name || v.colorName || "Standard"}): ${sizeCount} sizes`);

                    return {
                        name: (v.color_name || v.colorName || "Standard").trim().toUpperCase(),
                        colorName: (v.color_name || v.colorName || "Standard").trim().toUpperCase(),
                        colorHex: v.color_hex || v.colorHex,
                        images: Array.isArray(v.images) ? JSON.stringify(v.images) : (v.images || "[]"),
                        sizes: {
                            create: (v.sizes || v.product_sizes || []).map((s: any) => {
                                totalStock += (s.stock || 0);
                                return {
                                    size: (s.size || '').trim().toUpperCase(),
                                    stock: Number(s.stock) || 0
                                };
                            })
                        }
                    };

                })
            };
            mappedData.stock = totalStock;
            console.log('[ProductService.mapProductData] Total stock calculated:', totalStock);
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
        if (!vendor && user && isSuperAdmin(user.role)) {
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
        const isPlatformAdmin = isSuperAdmin(user?.role) || isAdmin(user?.role);

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

    static async getProducts(user?: { id: string; role: Role }, filters: { search?: string; category?: string; subcategory?: string; ids?: string; page?: number | string; limit?: number | string; vendorId?: string; tag?: string; scope?: string; sort?: string; minPrice?: number; maxPrice?: number; minDiscount?: number; minRating?: number } = {}) {
        const pageNum = typeof filters.page === 'string' ? parseInt(filters.page) : (Number(filters.page) || 1);
        const limitNum = typeof filters.limit === 'string' ? parseInt(filters.limit) : (Number(filters.limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { deletedAt: null };

        if (filters.search) {
            const rawKeywords = filters.search.trim().split(/\s+/).filter(word => word.length > 0);
            const stopWords = ['for', 'the', 'and', 'with', 'from', 'best', 'buy', 'this', 'that', 'super', 'very'];
            const keywords = rawKeywords
                .filter(word => word.length > 1 && !stopWords.includes(word.toLowerCase()))
                .map(word => {
                    const wordLower = word.toLowerCase();
                    const variations = [wordLower];

                    // Hyphen Variations
                    if (wordLower === 'tshirt' || wordLower === 'tshirts') variations.push('t-shirt', 't-shirts', 'tee');
                    if (wordLower === 't-shirt' || wordLower === 't-shirts') variations.push('tshirt', 'tshirts', 'tee');

                    // Gender Variations
                    if (wordLower === 'mens' || wordLower === 'men') variations.push('mens', 'men', 'male');
                    if (wordLower === 'womens' || wordLower === 'women') variations.push('womens', 'women', 'female', 'lady', 'ladies');

                    // Simple Pluralization Stemming
                    if (wordLower.length > 3) {
                        if (wordLower.endsWith('s')) variations.push(wordLower.slice(0, -1));
                        else variations.push(wordLower + 's');
                    }

                    return [...new Set(variations)];
                });

            // SMARTER PROMOTION SEARCH: Check for Combo Offer Titles
            const comboMatches = await prisma.comboOffer.findMany({
                where: {
                    active: true,
                    OR: [
                        { title: { contains: filters.search } },
                        { description: { contains: filters.search } }
                    ]
                },
                select: { productIds: true }
            });

            const comboProductIdsSet = new Set<string>();
            comboMatches.forEach(combo => {
                if (combo.productIds) {
                    try {
                        const ids = typeof combo.productIds === 'string' ? JSON.parse(combo.productIds) : combo.productIds;
                        if (Array.isArray(ids)) ids.forEach(id => comboProductIdsSet.add(id));
                        else if (typeof ids === 'string' && ids.length > 0) comboProductIdsSet.add(ids);
                    } catch (e) {
                        console.error('[ProductService] Error parsing combo productIds:', e);
                    }
                }
            });

            if (keywords.length > 0 || comboProductIdsSet.size > 0) {
                // PASS 1: Try strict AND (All keywords must be represented) OR explicit Promotion IDs
                const searchQuery: any = {};

                if (keywords.length > 0) {
                    searchQuery.AND = keywords.map(variations => ({
                        OR: variations.flatMap(v => [
                            { title: { contains: v } },
                            { tags: { contains: v } },
                            { description: { contains: v } }
                        ])
                    }));
                }

                if (comboProductIdsSet.size > 0) {
                    const promotionIds = Array.from(comboProductIdsSet);
                    // If we have promo IDs, we allow EITHER keyword matches OR these specific IDs
                    where.OR = [
                        ...(searchQuery.AND ? [searchQuery] : []),
                        { id: { in: promotionIds } },
                        { slug: { in: promotionIds } }
                    ];
                } else {
                    where.AND = searchQuery.AND;
                }

                // Check if Pass 1 yields results
                const count = await prisma.product.count({ where });

                if (count === 0 && keywords.length > 0) {
                    // PASS 2: Fallback to OR (Any significant keyword matches)
                    // This handles cases like "tshirt perfect fit" where "perfect" isn't in DB
                    delete where.AND;
                    const orConditions: any[] = keywords.flatMap(variations => variations.flatMap(v => [
                        { title: { contains: v } },
                        { tags: { contains: v } },
                        { description: { contains: v } }
                    ]));

                    if (comboProductIdsSet.size > 0) {
                        where.OR = [
                            ...orConditions,
                            { id: { in: Array.from(comboProductIdsSet) } },
                            { slug: { in: Array.from(comboProductIdsSet) } }
                        ];
                    } else {
                        where.OR = orConditions;
                    }
                }
            }
        }

        // Specific IDs filter (useful for banners linking to specific subsets)
        if (filters.ids) {
            const idList = filters.ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
            if (idList.length > 0) {
                where.id = { in: idList };
            }
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

        // Filter by Rating
        if (filters.minRating !== undefined) {
            where.rating = { gte: Number(filters.minRating) };
        }

        // Backend Discount Filtering
        // Since discount is calculated (compareAtPrice - price) / compareAtPrice * 100
        // We need to ensure compareAtPrice > price first.
        if (filters.minDiscount) {
            // This is a rough filter at DB level to reduce result set, precise check happens in memory if needed
            // But Prisma doesn't support computed columns in where clause easily without raw query
            // Workaround: We will fetch and filter in memory OR use a raw query. 
            // For now, let's filter in memory if the dataset isn't huge, OR since we have pagination, 
            // we should ideally use raw query or add a 'discountPercentage' column.
            // 
            // OPTIMIZED APPROACH:
            // Since we cannot easily filter computed fields in standard Prisma `findMany`,
            // and adding a column requires migration, we will use a robust connection.
            // For this specific 'minDiscount', let's ensure we only get products with a compareAtPrice set.
            where.compareAtPrice = { not: null, gt: 0 };
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
        } else if (isSuperAdmin(user.role) || isAdmin(user.role)) {
            // No extra filters for platform admins
        } else if (isRole(user.role, Role.SELLER)) {
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

        const transformations = products.map(p => this.transformProduct(p));

        // Apply Discount Filter in Memory (Limitation of current schema without computed column)
        // Note: This affects pagination accuracy slightly if many items are filtered out.
        // For a real-world large generic marketplace, we would add a 'discount' column indexed in DB.
        let finalProducts = transformations;
        if (filters.minDiscount) {
            const minD = Number(filters.minDiscount);
            finalProducts = transformations.filter((p: any) => {
                if (!p.compareAtPrice || p.compareAtPrice <= p.price) return false;
                const discount = ((p.compareAtPrice - p.price) / p.compareAtPrice) * 100;
                return discount >= minD;
            });
        }

        return { products: finalProducts, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
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

        if (isSuperAdmin(user?.role) || isAdmin(user?.role)) {
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

        const isPlatformAdmin = isSuperAdmin(user.role) || isAdmin(user.role);
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

        const realProductId = product.id; // Resolve UUID from the found product

        return await prisma.$transaction(async (tx) => {
            if (mappedData.variants) {
                // 1. Delete ALL existing variants and sizes first
                // ProductSize record will be deleted via CASCADE constraint
                await tx.productVariant.deleteMany({
                    where: { productId: realProductId }
                });
            }

            const updatedProduct = await tx.product.update({
                where: { id: realProductId },
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

        // Check permission using PermissionService
        const canDelete = await PermissionService.canPerform(
            user.id,
            user.role,
            'DELETE_PRODUCT',
            'PRODUCT',
            product.vendorId
        );

        const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
        const isOwner = vendor?.id === product.vendorId;

        if (!canDelete && !isOwner) {
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
