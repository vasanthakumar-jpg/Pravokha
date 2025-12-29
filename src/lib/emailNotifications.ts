// Email notification helper - Client Wrapper
// Replaces previous mock implementation with secure calls to emailClient

import { supabase } from '@/integrations/supabase/client';
import { emailClient } from './services/email/EmailClient';

// Helper to get user email/name from ID
async function getUserDetails(userId: string) {
    const { data: user } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
    return user;
}

export async function sendSuspensionEmail(userId: string, reason?: string) {
    try {
        const user = await getUserDetails(userId);
        if (!user || !user.email) return;

        // Using custom_notification for now to map to legacy template style
        // In full implementation, we can add dedicated types to the Edge Function
        return emailClient['invoke']('custom_notification', {
            to: user.email,
            data: {
                subject: '⚠️ Your Account Has Been Suspended',
                title: 'Account Suspended',
                message: `Your account has been suspended. Reason: ${reason || 'Violation of terms'}. Please contact support.`
            }
        });
    } catch (error) {
        console.error('Error sending suspension email:', error);
        return { success: false, error };
    }
}

export async function sendReactivationEmail(userId: string) {
    try {
        const user = await getUserDetails(userId);
        if (!user || !user.email) return;

        return emailClient['invoke']('custom_notification', {
            to: user.email,
            data: {
                subject: '✅ Account Reactivated',
                title: 'Welcome Back!',
                message: 'Your account has been reactivated successfully.'
            }
        });
    } catch (error) {
        console.error('Error sending reactivation email:', error);
        return { success: false, error };
    }
}

export async function sendTicketReplyEmail(ticketId: string, adminName?: string) {
    try {
        const { data: ticket } = await (supabase as any)
            .from('support_tickets')
            .select(`ticket_number, user:profiles!support_tickets_user_id_fkey(email)`)
            .eq('id', ticketId)
            .single();

        if (!ticket || !ticket.user?.email) return;

        return emailClient.sendSupportReply(
            ticket.user.email,
            ticket.ticket_number,
            "You have a new reply to your support ticket."
        );
    } catch (error) {
        console.error('Error sending ticket reply email:', error);
        return { success: false, error };
    }
}

export async function sendAppealStatusEmail(
    ticketId: string,
    status: 'approved' | 'rejected' | 'under_review',
    reason?: string
) {
    try {
        const { data: ticket } = await (supabase as any)
            .from('support_tickets')
            .select(`ticket_number, user:profiles!support_tickets_user_id_fkey(email)`)
            .eq('id', ticketId)
            .single();

        if (!ticket || !ticket.user?.email) return;

        return emailClient['invoke']('custom_notification', {
            to: ticket.user.email,
            data: {
                subject: `Appeal Update: ${status.toUpperCase()}`,
                title: `Appeal ${status === 'approved' ? 'Approved' : 'Status Update'}`,
                message: `Your appeal for ticket #${ticket.ticket_number} is now ${status}. ${reason ? `Reason: ${reason}` : ''}`
            }
        });
    } catch (error) {
        console.error('Error sending appeal status email:', error);
        return { success: false, error };
    }
}

export const EMAIL_CONFIG = {
    enabled: true,
    provider: 'supabase-edge'
};

