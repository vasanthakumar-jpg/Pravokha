import { Request, Response, NextFunction } from 'express';
import { ReportService } from './service';

export class ReportController {
    static async getOrdersReport(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const { format } = req.query;

            const report = await ReportService.generateOrdersReport(
                user.id,
                user.role,
                format === 'csv' ? 'csv' : 'json'
            );

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=orders_report.csv');
                return res.send(report);
            }

            res.status(200).json({
                success: true,
                data: report
            });
        } catch (error) {
            next(error);
        }
    }
}
