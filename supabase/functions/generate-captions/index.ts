
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { fileType, prompt, extraContext } = await req.json();

    // 1. Generate Caption
    const captionPrompt =
      prompt ||
      "Generate a catchy social media caption for the visual content provided. Be creative, natural, and concise. Return only the caption.";
    const captionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert social media assistant generating captivating captions and content enhancement ideas for image or video posts.",
          },
          {
            role: "user",
            content: captionPrompt + (extraContext ? ` ${extraContext}` : ""),
          },
        ],
        max_tokens: 64,
        temperature: 0.9,
      }),
    });
    const captionData = await captionRes.json();
    const generatedCaption = captionData.choices?.[0]?.message?.content?.trim() || "";

    // 2. Generate Enhancement Suggestions
    const suggestPrompt = `Analyze the visual content for a social media post and suggest up to 6 visual enhancements. These can be:\n- filter (e.g., "Vibrant Boost")\n- effect (e.g., "Bokeh Blur")\n- crop (e.g., "Portrait Crop")\n- text (e.g., "Bold Quote")\nFormat as a JSON array of objects with properties: type ("filter"|"effect"|"crop"|"text"), name, description. Only output the JSON array, nothing else.`;
    const suggRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a creative social media visual enhancement expert." },
          {
            role: "user",
            content: suggestPrompt,
          },
        ],
        max_tokens: 400,
        temperature: 1.0,
      }),
    });
    const suggData = await suggRes.json();
    let enhancements: Array<any> = [];
    try {
      // Minimal parsing logic to make sure we only parse pure JSON
      enhancements = JSON.parse(
        (suggData.choices?.[0]?.message?.content || "")
          .replace(/^[^[]+/, "") // Remove anything before the array
          .replace(/[^]]+$/, "") // Remove anything after the array
      );
    } catch (e) {
      enhancements = [];
    }

    // Return
    return new Response(
      JSON.stringify({
        caption: generatedCaption,
        enhancementSuggestions: enhancements,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate AI content", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
