import nodemailer from 'nodemailer';
import { config } from '../../core/config/env';

/**
 * Email Service for sending automated notifications
 * Supports: Order confirmations, Refunds, Password reset, Admin actions
 */
export class EmailService {
    private static transporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });

    /**
     * Send refund confirmation email
     */
    static async sendRefundConfirmation(
        to: string,
        orderId: string,
        amount: number,
        customerName: string
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"Pravokha Support" <${config.email.user}>`,
                to,
                subject: `Refund Processed - Order #${orderId}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9fafb; padding: 30px; }
                            .amount { font-size: 24px; font-weight: bold; color: #10B981; }
                            .footer { text-align: center; padding: 20px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Refund Processed Successfully</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${customerName},</p>
                                <p>Your refund has been processed successfully.</p>
                                <p><strong>Order ID:</strong> ${orderId}</p>
                                <p><strong>Refund Amount:</strong> <span class="amount">₹${amount.toFixed(2)}</span></p>
                                <p>The refund will be credited to your original payment method within 5-7 business days.</p>
                                <p>If you have any questions, please contact our support team.</p>
                            </div>
                            <div class="footer">
                                <p>Thank you for shopping with Pravokha</p>
                                <p><small>This is an automated email. Please do not reply.</small></p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log(`✅ Refund confirmation email sent to ${to}`);
        } catch (error) {
            console.error('❌ Failed to send refund email:', error);
            // Don't throw - email failure shouldn't block the refund process
        }
    }

    /**
     * Send order confirmation email
     */
    static async sendOrderConfirmation(
        to: string,
        orderId: string,
        orderTotal: number,
        customerName: string
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"Pravokha Orders" <${config.email.user}>`,
                to,
                subject: `Order Confirmed - #${orderId}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9fafb; padding: 30px; }
                            .total { font-size: 24px; font-weight: bold; color: #4F46E5; }
                            .footer { text-align: center; padding: 20px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Order Confirmed!</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${customerName},</p>
                                <p>Thank you for your order! We're getting it ready for shipment.</p>
                                <p><strong>Order ID:</strong> ${orderId}</p>
                                <p><strong>Order Total:</strong> <span class="total">₹${orderTotal.toFixed(2)}</span></p>
                                <p>You can track your order status in your account dashboard.</p>
                                <p>We'll send you another email when your order ships.</p>
                            </div>
                            <div class="footer">
                                <p>Thank you for shopping with Pravokha</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log(`✅ Order confirmation email sent to ${to}`);
        } catch (error) {
            console.error('❌ Failed to send order confirmation email:', error);
        }
    }

    /**
     * Send admin action notification email
     */
    static async sendAdminActionNotification(
        to: string,
        action: string,
        details: string,
        performedBy: string
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"Pravokha Admin" <${config.email.user}>`,
                to,
                subject: `Admin Action: ${action}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #6366F1; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9fafb; padding: 30px; }
                            .action { font-weight: bold; color: #6366F1; }
                            .footer { text-align: center; padding: 20px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Admin Action Notification</h1>
                            </div>
                            <div class="content">
                                <p><strong>Action:</strong> <span class="action">${action}</span></p>
                                <p><strong>Performed By:</strong> ${performedBy}</p>
                                <p><strong>Details:</strong></p>
                                <p>${details}</p>
                            </div>
                            <div class="footer">
                                <p><small>This is an automated notification from Pravokha Admin System</small></p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log(`✅ Admin action notification sent to ${to}`);
        } catch (error) {
            console.error('❌ Failed to send admin notification email:', error);
        }
    }

    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(
        to: string,
        resetToken: string,
        customerName: string
    ): Promise<void> {
        const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

        try {
            await this.transporter.sendMail({
                from: `"Pravokha Security" <${config.email.user}>`,
                to,
                subject: 'Password Reset Request',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9fafb; padding: 30px; }
                            .button { display: inline-block; padding: 12px 30px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                            .footer { text-align: center; padding: 20px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Password Reset Request</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${customerName},</p>
                                <p>We received a request to reset your password. Click the button below to reset it:</p>
                                <p style="text-align: center;">
                                    <a href="${resetUrl}" class="button">Reset Password</a>
                                </p>
                                <p><small>Or copy this link: ${resetUrl}</small></p>
                                <p><strong>This link will expire in 1 hour.</strong></p>
                                <p>If you didn't request this, please ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>Pravokha Security Team</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log(`✅ Password reset email sent to ${to}`);
        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
        }
    }
}
