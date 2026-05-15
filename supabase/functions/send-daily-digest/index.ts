// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Initialize Supabase client with admin privileges
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get today's date bounds in UTC
    const today = new Date().toISOString().split('T')[0];

    console.log(`Checking for reminders on ${today}`);

    // 1. Fetch users who have daily digest enabled
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, name, daily_digest_enabled')
      .eq('daily_digest_enabled', true);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles enabled for daily digest." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userIds = profiles.map((p: any) => p.id);

    // 2. Fetch active reminders for today that haven't been emailed yet
    // Using like to match 'YYYY-MM-DD%' since reminder_date might include time
    const { data: reminders, error: remindersError } = await supabaseClient
      .from('reminders')
      .select('id, title, message, reminder_date, user_id, contact_id, completed, email_sent')
      .in('user_id', userIds)
      .eq('completed', false)
      .eq('email_sent', false)
      .like('reminder_date', `${today}%`);

    if (remindersError) throw remindersError;

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders due today." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Group reminders by user_id
    const remindersByUser = reminders.reduce((acc: any, reminder: any) => {
      if (!acc[reminder.user_id]) acc[reminder.user_id] = [];
      acc[reminder.user_id].push(reminder);
      return acc;
    }, {});

    const emailsSent = [];
    const reminderIdsToUpdate = [];

    // 3. Send email to each user
    for (const [userId, userReminders] of Object.entries(remindersByUser)) {
      const profile = profiles.find((p: any) => p.id === userId);
      if (!profile || !profile.email) continue;

      const remindersListHtml = (userReminders as any[]).map(r => 
        `<li style="margin-bottom: 10px;"><strong>${r.title}</strong><br/>
         <span style="color: #666; font-size: 14px;">${r.message || 'No additional details'}</span></li>`
      ).join('');

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">Connectly - Daily Digest</h2>
          <p>Hi ${profile.name || 'there'},</p>
          <p>You have <strong>${(userReminders as any[]).length}</strong> reminder(s) due today:</p>
          <ul style="padding-left: 20px;">
            ${remindersListHtml}
          </ul>
          <div style="margin-top: 30px;">
            <a href="https://connectly.app/reminders" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Connectly</a>
          </div>
        </div>
      `;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Connectly Reminders <onboarding@resend.dev>", // Using Resend dev domain for testing, user should verify their domain
            to: profile.email,
            subject: `Your Daily Connectly Digest - ${(userReminders as any[]).length} Reminder(s)`,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          emailsSent.push(profile.email);
          reminderIdsToUpdate.push(...(userReminders as any[]).map(r => r.id));
        } else {
          console.error(`Failed to send email to ${profile.email}:`, await res.text());
        }
      } catch (err) {
        console.error(`Error sending to ${profile.email}:`, err);
      }
    }

    // 4. Update reminders to mark email_sent = true
    if (reminderIdsToUpdate.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('reminders')
        .update({ email_sent: true })
        .in('id', reminderIdsToUpdate);

      if (updateError) {
        console.error("Failed to update email_sent status:", updateError);
      }
    }

    return new Response(JSON.stringify({ 
      message: "Daily digest processed successfully", 
      emailsSentCount: emailsSent.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error processing daily digest:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
