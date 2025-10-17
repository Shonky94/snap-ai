
export interface MediaItem {
  id: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  caption: string;
  // Optional BLIP-2 image analysis text for display
  imageDescription?: string;
  suggestedEmojis?: string[];
  emojisPlaced?: boolean;
  enhancementSuggestions: EnhancementSuggestion[];
  createdAt: number;
  userId?: string;
}

export interface EnhancementSuggestion {
  id: string;
  type: 'filter' | 'effect' | 'crop' | 'text';
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}
