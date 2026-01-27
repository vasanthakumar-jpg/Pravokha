import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../../services/email.service';

export class EmailController {
    static async send(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, to, data, dry_run } = req.body;

            console.log(`[EmailController] Received request to send email: type=${type}, to=${to}, dry_run=${dry_run}`);

            if (dry_run) {
                console.log(`[EmailController] Dry run enabled. Skipping actual email send.`);
                return res.status(200).json({
                    success: true,
                    message: 'Dry run successful',
                    details: { type, to, data }
                });
            }

            switch (type) {
                case 'order_confirmation':
                    await EmailService.sendOrderConfirmation(to, data);
                    break;
                case 'order_cancellation':
                    await EmailService.sendCancellationNotice(to, data);
                    break;
                // Add more cases as needed
                default:
                    console.warn(`[EmailController] Unknown email type: ${type}`);
                    return res.status(400).json({
                        success: false,
                        message: `Unknown email type: ${type}`
                    });
            }

            res.status(200).json({
                success: true,
                message: 'Email sent successfully'
            });
        } catch (error) {
            console.error('[EmailController] Error sending email:', error);
            next(error);
        }
    }
}
