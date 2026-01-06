import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { asyncHandler } from '../utils/asyncHandler';
import { productSchema } from '../utils/validation';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const validated = productSchema.parse({ body: req.body });
    const result = await ProductService.createProduct(req.user!.id, validated.body);
    res.status(201).json({ success: true, data: result });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductService.getProducts(req.user!);
    res.status(200).json({ success: true, data: result });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductService.getProductById(req.params.id, req.user!);
    res.status(200).json({ success: true, data: result });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const validated = productSchema.partial().parse({ body: req.body });
    const result = await ProductService.updateProduct(req.params.id, req.user!, validated.body);
    res.status(200).json({ success: true, data: result });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    await ProductService.deleteProduct(req.params.id, req.user!);
    res.status(200).json({ success: true, message: 'Product deleted' });
});
