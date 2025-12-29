// @ts-nocheck

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CancelRequest {
    orderId: string;
    reason: string;
    comments?: string;
    userId: string;
}

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight Request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

        // 2. Body Parsing
        let body: CancelRequest;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid Request Body" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { orderId, reason, comments, userId } = body;
        console.log(`Processing cancellation for order ${orderId}`);

        // 3. Validation
        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set");
            return new Response(
                JSON.stringify({ warning: "Email service not configured, but order cancelled." }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // 4. Send Email via Resend
        // Define recipients
        const adminEmail = "admin@pravokha.com"; // Replace with real admin email if available
        const emailsToSend = [
            {
                to: "vasanthakumar@example.com", // In real app, fetch from DB
                subject: `Order Cancellation #${orderId}`,
                role: "User"
            },
            {
                to: adminEmail,
                subject: `[ADMIN] Order Cancelled #${orderId}`,
                role: "Admin"
            }
        ];

        // Note: In a production app, we would query the database here to get the 
        // real Seller emails associated with the items in this order.
        // Since we don't have direct DB access setup in this simple function yet, we proceed with Admin/User.

        const results = [];

        // Send emails in parallel or loop
        for (const mail of emailsToSend) {
            try {
                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: "Pravokha Orders <onboarding@resend.dev>",
                        to: [mail.to],
                        subject: mail.subject,
                        html: `
                        <h1>Order Cancellation Alert (${mail.role})</h1>
                        <p>Order <strong>#${orderId}</strong> has been cancelled.</p>
                        <p><strong>Reason:</strong> ${reason}</p>
                        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ""}
                        <p><strong>User ID:</strong> ${userId}</p>
                        <hr/>
                        <p>Please check the dashboard for more details.</p>
                    `,
                    }),
                });
                const data = await res.json();
                results.push({ email: mail.to, status: "sent", data });
            } catch (e) {
                console.error(`Failed to email ${mail.to}`, e);
                results.push({ email: mail.to, status: "failed", error: e.message });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
