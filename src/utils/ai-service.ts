
// This file connects to the real AI (OpenAI) via Supabase Edge Function

import { EnhancementSuggestion } from "@/types";
import { generateId } from "./media";
import { supabase } from "@/integrations/supabase/client";

// Calls the Supabase Edge Function for AI capabilities
async function callAIGenerate(
  fileType: "image" | "video",
  prompt?: string,
  extraContext?: string
): Promise<{ caption: string; enhancementSuggestions: EnhancementSuggestion[] }> {
  const { data, error } = await supabase.functions.invoke("generate-captions", {
    body: { fileType, prompt, extraContext },
  });
  if (error) {
    console.error("AI edge function error:", error);
    throw error;
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
  return {
    caption: data.caption || "",
    enhancementSuggestions,
  };
}

// AI caption generation (calls edge function)
export const generateAICaption = async (
  imageData: string | File
): Promise<string> => {
  // Only file type, no prompt/context for now
  const fileType =
    typeof imageData === "string" ||
    !("type" in imageData)
      ? "image"
      : imageData.type.startsWith("video/")
      ? "video"
      : "image";
  const { caption } = await callAIGenerate(fileType);
  return caption;
};

// AI visual analysis (calls edge function)
export const analyzeVisualContent = async (
  imageData: string | File
): Promise<EnhancementSuggestion[]> => {
  const fileType =
    typeof imageData === "string" ||
    !("type" in imageData)
      ? "image"
      : imageData.type.startsWith("video/")
      ? "video"
      : "image";
  const { enhancementSuggestions } = await callAIGenerate(fileType);
  return enhancementSuggestions;
};

// NOTE: All AI-powered suggestions/captions are now real (not mocked).
