import { Request, Response } from 'express';
import { ProductService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuditService, AuditAction } from '../../shared/service/audit.service';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    // Already validated by middleware
    const result = await ProductService.createProduct(req.user!.id, req.body);

    await AuditService.log({
        actorId: req.user!.id,
        targetType: 'Product',
        targetId: result.id,
        actionType: AuditAction.CREATE,
        description: `Product created: ${result.title}`
    });

    res.status(201).json({ success: true, data: result });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search, category, page, limit } = req.query;
    const result = await ProductService.getProducts(req.user!, {
        search: search as string,
        category: category as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
    });
    res.status(200).json({ success: true, ...result });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductService.getProductById(req.params.id, req.user!);
    res.status(200).json({ success: true, data: result });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    // Already validated by middleware
    const result = await ProductService.updateProduct(req.params.id, req.user!, req.body);

    await AuditService.log({
        actorId: req.user!.id,
        targetType: 'Product',
        targetId: req.params.id,
        actionType: AuditAction.UPDATE,
        description: `Product updated: ${result.title}`
    });

    res.status(200).json({ success: true, data: result });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    await ProductService.deleteProduct(req.params.id, req.user!);

    await AuditService.log({
        actorId: req.user!.id,
        targetType: 'Product',
        targetId: req.params.id,
        actionType: AuditAction.DELETE,
        description: `Product deleted with ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, message: 'Product deleted' });
});
