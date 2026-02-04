import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '@prisma/client';

export class ReviewController {
    static listProductReviews = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;

        const reviews = await prisma.productReview.findMany({
            where: {
                productId,
                status: 'published'
            },
            include: {
                user: {
                    select: { name: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, reviews });
    });

    static createReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const { productId, rating, title, comment, images } = req.body;

        const review = await prisma.productReview.create({
            data: {
                userId,
                productId,
                rating,
                title,
                comment,
                images: images || undefined,
                status: 'published'
            }
        });

        // Update product rating and review count
        const productReviews = await prisma.productReview.findMany({
            where: { productId, status: 'published' },
            select: { rating: true }
        });

        const totalReviews = productReviews.length;
        const avgRating = totalReviews > 0 ? productReviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews : 0;

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: totalReviews
            }
        });

        res.status(201).json({ success: true, review });
    });

    static updateReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        const { rating, title, comment, images } = req.body;

        const review = await prisma.productReview.update({
            where: { id, userId: user.id },
            data: {
                rating,
                title,
                comment,
                images
            }
        });

        res.json({ success: true, review });
    });

    static deleteReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        const isSuperAdmin = user.role === Role.SUPER_ADMIN;

        await prisma.productReview.delete({
            where: isSuperAdmin ? { id } : { id, userId: user.id }
        });

        res.json({ success: true, message: 'Review deleted' });
    });

    static listAllReviews = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== Role.SUPER_ADMIN) return res.status(403).json({ message: 'Unauthorized' });

        const reviews = await prisma.productReview.findMany({
            include: {
                user: { select: { name: true, avatarUrl: true } },
                product: { select: { title: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, reviews });
    });

    static updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== Role.SUPER_ADMIN) return res.status(403).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const { status } = req.body;

        const review = await prisma.productReview.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, review });
    });
}
