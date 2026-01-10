import { Response } from 'express';
import { prisma } from '../../core/db';
import { asyncHandler } from '../../utils/asyncHandler';

export class WishlistController {
    static getWishlist = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;

        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        variants: {
                            include: {
                                sizes: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            wishlist
        });
    });

    static addToWishlist = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const wishlistItem = await prisma.wishlist.upsert({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            },
            update: {},
            create: {
                userId,
                productId
            }
        });

        res.status(201).json({
            success: true,
            wishlistItem
        });
    });

    static checkStatus = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { productId } = req.query;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const item = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: productId as string
                }
            }
        });

        res.json({
            success: true,
            isInWishlist: !!item
        });
    });

    static removeFromWishlist = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { id } = req.params; // This can be wishlist item ID or productId (if we support both)
        const { productId } = req.query;

        if (productId) {
            await prisma.wishlist.delete({
                where: {
                    userId_productId: {
                        userId,
                        productId: productId as string
                    }
                }
            });
        } else {
            await prisma.wishlist.delete({
                where: {
                    id,
                    userId
                }
            });
        }

        res.json({
            success: true,
            message: 'Item removed from wishlist'
        });
    });

    static clearWishlist = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;

        await prisma.wishlist.deleteMany({
            where: { userId }
        });

        res.json({
            success: true,
            message: 'Wishlist cleared'
        });
    });
}
