
import { EnhancementSuggestion, MediaItem } from "@/types";

// Generate a random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Create object URL from File
export const createFileUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Get file type (image or video)
export const getFileType = (file: File): 'image' | 'video' => {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  }
  return 'image'; // Default
};

import { analyzeVisualContent, generateAICaption } from "./ai-service";

// Mock AI caption generation
export const generateCaption = async (file: File): Promise<string> => {
  // Use our AI service module (which would connect to a real AI in production)
  return await generateAICaption(file);
};

// Mock AI enhancement suggestions
export const generateEnhancementSuggestions = async (file: File): Promise<EnhancementSuggestion[]> => {
  // Use our AI service module (which would connect to a real AI in production)
  return await analyzeVisualContent(file);
};

// Process file to create media item with AI suggestions
export const processMediaFile = async (file: File, userId?: string): Promise<MediaItem> => {
  const fileUrl = createFileUrl(file);
  const fileType = getFileType(file);
  
  // Generate caption and suggestions in parallel
  const [caption, enhancementSuggestions] = await Promise.all([
    generateCaption(file),
    generateEnhancementSuggestions(file)
  ]);
  
  return {
    id: generateId(),
    fileUrl,
    fileType,
    caption,
    enhancementSuggestions,
    createdAt: Date.now(),
    userId
  };
};
