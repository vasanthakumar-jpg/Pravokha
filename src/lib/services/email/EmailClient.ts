import { supabase } from "@/infra/api/supabase";

// --- Types ---

export type EmailType =
    | "welcome"
    | "order_confirmation"
    | "seller_approval"
    | "seller_rejection"
    | "new_order_seller"
    | "admin_alert"
    | "custom_notification";

export interface EmailPayload {
    to: string;
    data: any;
    dry_run?: boolean; // If true, function logs only, doesn't send
}

// --- Client ---

class EmailClientService {
    private isDev = import.meta.env.DEV;

    /**
     * Invokes the secure Edge Function to send an email.
     * Client NEVER sees the API Key.
     */
    private async invoke(type: EmailType, payload: EmailPayload) {
        try {
            console.log(`[EmailClient] Invoking 'send-email' for type: ${type}`);

            const { data, error } = await supabase.functions.invoke("send-email", {
                body: {
                    type,
                    to: payload.to,
                    data: payload.data,
                    dry_run: payload.dry_run ?? this.isDev, // Default to dry-run in Dev unless specified
                },
            });

            if (error) {
                console.error("[EmailClient] Function Invocation Error:", error);
                return { success: false, error };
            }

            console.log("[EmailClient] Success:", data);
            return { success: true, data };
        } catch (err) {
            console.error("[EmailClient] Unexpected Error:", err);
            return { success: false, error: err };
        }
    }

    // --- Convenience Methods ---

    async sendWelcome(to: string, name: string) {
        return this.invoke("welcome", { to, data: { name } });
    }

    async sendOrderConfirmation(to: string, order: { id: string, items: any[], total: number }) {
        return this.invoke("order_confirmation", {
            to,
            data: {
                orderId: order.id,
                items: order.items,
                total: order.total
            }
        });
    }

    async sendSellerApproval(to: string, name: string) {
        return this.invoke("seller_approval", { to, data: { name } });
    }

    async sendSellerRejection(to: string, reason: string) {
        return this.invoke("seller_rejection", { to, data: { reason } });
    }

    async sendSupportReply(to: string, ticketNumber: string, message: string) {
        return this.invoke("custom_notification", {
            to,
            data: {
                subject: `Update on Ticket #${ticketNumber}`,
                title: "Admins have replied to your ticket",
                message: message
            }
        });
    }
}

export const emailClient = new EmailClientService();
