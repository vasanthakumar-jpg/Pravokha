import nodemailer from 'nodemailer';
import { prisma } from '../../infra/database/client';
import { EmailStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    /**
     * Send email with template
     */
    async sendEmail(options: {
        to: string;
        subject: string;
        template: string;
        variables?: Record<string, any>;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            // Load template
            const templatePath = path.join(__dirname, 'templates', `${options.template}.html`);
            let htmlContent = fs.readFileSync(templatePath, 'utf-8');

            // Replace variables
            if (options.variables) {
                Object.keys(options.variables).forEach((key) => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    htmlContent = htmlContent.replace(regex, options.variables![key]);
                });
            }

            // Create email log
            const emailLog = await prisma.emailLog.create({
                data: {
                    recipient: options.to,
                    subject: options.subject,
                    template: options.template,
                    status: EmailStatus.PENDING,
                    metadata: JSON.stringify(options.variables || {}),
                },
            });

            // Send email
            await this.transporter.sendMail({
                from: `"Pravokha" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: htmlContent,
            });

            // Update log as sent
            await prisma.emailLog.update({
                where: { id: emailLog.id },
                data: {
                    status: EmailStatus.SENT,
                    sentAt: new Date(),
                },
            });

            return { success: true };
        } catch (error: any) {
            console.error('[EmailService] Failed to send email:', error.message);

            // Log failure if log was created
            try {
                await prisma.emailLog.updateMany({
                    where: {
                        recipient: options.to,
                        subject: options.subject,
                        status: EmailStatus.PENDING,
                    },
                    data: {
                        status: EmailStatus.FAILED,
                        errorMessage: error.message,
                    },
                });
            } catch (logError) {
                console.error('[EmailService] Failed to log email error:', logError);
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmation(options: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        orderAmount: number;
        orderDate: string;
        orderItems: Array<{ title: string; quantity: number; price: number }>;
    }): Promise<void> {
        await this.sendEmail({
            to: options.customerEmail,
            subject: `Order Confirmation - ${options.orderNumber}`,
            template: 'orderConfirmation',
            variables: options,
        });
    }

    /**
     * Send payment success email
     */
    async sendPaymentSuccess(options: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        paymentAmount: number;
        paymentMethod: string;
        paymentDate: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.customerEmail,
            subject: `Payment Successful - ${options.orderNumber}`,
            template: 'paymentSuccess',
            variables: options,
        });
    }

    /**
     * Send order shipped email
     */
    async sendOrderShipped(options: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        trackingNumber?: string;
        trackingUrl?: string;
        courierName?: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.customerEmail,
            subject: `Your Order Has Shipped - ${options.orderNumber}`,
            template: 'orderShipped',
            variables: options,
        });
    }

    /**
     * Send order delivered email
     */
    async sendOrderDelivered(options: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        deliveryDate: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.customerEmail,
            subject: `Order Delivered - ${options.orderNumber}`,
            template: 'orderDelivered',
            variables: options,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(options: {
        email: string;
        name: string;
        resetLink: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.email,
            subject: 'Password Reset Request',
            template: 'passwordReset',
            variables: options,
        });
    }

    /**
     * Send seller approval email
     */
    async sendSellerApproval(options: {
        sellerEmail: string;
        sellerName: string;
        storeName: string;
        dashboardUrl: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.sellerEmail,
            subject: 'Your Seller Account Has Been Approved!',
            template: 'sellerApproval',
            variables: options,
        });
    }

    /**
     * Send low stock alert
     */
    async sendLowStockAlert(options: {
        sellerEmail: string;
        sellerName: string;
        productTitle: string;
        currentStock: number;
        threshold: number;
        productUrl: string;
    }): Promise<void> {
        await this.sendEmail({
            to: options.sellerEmail,
            subject: `Low Stock Alert: ${options.productTitle}`,
            template: 'lowStockAlert',
            variables: options,
        });
    }
}

export const emailService = new EmailService();
