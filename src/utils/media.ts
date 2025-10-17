
import { EnhancementSuggestion, MediaItem } from "@/types";

// Generate a random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Convert File to base64 data URL (persists in localStorage)
export const createFileUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
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


import { generateCaption as fetchAICaption } from "@/services/captionService";


// Generate AI caption using backend API
export const generateCaption = async (file: File): Promise<{ caption: string; imageDescription?: string; suggestedEmojis?: string[] }> => {
  const response = await fetchAICaption(file);
  return { caption: response.caption, imageDescription: response.image_description, suggestedEmojis: response.suggested_emojis };
};

// Process file to create media item with AI suggestions
export const processMediaFile = async (file: File, userId?: string): Promise<MediaItem> => {
  const fileUrl = await createFileUrl(file); // Now async - converts to base64
  const fileType = getFileType(file);
  const { caption, imageDescription, suggestedEmojis } = await generateCaption(file);
  return {
    id: generateId(),
    fileUrl,
    fileType,
    caption,
    imageDescription,
    suggestedEmojis,
    emojisPlaced: false,
    enhancementSuggestions: [], // Not used, backend only returns captions
    createdAt: Date.now(),
    userId
  };
};
