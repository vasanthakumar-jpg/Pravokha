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
    let message = error.message || 'Internal Server Error';

    // Production Error Masking: Hide internal details from users in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An unexpected error occurred. Our engineers have been notified.';
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};
