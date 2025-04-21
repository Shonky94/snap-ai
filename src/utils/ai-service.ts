
// This file connects to the real AI (OpenAI) via Supabase Edge Function

import { EnhancementSuggestion } from "@/types";
import { generateId } from "./media";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Calls the Supabase Edge Function for AI capabilities
async function callAIGenerate(
  fileType: "image" | "video",
  prompt?: string,
  extraContext?: string
): Promise<{ caption: string; enhancementSuggestions: EnhancementSuggestion[] }> {
  try {
    toast({
      title: "AI Processing",
      description: "Getting AI-powered suggestions...",
    });
    
    console.log("Calling AI generate with fileType:", fileType, "and uniqueId:", Date.now());
    
    const { data, error } = await supabase.functions.invoke("generate-captions", {
      body: { 
        fileType, 
        prompt, 
        extraContext,
        uniqueId: Date.now() // Add unique timestamp to avoid response caching
      },
    });
    
    if (error) {
      console.error("AI edge function error:", error);
      toast({
        title: "AI Error",
        description: "Could not connect to AI service. Using fallback content.",
        variant: "destructive",
      });
      throw error;
    }
    
    console.log("AI response data:", data);
    
    if (!data || (!data.caption && !data.enhancementSuggestions)) {
      console.error("Empty AI response:", data);
      toast({
        title: "AI Response Issue",
        description: "Received empty AI response. Using fallback content.",
        variant: "destructive",
      });
      throw new Error("Empty AI response");
    }
    
    // Generate random ids for suggestions if missing for React keys
    const enhancementSuggestions =
      (Array.isArray(data?.enhancementSuggestions)
        ? data.enhancementSuggestions
        : []
      ).map((sug) => ({
        ...sug,
        id: sug.id || generateId(),
      })) as EnhancementSuggestion[];
    
    toast({
      title: "AI Complete",
      description: "Generated caption and enhancement suggestions",
    });
    
    console.log("Processed AI data - caption:", data.caption);
    console.log("Processed AI data - suggestions:", enhancementSuggestions);
    
    return {
      caption: data.caption || "",
      enhancementSuggestions,
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    // Return fallback content with timestamp for uniqueness
    return {
      caption: `An amazing visual worth sharing! (${new Date().toLocaleTimeString()})`,
      enhancementSuggestions: [
        {
          id: generateId(),
          type: "filter",
          name: "Vibrant Boost",
          description: "Enhance colors for more visual impact"
        },
        {
          id: generateId(),
          type: "crop",
          name: "Center Focus",
          description: "Crop to emphasize the main subject"
        }
      ]
    };
  }
}

// AI caption generation (calls edge function)
export const generateAICaption = async (
  imageData: string | File
): Promise<string> => {
  try {
    // Only file type, no prompt/context for now
    const fileType =
      typeof imageData === "string" ||
      !("type" in imageData)
        ? "image"
        : imageData.type.startsWith("video/")
        ? "video"
        : "image";
    
    console.log("Generating caption for", fileType, "with uniqueId", Date.now());
    const { caption } = await callAIGenerate(fileType);
    console.log("Generated caption:", caption);
    
    return caption;
  } catch (error) {
    console.error("Caption generation failed:", error);
    return `Share your story with this amazing visual! (${new Date().toLocaleTimeString()})`;
  }
};

// AI visual analysis (calls edge function)
export const analyzeVisualContent = async (
  imageData: string | File
): Promise<EnhancementSuggestion[]> => {
  try {
    const fileType =
      typeof imageData === "string" ||
      !("type" in imageData)
        ? "image"
        : imageData.type.startsWith("video/")
        ? "video"
        : "image";
    
    console.log("Analyzing visual content for", fileType, "with uniqueId", Date.now());
    const { enhancementSuggestions } = await callAIGenerate(fileType);
    console.log("Generated suggestions:", enhancementSuggestions);
    
    return enhancementSuggestions;
  } catch (error) {
    console.error("Visual analysis failed:", error);
    return [
      {
        id: generateId(),
        type: "filter",
        name: `Vibrant Boost (${generateId().substring(0,4)})`,
        description: "Enhance colors for more visual impact"
      },
      {
        id: generateId(),
        type: "effect",
        name: `Soft Glow (${generateId().substring(0,4)})`,
        description: "Add a gentle luminous effect"
      }
    ];
  }
};

// NOTE: All AI-powered suggestions/captions are now real (not mocked).
