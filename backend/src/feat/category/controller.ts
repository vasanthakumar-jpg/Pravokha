import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class CategoryController {
    // 1. Category Management
    static listCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await prisma.category.findMany({
            where: { parentId: null, status: 'active' },
            include: {
                subcategories: {
                    where: { status: 'active' },
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        res.json({ success: true, categories });
    });

    static getCategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                subcategories: {
                    where: { status: 'active' },
                    orderBy: { displayOrder: 'asc' }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, category });
    });

    static createCategory = asyncHandler(async (req: Request, res: Response) => {
        const { name, slug, description, image, parentId, status, displayOrder } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        let targetSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await prisma.category.findUnique({ where: { slug: targetSlug } });
        if (existing) {
            targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug: targetSlug,
                description,
                image: image || null,
                parentId: parentId || null,
                status: status || 'active',
                displayOrder: displayOrder ?? 0
            }
        });

        res.status(201).json({ success: true, category });
    });

    static updateCategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, slug, description, image, parentId, status, displayOrder } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                image,
                parentId: parentId || null,
                status,
                displayOrder: displayOrder ?? undefined
            }
        });

        res.json({ success: true, category });
    });

    static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // Check if category has products
        const productsCount = await prisma.product.count({ where: { categoryId: id } });

        if (productsCount > 0) {
            // Soft delete: mark as inactive instead of deleting
            await prisma.category.update({
                where: { id },
                data: { status: 'inactive' }
            });
            return res.json({
                success: true,
                message: `Category has ${productsCount} products. It has been set to INACTIVE instead of deleted to preserve data.`,
                soft_delete: true
            });
        }

        // Hard delete if no dependencies
        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted successfully' });
    });

    // 2. Admin List (All categories including inactive and nested)
    static listAllCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await prisma.category.findMany({
            where: { parentId: null, status: 'active' }, // Only active top-level categories for dropdowns/managed lists
            include: { parent: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, categories });
    });

    // 3. Subcategories List (All subcategories for admin)
    static listAllSubcategories = asyncHandler(async (req: Request, res: Response) => {
        const subcategories = await prisma.category.findMany({
            where: {
                parentId: { not: null },
                status: 'active'
            },
            include: {
                parent: { select: { name: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const data = subcategories.map((sub: any) => ({
            ...sub,
            categoryId: sub.parentId, // camelCase compat
            category_id: sub.parentId  // snake_case compat
        }));
        res.json({ success: true, subcategories: data });
    });

    // 4. Create Subcategory
    static createSubcategory = asyncHandler(async (req: Request, res: Response) => {
        const { name, slug, description, image_url, category_id, status, display_order } = req.body;

        const subcategory = await prisma.category.create({
            data: {
                name,
                slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: description || null,
                image: image_url || null,
                parentId: category_id,
                status: status || 'active',
                displayOrder: display_order ?? 0
            },
            include: {
                parent: { select: { name: true, slug: true } }
            }
        });

        res.status(201).json({ success: true, subcategory });
    });

    // 5. Update Subcategory
    static updateSubcategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, slug, description, image_url, category_id, status, display_order } = req.body;

        const subcategory = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description: description || null,
                image: image_url || null,
                parentId: category_id,
                status,
                displayOrder: display_order
            },
            include: {
                parent: { select: { name: true, slug: true } }
            }
        });

        res.json({ success: true, subcategory });
    });

    // 6. Delete Subcategory
    static deleteSubcategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // Check if any products are linked to this subcategory
        const productsCount = await prisma.product.count({ where: { categoryId: id } });

        if (productsCount > 0) {
            // Soft delete - mark as inactive
            await prisma.category.update({
                where: { id },
                data: { status: 'inactive' }
            });
            return res.json({
                success: true,
                message: `Subcategory has ${productsCount} products. Marked as inactive instead of deleting.`,
                soft_delete: true
            });
        }

        // Hard delete if no products
        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Subcategory deleted successfully' });
    });
    // 7. Reorder Categories (Batch Update)
    static reorderCategories = asyncHandler(async (req: Request, res: Response) => {
        const { items } = req.body; // Expect [{ id: string, displayOrder: number }]

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Invalid items array' });
        }

        // Use transaction for batch update to ensure atomicity
        await prisma.$transaction(
            items.map((item: any) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder }
                })
            )
        );

        res.json({ success: true, message: 'Categories reordered successfully' });
    });
}
