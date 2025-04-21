
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
    // Log function invocation
    console.log("generate-captions function called");
    
    const { fileType, prompt, extraContext } = await req.json();
    
    // Log the request
    console.log(`Processing ${fileType} with prompt: ${prompt || "default"}`);

    if (!openAIApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error", 
          details: "OpenAI API key is not configured",
          caption: "Wow! Check out this amazing visual!",
          enhancementSuggestions: [
            {
              type: "filter",
              name: "Vibrant Boost",
              description: "Enhance colors for more visual impact"
            },
            {
              type: "effect",
              name: "Soft Glow",
              description: "Add a gentle luminous effect" 
            }
          ]
        }),
        {
          status: 200, // Return 200 with fallback content
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Generate Caption
    const captionPrompt =
      prompt ||
      "Generate a catchy social media caption for the visual content provided. Be creative, natural, and concise. Return only the caption.";
    
    console.log("Sending caption request to OpenAI");
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
    console.log("OpenAI caption response:", JSON.stringify(captionData));
    
    // Extract the caption and ensure it's not empty
    const generatedCaption = captionData.choices?.[0]?.message?.content?.trim();
    console.log("Generated caption:", generatedCaption);
    
    // If no caption was generated, use a fallback
    const finalCaption = generatedCaption || "Check out this amazing visual!";

    // 2. Generate Enhancement Suggestions
    const suggestPrompt = `Analyze the visual content for a social media post and suggest up to 6 visual enhancements. These can be:\n- filter (e.g., "Vibrant Boost")\n- effect (e.g., "Bokeh Blur")\n- crop (e.g., "Portrait Crop")\n- text (e.g., "Bold Quote")\nFormat as a JSON array of objects with properties: type ("filter"|"effect"|"crop"|"text"), name, description. Only output the JSON array, nothing else.`;
    
    console.log("Sending enhancements request to OpenAI");
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
    console.log("OpenAI suggestions response:", JSON.stringify(suggData));
    
    let enhancements = [];
    const suggContent = suggData.choices?.[0]?.message?.content || "";
    console.log("Raw suggestions content:", suggContent);
    
    try {
      // Improved parsing logic to extract JSON
      const jsonMatch = suggContent.match(/\[.*\]/s);
      if (jsonMatch) {
        enhancements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (e) {
      console.error("Error parsing enhancement suggestions:", e);
      enhancements = [
        {
          type: "filter",
          name: "Vibrant Boost",
          description: "Enhance colors for more visual impact"
        },
        {
          type: "effect",
          name: "Soft Glow",
          description: "Add a gentle luminous effect" 
        }
      ];
    }

    console.log(`Returning results with caption: "${finalCaption}" and ${enhancements.length} enhancements`);
    // Return
    return new Response(
      JSON.stringify({
        caption: finalCaption,
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
      JSON.stringify({ 
        error: "Failed to generate AI content", 
        details: error.message,
        caption: "Share your story with this amazing visual!",
        enhancementSuggestions: [
          {
            type: "filter",
            name: "Vibrant Boost",
            description: "Enhance colors for more visual impact"
          },
          {
            type: "effect",
            name: "Soft Glow",
            description: "Add a gentle luminous effect" 
          }
        ]
      }),
      {
        status: 200, // Return 200 even on error but with fallback content
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
