import { useState } from 'react';
import { fabric } from 'fabric';
import { STICKER_LIBRARY, STICKER_CATEGORIES, getStickersByCategory, type Sticker } from '@/services/stickerService';
import { EMOJI_CATEGORIES } from '@/services/emojiService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';



interface StickerPickerProps {
  canvas: fabric.Canvas | null;
  disabled?: boolean;
}


export function StickerPicker({ canvas, disabled }: StickerPickerProps) {
  // Tabs: emoji categories + stickers
  const [activeTab, setActiveTab] = useState<string>(EMOJI_CATEGORIES[0].id);
  const [emojiSearch, setEmojiSearch] = useState('');

  // Add emoji to canvas as text
  const addEmojiToCanvas = (emoji: string) => {
    if (!canvas) return;
    const text = new fabric.Text(emoji, {
      fontSize: 60,
      fill: '#000000',
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
      shadow: new fabric.Shadow({
        color: 'rgba(255,255,255,0.5)',
        blur: 5,
        offsetX: 0,
        offsetY: 0,
      }),
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Add sticker to canvas (image or text)
  const addStickerToCanvas = (sticker: Sticker) => {
    if (!canvas) return;
    if (!sticker.url) {
      const text = new fabric.Text(sticker.name, {
        fontSize: 60,
        fill: '#000000',
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
          color: 'rgba(255,255,255,0.5)',
          blur: 5,
          offsetX: 0,
          offsetY: 0,
        }),
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    } else {
      fabric.Image.fromURL(sticker.url, (img) => {
        img.scale(0.3);
        img.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-row">
      {/* Emoji/Sticker Picker Section - wider, scrollable horizontally */}
  <div className="w-[420px] h-full flex flex-col bg-white border-r shadow-sm z-10 overflow-hidden">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Stickers & Emojis</h3>
          <p className="text-xs text-muted-foreground">Tap to add to image</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full flex flex-row overflow-x-auto no-scrollbar mb-2 gap-1">
            {EMOJI_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xl px-2 py-1 min-w-[44px]">
                <span>{cat.icon}</span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="stickers" className="text-xl px-2 py-1 min-w-[44px]">🖼️</TabsTrigger>
          </TabsList>

          {/* Emoji Keyboard UI - vertical scroll grid like mobile keyboard */}
          {EMOJI_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="p-2 m-0">
              <div className="mb-2">
                <input
                  type="text"
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder={`Search ${cat.name.toLowerCase()}...`}
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-80 max-h-[340px] overflow-x-hidden w-full">
                <div className="grid grid-cols-8 gap-1 p-1 box-border w-full max-w-full overflow-hidden justify-items-center">
                  {cat.emojis
                    .filter((emoji) =>
                      !emojiSearch || emoji.toLowerCase().includes(emojiSearch.toLowerCase())
                    )
                    .map((emoji, idx) => (
                      <Button
                        key={emoji + idx}
                        variant="ghost"
                        className="h-10 w-10 text-2xl flex items-center justify-center hover:scale-125 transition-transform overflow-hidden"
                        onClick={() => addEmojiToCanvas(emoji)}
                        title={cat.name}
                        disabled={disabled || !canvas}
                        style={{ minWidth: 0, minHeight: 0, padding: 0 }}
                      >
                        {emoji}
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}

          {/* Stickers tab */}
          <TabsContent value="stickers" className="p-2 m-0">
            <ScrollArea className="h-64">
              {STICKER_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-2">
                  <div className="font-semibold text-xs mb-1 flex items-center gap-1">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {getStickersByCategory(cat.id).map((sticker) => (
                      <Button
                        key={sticker.id}
                        variant="outline"
                        className="h-16 text-2xl hover:scale-110 transition-transform"
                        onClick={() => addStickerToCanvas(sticker)}
                        title={`Add ${sticker.name}`}
                        disabled={disabled || !canvas}
                      >
                        {sticker.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-3 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tip:</strong> Drag to move, corners to resize</p>
            <p>🗑️ Select an emoji and press Delete or use the delete button to remove it</p>
            <p>🧹 <strong>Clear All:</strong> <Button size="sm" variant="outline" onClick={() => {
              if (!canvas) return;
              // Only remove objects that are not the base image
              const objs = canvas.getObjects();
              objs.forEach(obj => {
                // Heuristic: base image is not fabric.Text and not fabric.Image with data.url (sticker)
                if ((obj.type === 'text') || (obj.type === 'image' && (obj as any).data?.sticker)) {
                  canvas.remove(obj);
                }
              });
              canvas.renderAll();
            }}>Clear Emojis/Stickers</Button></p>
          </div>
        </div>
      </div>

      {/* Canvas Section - shrunk to fit beside picker */}
      <div className="flex-1 h-full flex items-center justify-center bg-gray-100">
        {/* The parent Editor should pass a smaller height/width to ImageEditor */}
        {/* ...existing code for canvas goes here... */}
      </div>
    </div>
  );
}
