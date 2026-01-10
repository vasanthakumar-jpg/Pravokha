import nodemailer from 'nodemailer';
import { config } from '../core/config/env';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });

    static async sendOrderConfirmation(to: string, orderData: any) {
        const mailOptions = {
            from: `"Pravokha" <${config.email.user}>`,
            to,
            subject: `Order Confirmation - ${orderData.orderNumber}`,
            html: `
                <h1>Thank you for your order!</h1>
                <p>Order Number: ${orderData.orderNumber}</p>
                <p>Total Amount: ₹${orderData.total}</p>
                <p>Status: ${orderData.status}</p>
                <h3>Items:</h3>
                <ul>
                    ${orderData.items.map((item: any) => `<li>${item.title} x ${item.quantity} - ₹${item.price}</li>`).join('')}
                </ul>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }

    static async sendCancellationNotice(to: string, orderData: any) {
        const mailOptions = {
            from: `"Pravokha" <${config.email.user}>`,
            to,
            subject: `Order Cancelled - ${orderData.orderNumber}`,
            html: `
                <h1>Order Cancelled</h1>
                <p>Your order ${orderData.orderNumber} has been successfully cancelled and a refund has been initiated (if applicable).</p>
                <p>Total Refunded: ₹${orderData.total}</p>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }
}
