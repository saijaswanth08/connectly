import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { name, email, title, category, description } = await req.json();

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0 || description.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toISOString();
    const categoryLabel = category || "Not specified";

    // Send issue report to company
    const reportRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Connectly <onboarding@resend.dev>",
        to: ["saijashuunallamaru@gmail.com"],
        subject: `Connectly Issue Report: ${title.trim().substring(0, 100)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Connectly Issue Report</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr><td style="padding: 8px 0; color: #666; width: 120px;"><strong>User:</strong></td><td style="padding: 8px 0;">${escapeHtml(name.trim())}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 8px 0;">${escapeHtml(email.trim())}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Category:</strong></td><td style="padding: 8px 0;">${escapeHtml(categoryLabel)}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Reported At:</strong></td><td style="padding: 8px 0;">${timestamp}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">Issue Title</h3>
              <p style="margin: 0; color: #333;">${escapeHtml(title.trim())}</p>
            </div>
            <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">Description</h3>
              <p style="margin: 0; color: #333; white-space: pre-wrap;">${escapeHtml(description.trim())}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!reportRes.ok) {
      const err = await reportRes.text();
      console.error("Resend error:", err);
      throw new Error("Failed to send issue report email");
    }

    // Send confirmation email to user (best-effort)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Connectly Support <onboarding@resend.dev>",
          to: [email.trim()],
          subject: "We received your issue report — Connectly",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a;">Hello ${escapeHtml(name.trim())},</h2>
              <p style="color: #333; line-height: 1.6;">
                Thank you for reporting an issue. Our support team will review it and get back to you if necessary.
              </p>
              <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; color: #666;"><strong>Issue:</strong> ${escapeHtml(title.trim())}</p>
              </div>
              <p style="margin-top: 24px; color: #666;">— Connectly Support</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Confirmation email failed (non-critical):", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
