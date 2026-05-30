import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { meetingTitle, contactName, notes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an expert meeting notes analyst for a professional CRM platform.
Given the following meeting details, generate a concise structured summary.

Meeting Title: ${meetingTitle || "Untitled Meeting"}
Contact: ${contactName || "Unknown"}
Notes: ${notes || "No notes provided"}

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{
  "summary": "2-3 sentence overview of what was discussed and decided.",
  "actionItems": [
    "Specific action item 1",
    "Specific action item 2"
  ]
}

Rules:
- summary must be 2-3 sentences max
- actionItems must be 2-4 concrete, actionable tasks starting with a verb (e.g., "Send", "Schedule", "Follow up")
- If no clear action items exist, return an empty array for actionItems
- Do NOT include any text outside the JSON object`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a concise meeting notes analyst. Always respond with valid JSON only, no markdown, no extra text." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    // Parse structured JSON from AI response
    let result: { summary: string; actionItems: string[] } = { summary: "", actionItems: [] };
    try {
      result = JSON.parse(rawContent);
      if (!result.summary) result.summary = "No summary available.";
      if (!Array.isArray(result.actionItems)) result.actionItems = [];
    } catch (_e) {
      // Fallback: treat raw content as plain summary
      result = { summary: rawContent, actionItems: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-meeting-notes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

