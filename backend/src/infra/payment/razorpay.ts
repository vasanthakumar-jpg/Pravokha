import Razorpay from 'razorpay';
import { config } from '../../core/config/env';
import crypto from 'crypto';

export const razorpayInstance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
});

/**
 * Validates the Razorpay payment signature
 * @param razorpayOrderId The order ID returned by Razorpay
 * @param razorpayPaymentId The payment ID returned by Razorpay
 * @param signature The signature returned by Razorpay
 * @returns boolean
 */
export function verifyRazorpaySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
): boolean {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
}

/**
 * Validates the Razorpay webhook signature
 * @param rawBody The raw request body
 * @param signature The signature from X-Razorpay-Signature header
 * @returns boolean
 */
export function verifyWebhookSignature(
    rawBody: string,
    signature: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');

    return expectedSignature === signature;
}
