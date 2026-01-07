import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.errors,
        });
    }

    const error = err as AppError;
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
    });
};
