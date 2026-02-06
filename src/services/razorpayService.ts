import axios from 'axios';

const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id: string;
    handler: (response: any) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes?: Record<string, string>;
    theme: {
        color: string;
    };
    modal?: {
        ondismiss: () => void;
    };
}

class RazorpayService {
    private isLoaded = false;

    /**
     * Dynamically loads the Razorpay SDK
     */
    loadSDK(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.isLoaded) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = RAZORPAY_SDK_URL;
            script.onload = () => {
                this.isLoaded = true;
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    }

    /**
     * Opens the Razorpay checkout modal
     */
    async openCheckout(options: RazorpayOptions) {
        const loaded = await this.loadSDK();
        if (!loaded) {
            throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    }

    /**
     * Verifies payment on the backend
     */
    async verifyPayment(data: {
        orderId: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }) {
        const response = await axios.post('/api/payments/verify-payment', data);
        return response.data;
    }
}

export const razorpayService = new RazorpayService();
