
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
    
    const { fileType, prompt, extraContext, uniqueId } = await req.json();
    
    // Log the request with uniqueId to ensure new responses
    console.log(`Processing ${fileType} with prompt: ${prompt || "default"}, uniqueId: ${uniqueId}`);

    if (!openAIApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error", 
          details: "OpenAI API key is not configured",
          caption: `Wow! Check out this amazing visual! (${new Date().toISOString()})`,
          enhancementSuggestions: [
            {
              type: "filter",
              name: `Vibrant Boost (${uniqueId || new Date().toISOString()})`,
              description: "Enhance colors for more visual impact"
            },
            {
              type: "effect",
              name: `Soft Glow (${uniqueId || new Date().toISOString()})`,
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
      `Generate a catchy social media caption for the ${fileType} content provided. Be creative, natural, and concise. Make it sound authentic and unique. Return only the caption. Generate a fresh caption - reference ID: ${uniqueId || new Date().toISOString()}`;
    
    console.log("Sending caption request to OpenAI with uniqueId:", uniqueId);
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
              "You are an expert social media assistant generating captivating captions and content enhancement ideas for image or video posts. Always create unique, fresh captions - never repeat yourself.",
          },
          {
            role: "user",
            content: captionPrompt + (extraContext ? ` ${extraContext}` : "") + ` (uniqueId: ${uniqueId || new Date().toISOString()})`,
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
    
    // If no caption was generated, use a fallback with uniqueness
    const finalCaption = generatedCaption || `Check out this amazing visual! (${uniqueId || new Date().toISOString()})`;

    // 2. Generate Enhancement Suggestions
    const suggestPrompt = `Analyze the visual content for a social media post and suggest up to 6 visual enhancements. These can be:\n- filter (e.g., "Vibrant Boost")\n- effect (e.g., "Bokeh Blur")\n- crop (e.g., "Portrait Crop")\n- text (e.g., "Bold Quote")\nFormat as a JSON array of objects with properties: type ("filter"|"effect"|"crop"|"text"), name, description. Only output the JSON array, nothing else. Make the suggestions unique and fresh - uniqueId: ${uniqueId || new Date().toISOString()}`;
    
    console.log("Sending enhancements request to OpenAI with uniqueId:", uniqueId);
    const suggRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "You are a creative social media visual enhancement expert. Always create unique, fresh suggestions."
          },
          {
            role: "user",
            content: suggestPrompt + ` (uniqueId: ${uniqueId || new Date().toISOString()})`,
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
      // Use fallback with unique identifiers
      enhancements = [
        {
          type: "filter",
          name: `Vibrant Boost (${uniqueId || new Date().toISOString().substring(11,19)})`,
          description: "Enhance colors for more visual impact"
        },
        {
          type: "effect",
          name: `Soft Glow (${uniqueId || new Date().toISOString().substring(11,19)})`,
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
          // Add cache control headers to prevent caching
          "Cache-Control": "no-store, max-age=0"
        },
      }
    );
  } catch (error) {
    console.error("AI Generation error:", error);
    const timestamp = new Date().toISOString();
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate AI content", 
        details: error.message,
        timestamp: timestamp,
        caption: `Share your story with this amazing visual! (${timestamp})`,
        enhancementSuggestions: [
          {
            type: "filter",
            name: `Vibrant Boost (${timestamp.substring(11,19)})`,
            description: "Enhance colors for more visual impact"
          },
          {
            type: "effect",
            name: `Soft Glow (${timestamp.substring(11,19)})`,
            description: "Add a gentle luminous effect" 
          }
        ]
      }),
      {
        status: 200, // Return 200 even on error but with fallback content
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0"
        },
      }
    );
  }
});
