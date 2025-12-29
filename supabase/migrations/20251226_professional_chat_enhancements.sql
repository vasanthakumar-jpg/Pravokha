-- Migration: Professional Chat Enhancements
-- Date: 2025-12-26

-- 1. Add is_read column to ticket_messages
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 2. Enhance RLS for support_tickets to allow users to update their tickets (e.g. status tracking)
DROP POLICY IF EXISTS "Users Update Own Tickets" ON public.support_tickets;
CREATE POLICY "Users Update Own Tickets" ON public.support_tickets 
FOR UPDATE USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Enhance RLS for ticket_messages to allow senders to update read status
DROP POLICY IF EXISTS "Users Update Message Read Status" ON public.ticket_messages;
CREATE POLICY "Users Update Message Read Status" ON public.ticket_messages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets st 
        WHERE st.id = ticket_id AND (st.user_id = auth.uid() OR public.is_admin())
    )
);

-- 4. Ensure Users can INSERT messages into their own tickets
DROP POLICY IF EXISTS "Users Create Own Ticket Messages" ON public.ticket_messages;
CREATE POLICY "Users Create Own Ticket Messages" ON public.ticket_messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_tickets st 
        WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
);

-- 5. Add realtime for ticket_messages read status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
    END IF;
END $$;
