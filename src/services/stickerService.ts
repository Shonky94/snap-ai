export interface Sticker {
  id: string;
  name: string;
  category: 'emojis' | 'shapes' | 'text';
  url: string;
}

// Note: You'll need to add actual sticker PNG files to /public/stickers/
// For now, using emoji Unicode as placeholders that can be rendered as text

export const STICKER_LIBRARY: Sticker[] = [
  // Emojis - These will be rendered as text initially
  // Replace with actual PNG files later
  { id: 'heart', name: '❤️', category: 'emojis', url: '' },
  { id: 'star', name: '⭐', category: 'emojis', url: '' },
  { id: 'fire', name: '🔥', category: 'emojis', url: '' },
  { id: 'sparkles', name: '✨', category: 'emojis', url: '' },
  { id: 'sunglasses', name: '😎', category: 'emojis', url: '' },
  { id: 'party', name: '🎉', category: 'emojis', url: '' },
  { id: 'camera', name: '📸', category: 'emojis', url: '' },
  { id: 'rainbow', name: '🌈', category: 'emojis', url: '' },
  { id: 'peace', name: '✌️', category: 'emojis', url: '' },
  { id: 'smile', name: '😊', category: 'emojis', url: '' },
  { id: 'laugh', name: '😂', category: 'emojis', url: '' },
  { id: 'love', name: '😍', category: 'emojis', url: '' },
  
  // Text bubbles
  { id: 'wow', name: 'WOW!', category: 'text', url: '' },
  { id: 'omg', name: 'OMG', category: 'text', url: '' },
  { id: 'yay', name: 'YAY', category: 'text', url: '' },
  { id: 'cool', name: 'COOL', category: 'text', url: '' },
  { id: 'yes', name: 'YES!', category: 'text', url: '' },
  { id: 'vibes', name: 'VIBES', category: 'text', url: '' },
];

export const STICKER_CATEGORIES = [
  { id: 'emojis', name: 'Emojis', icon: '😊' },
  { id: 'shapes', name: 'Shapes', icon: '⭐' },
  { id: 'text', name: 'Text', icon: '💬' },
] as const;

/**
 * Get stickers by category
 */
export function getStickersByCategory(category: Sticker['category']): Sticker[] {
  return STICKER_LIBRARY.filter(s => s.category === category);
}
