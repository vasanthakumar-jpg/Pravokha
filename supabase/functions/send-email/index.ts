// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "npm:resend@2.0.0";

// @ts-ignore
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SENDER_EMAIL = "onboarding@resend.dev"; // Default Resend testing email

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
    type: "welcome" | "order_confirmation" | "seller_approval" | "seller_rejection" | "new_order_seller" | "admin_alert" | "custom_notification";
    to: string;
    data: any;
    dry_run?: boolean;
}

serve(async (req: any) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload: EmailPayload = await req.json();
        const { type, to, data, dry_run } = payload;

        // Log the request for debugging
        console.log(`[Email Service] Request received: Type=${type}, To=${to}, DryRun=${dry_run}`);

        if (dry_run) {
            console.log(`[Dry Run] Email would be sent to ${to} with data:`, data);
            return new Response(JSON.stringify({ success: true, message: "Dry run successful" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // @ts-ignore
        if (!Deno.env.get("RESEND_API_KEY")) {
            console.error("RESEND_API_KEY is missing in Edge Runtime.");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            });
        }

        let subject = "";
        let html = "";

        // --- TEMPLATE LOGIC ---
        // (In a larger app, move this to separate files)
        switch (type) {
            case "welcome":
                subject = "Welcome to Pravokha!";
                html = `<h1>Welcome ${data.name}!</h1><p>We are excited to have you on board.</p>`;
                break;

            case "order_confirmation":
                subject = `Order Confirmation #${data.orderId}`;
                html = `
          <h1>Thank you for your order!</h1>
          <p>Order ID: ${data.orderId}</p>
          <p>Total: $${data.total}</p>
          <h3>Items:</h3>
          <ul>
            ${data.items.map((item: any) => `<li>${item.title} (x${item.quantity}) - $${item.price}</li>`).join("")}
          </ul>
        `;
                break;

            case "seller_approval":
                subject = "Your Seller Account is Approved! 🎉";
                html = `<h1>Congratulations!</h1><p>You can now start selling on Pravokha.</p>`;
                break;

            case "seller_rejection":
                subject = "Update regarding your Seller Application";
                html = `<h1>Application Update</h1><p>${data.reason || "Your application was not approved at this time."}</p>`;
                break;

            case "new_order_seller":
                subject = `New Order Received #${data.orderId}`;
                html = `<h1>New Order!</h1><p>You have sold items in Order #${data.orderId}. Check your dashboard to fulfill.</p>`;
                break;

            case "custom_notification":
                subject = data.subject || "Notification";
                html = `<h2>${data.title}</h2><p>${data.message}</p>`;
                break;

            default:
                throw new Error(`Unknown email type: ${type}`);
        }

        // --- SENDING LOGIC ---
        const { data: resdata, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        console.log("Email sent successfully:", resdata);

        return new Response(JSON.stringify(resdata), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
