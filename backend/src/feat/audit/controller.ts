import { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuditService } from '../../shared/service/audit.service';

export class AuditController {
    static listLogs = asyncHandler(async (req: any, res: Response) => {
        const { limit, skip, actionType, severity, searchQuery, fromDate, toDate } = req.query;

        const options = {
            take: limit ? parseInt(limit as string) : 10,
            skip: skip ? parseInt(skip as string) : 0,
            actionType: actionType as string,
            severity: severity as string,
            searchQuery: searchQuery as string,
            fromDate: fromDate ? new Date(fromDate as string) : undefined,
            toDate: toDate ? new Date(toDate as string) : undefined
        };

        const logs = await AuditService.listLogs(options);
        const total = await AuditService.countLogs(options);

        res.json({
            success: true,
            logs,
            total
        });
    });
}
