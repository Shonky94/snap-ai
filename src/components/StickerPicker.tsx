import { useState } from 'react';
import { fabric } from 'fabric';
import { STICKER_LIBRARY, STICKER_CATEGORIES, getStickersByCategory, type Sticker } from '@/services/stickerService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StickerPickerProps {
  canvas: fabric.Canvas | null;
  disabled?: boolean;
}

export function StickerPicker({ canvas, disabled }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<Sticker['category']>('emojis');

  const addStickerToCanvas = (sticker: Sticker) => {
    if (!canvas) return;

    // For emoji/text stickers, create text object
    if (!sticker.url) {
      const text = new fabric.Text(sticker.name, {
        fontSize: 60,
        fill: '#000000',
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
          color: 'rgba(255, 255, 255, 0.5)',
          blur: 5,
          offsetX: 0,
          offsetY: 0,
        }),
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    } else {
      // For image stickers (when you add PNG files)
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
    <div className="w-full h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Stickers</h3>
        <p className="text-xs text-muted-foreground">Click to add to image</p>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Sticker['category'])} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3">
          {STICKER_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1">
          {STICKER_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="p-3 m-0">
              <div className="grid grid-cols-3 gap-2">
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
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>

      <div className="p-3 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Tip:</strong> Drag to move, corners to resize</p>
          <p>🗑️ Select and press Delete to remove</p>
        </div>
      </div>
    </div>
  );
}
