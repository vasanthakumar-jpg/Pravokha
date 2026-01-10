import { AxiosInstance } from 'axios';

/**
 * IApiContract
 * 
 * This interface defines the expected structure of the frontend API infrastructure.
 */
export interface IApiContract {
    client: AxiosInstance;
}

export interface IEmailContract {
    sendWelcome(to: string, name: string): Promise<any>;
    sendOrderConfirmation(to: string, order: { id: string, items: any[], total: number }): Promise<any>;
    sendSellerApproval(to: string, name: string): Promise<any>;
    sendSellerRejection(to: string, reason: string): Promise<any>;
    sendSupportReply(to: string, ticketNumber: string, message: string): Promise<any>;
}

export type ApiClient = AxiosInstance;
