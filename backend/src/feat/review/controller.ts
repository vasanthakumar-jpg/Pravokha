import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '@prisma/client';
import { isSuperAdmin } from '../../shared/utils/role.utils';

export class ReviewController {
    static listProductReviews = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;

        try {
            const reviews = await prisma.productReview.findMany({
                where: {
                    productId,
                    status: 'published',
                    isDeleted: false
                },
                include: {
                    user: {
                        select: { name: true, avatarUrl: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }).catch(dbError => {
                console.error(`[ReviewController] Database Error fetching reviews for ${productId}:`, dbError);
                return [];
            });

            // Parse images and metadata strings back to objects with robust error handling
            const transformedReviews = reviews.map(r => {
                let images = [];
                let metadata = null;

                try {
                    images = r.images ? JSON.parse(r.images) : [];
                    if (!Array.isArray(images)) images = images ? [images] : [];
                } catch (e) {
                    console.warn(`[ReviewController] Failed to parse images for review ${r.id}:`, r.images);
                    images = r.images ? [r.images] : [];
                }

                try {
                    metadata = r.metadata ? JSON.parse(r.metadata) : null;
                } catch (e) {
                    console.warn(`[ReviewController] Failed to parse metadata for review ${r.id}:`, r.metadata);
                    metadata = r.metadata;
                }

                // Resilience: Ensure user exists before accessing properties if returning to frontend
                const safeUser = r.user || { name: 'Anonymous Customer', avatarUrl: null };

                return { ...r, user: safeUser, images, metadata };
            });

            res.json({ success: true, reviews: transformedReviews });
        } catch (error: any) {
            console.error('[ReviewController] Critical Failure fetching reviews:', productId, error);
            // Return success: true but empty reviews to prevent 500
            res.json({
                success: true,
                reviews: [],
                _debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    static createReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const { productId, rating, title, comment, images, metadata } = req.body;

        const review = await prisma.productReview.create({
            data: {
                userId,
                productId,
                rating: parseFloat(String(rating)),
                title,
                comment,
                images: Array.isArray(images) ? JSON.stringify(images) : null,
                metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
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

        // Parse back for response
        res.status(201).json({
            success: true,
            review: {
                ...review,
                images: review.images ? JSON.parse(review.images) : [],
                metadata: review.metadata ? JSON.parse(review.metadata) : null
            }
        });
    });

    static updateReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        const { rating, title, comment, images, metadata } = req.body;

        const review = await prisma.productReview.update({
            where: { id, userId: user.id },
            data: {
                rating: rating !== undefined ? parseFloat(String(rating)) : undefined,
                title,
                comment,
                images: Array.isArray(images) ? JSON.stringify(images) : undefined,
                metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || undefined)
            }
        });

        res.json({
            success: true,
            review: {
                ...review,
                images: review.images ? JSON.parse(review.images) : [],
                metadata: review.metadata ? JSON.parse(review.metadata) : null
            }
        });
    });

    static deleteReview = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        const isSuper = isSuperAdmin(user.role);

        if (isSuper) {
            await prisma.productReview.update({
                where: { id },
                data: { isDeleted: true }
            });
            return res.json({ success: true, message: 'Review soft deleted' });
        } else {
            await prisma.productReview.update({
                where: { id, userId: user.id },
                data: { isDeleted: true }
            });
            return res.json({ success: true, message: 'Review deleted (soft delete)' });
        }
    });

    static listAllReviews = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) return res.status(403).json({ message: 'Unauthorized' });

        const reviews = await prisma.productReview.findMany({
            where: { isDeleted: false },
            include: {
                user: { select: { name: true, avatarUrl: true } },
                product: { select: { title: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformedReviews = reviews.map(r => ({
            ...r,
            images: r.images ? JSON.parse(r.images) : [],
            metadata: r.metadata ? JSON.parse(r.metadata) : null
        }));

        res.json({ success: true, reviews: transformedReviews });
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
