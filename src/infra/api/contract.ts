import { SupabaseClient } from '@supabase/supabase-js';

/**
 * IApiContract
 * 
 * This interface defines the expected structure of the frontend API infrastructure.
 * It abstracts the concrete Supabase client to allow for easier testing or 
 * replacement in the future.
 */
export interface IApiContract {
    client: SupabaseClient;
}

export interface IEmailContract {
    sendWelcome(to: string, name: string): Promise<any>;
    sendOrderConfirmation(to: string, order: { id: string, items: any[], total: number }): Promise<any>;
    sendSellerApproval(to: string, name: string): Promise<any>;
    sendSellerRejection(to: string, reason: string): Promise<any>;
    sendSupportReply(to: string, ticketNumber: string, message: string): Promise<any>;
}

export type ApiClient = SupabaseClient;
