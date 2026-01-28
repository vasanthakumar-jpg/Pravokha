import { Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class ReviewController {
    static listProductReviews = asyncHandler(async (req: any, res: Response) => {
        const { productId } = req.params;

        const reviews = await prisma.productReview.findMany({
            where: {
                productId,
                status: 'approved'
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

    static createReview = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { productId, rating, title, comment, images } = req.body;

        const review = await prisma.productReview.create({
            data: {
                userId,
                productId,
                rating,
                title,
                comment,
                images: images || [],
                status: 'approved'
            }
        });

        // Update product rating and review count
        const productReviews = await prisma.productReview.findMany({
            where: { productId, status: 'approved' },
            select: { rating: true }
        });

        const totalReviews = productReviews.length;
        const avgRating = productReviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews;

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: parseFloat(avgRating.toFixed(1)),
                reviews: totalReviews
            }
        });

        res.status(201).json({ success: true, review });
    });

    static updateReview = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, title, comment, images } = req.body;

        const review = await prisma.productReview.update({
            where: { id, userId },
            data: {
                rating,
                title,
                comment,
                images
            }
        });

        res.json({ success: true, review });
    });

    static deleteReview = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { id } = req.params;
        const isAdmin = req.user.role === 'ADMIN';

        await prisma.productReview.delete({
            where: isAdmin ? { id } : { id, userId }
        });

        res.json({ success: true, message: 'Review deleted' });
    });

    static listAllReviews = asyncHandler(async (req: any, res: Response) => {
        const reviews = await prisma.productReview.findMany({
            include: {
                user: {
                    select: { name: true, avatarUrl: true }
                },
                product: {
                    select: { title: true, slug: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, reviews });
    });

    static updateReviewStatus = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        const review = await prisma.productReview.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, review });
    });
}
