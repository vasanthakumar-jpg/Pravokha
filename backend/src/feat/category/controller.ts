import { Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class CategoryController {
    // Categories
    static listCategories = asyncHandler(async (req: any, res: Response) => {
        const categories = await prisma.category.findMany({
            orderBy: { displayOrder: 'asc' }
        });

        res.json({
            success: true,
            categories
        });
    });

    static createCategory = asyncHandler(async (req: any, res: Response) => {
        const { name, slug, description, image_url, status, display_order } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description,
                imageUrl: image_url,
                status: status || 'active',
                displayOrder: display_order || 0
            }
        });

        res.status(201).json({
            success: true,
            category
        });
    });

    static updateCategory = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { name, slug, description, image_url, status, display_order } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                imageUrl: image_url,
                status,
                displayOrder: display_order
            }
        });

        res.json({
            success: true,
            category
        });
    });

    static deleteCategory = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;

        await prisma.category.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    });

    // Subcategories
    static listSubcategories = asyncHandler(async (req: any, res: Response) => {
        const { category } = req.query;
        const where: any = {};

        if (category) {
            where.category = {
                slug: Array.isArray(category) ? { in: category } : category
            };
        }

        const subcategories = await prisma.subcategory.findMany({
            where,
            include: {
                category: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        res.json({
            success: true,
            subcategories
        });
    });

    static createSubcategory = asyncHandler(async (req: any, res: Response) => {
        const { name, slug, description, category_id, status, display_order } = req.body;

        const subcategory = await prisma.subcategory.create({
            data: {
                name,
                slug,
                description,
                categoryId: category_id,
                status: status || 'active',
                displayOrder: display_order || 0
            }
        });

        res.status(201).json({
            success: true,
            subcategory
        });
    });

    static updateSubcategory = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { name, slug, description, category_id, status, display_order } = req.body;

        const subcategory = await prisma.subcategory.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                categoryId: category_id,
                status,
                displayOrder: display_order
            }
        });

        res.json({
            success: true,
            subcategory
        });
    });

    static deleteSubcategory = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;

        await prisma.subcategory.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Subcategory deleted successfully'
        });
    });
}
