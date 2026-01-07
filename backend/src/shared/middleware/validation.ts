
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Higher-order middleware to validate incoming requests against a Zod schema.
 * Replaces req data with the validated/parsed version to ensure type safety.
 */
export const validate = (schema: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
