import { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';
import { fabric } from 'fabric';
import { applyFilter } from '@/services/filterService';
import { useStore } from '@/context/StoreContext';
import { selectEmojisFromKeywords, generateSafeZonePositions } from '@/services/emojiService';
import { Button } from '@/components/ui/button';

interface ImageEditorProps {
  imageFile?: File | null;
  imageUrl?: string | null;
  selectedFilter: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  fitMode?: 'contain' | 'cover';
}

export function ImageEditor({ imageFile, imageUrl, selectedFilter, onCanvasReady, fitMode = 'contain' }: ImageEditorProps) {
  const { mediaItems, updateMediaItem } = useStore();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const baseImageRef = useRef<fabric.Image | null>(null);
  const originalSizeRef = useRef<{ width: number; height: number } | null>(null);
  const originalSrcRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const attemptedAutoPlaceRef = useRef<string | null>(null);
  const [isPlacingEmojis, setIsPlacingEmojis] = useState(false);
  const [selectedEmojiCoords, setSelectedEmojiCoords] = useState<{ left: number; top: number } | null>(null);
  // Track selected emoji and show delete button
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const handleSelection = () => {
      const active = canvas.getActiveObject();
      if (active && active.type === 'text') {
        // Get screen coords for floating button
        const { left, top } = active.getBoundingRect();
        setSelectedEmojiCoords({ left, top });
      } else {
        setSelectedEmojiCoords(null);
      }
    };
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedEmojiCoords(null));
    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared');
    };
  }, []);

  // Helper: clamp a point to be within given rect (with optional margin)
  const clampToRect = (x: number, y: number, rect: { left: number; top: number; width: number; height: number }, marginPx = 8) => {
    const minX = rect.left + marginPx;
    const maxX = rect.left + rect.width - marginPx;
    const minY = rect.top + marginPx;
    const maxY = rect.top + rect.height - marginPx;
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };

  // Re-clamp any auto-added emojis to current base image bounds (e.g., after resize/filter)
  const reclampAutoEmojis = (canvas: fabric.Canvas) => {
    try {
      const base = baseImageRef.current;
      if (!base) return;
      const rect = base.getBoundingRect(true, true);
      if (!rect) return;
      const objects = canvas.getObjects();
      let moved = 0;
      for (const o of objects) {
        const data = (o as any).data;
        if (data && data.autoEmoji) {
          const center = o.getCenterPoint();
          const clamped = clampToRect(center.x, center.y, rect, 12);
          if (Math.abs(center.x - clamped.x) > 0.5 || Math.abs(center.y - clamped.y) > 0.5) {
            o.set({ left: clamped.x, top: clamped.y, originX: 'center', originY: 'center' });
            (o as any).setCoords?.();
            moved++;
          }
        }
      }
      if (moved > 0) {
        canvas.requestRenderAll();
      }
    } catch (e) {
      console.log('[ImageEditor] reclampAutoEmojis error:', e);
    }
  };

  // Auto-place emojis exactly once per media item
  const autoPlaceEmojis = (canvas: fabric.Canvas, opts?: { force?: boolean }): boolean => {
    if (!imageUrl) return;
    // Find media by exact URL, or by matching the tail of the base64 to tolerate minor prefix differences
    const findMedia = () => {
      const exact = mediaItems.find((m) => m.fileUrl === imageUrl);
      if (exact) return exact;
      try {
        const tailLen = 128;
        const imgTail = imageUrl.slice(-tailLen);
        return mediaItems.find((m) => (m.fileUrl || '').slice(-tailLen) === imgTail);
      } catch {
        return undefined;
      }
    };
    const media = findMedia();
    if (!media) {
      console.log('[ImageEditor] autoPlaceEmojis: media not found for imageUrl');
      return false;
    }
  if (!media) return false;
  if (media.emojisPlaced && !opts?.force) return false;
    const caption = media.caption || '';
    const description = media.imageDescription || '';
    // Merge backend suggestions with local keyword selection for better relevance
    const localPicks = selectEmojisFromKeywords(caption, description);
    const merged = Array.from(new Set([...(media.suggestedEmojis || []), ...localPicks]));
    const candidates = merged.length > 0 ? merged : localPicks;
    if (!candidates || candidates.length === 0) {
      console.log('[ImageEditor] autoPlaceEmojis: no emoji candidates');
      return false;
    }

    const count = Math.min(4, Math.max(2, candidates.length));
    // Compute positions within the image bounds (not the entire canvas)
    const base = baseImageRef.current;
    if (!base) {
      console.log('[ImageEditor] autoPlaceEmojis: base image missing');
      return false;
    }
    const rect = base.getBoundingRect(true, true);
    if (!rect || rect.width < 40 || rect.height < 40) {
      console.log('[ImageEditor] autoPlaceEmojis: image bounds too small or not ready', rect);
      return false;
    }
    const margin = 0.08; // 8% inner margin inside the image
    const positions = generateSafeZonePositions(count).map((p) => {
      const px = Math.min(95, Math.max(5, p.left));
      const py = Math.min(95, Math.max(5, p.top));
      // Map percentage into inner area [margin, 1 - margin]
      const normX = (px / 100) * (1 - 2 * margin) + margin;
      const normY = (py / 100) * (1 - 2 * margin) + margin;
      const finalLeft = rect.left + rect.width * normX;
      const finalTop = rect.top + rect.height * normY;
      const clamped = clampToRect(finalLeft, finalTop, rect, 12);
      return { left: clamped.x, top: clamped.y };
    });

    // Place emojis as fabric.Text objects
  let placed = 0;
    for (let i = 0; i < count; i++) {
      const emoji = candidates[i % candidates.length];
      const pos = positions[i];
      const txt = new fabric.Text(emoji, {
        fontSize: 64,
        left: pos.left,
        top: pos.top,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
        selectable: true,
        hasControls: true,
        lockRotation: false,
      });
      // Tag as auto-placed emoji for later re-clamping or clearing
      (txt as any).data = { autoEmoji: true };
      canvas.add(txt);
      canvas.bringToFront(txt);
      (txt as any).setCoords?.();
      placed++;
    }
    canvas.renderAll();
    // Mark as placed to avoid duplicates on regenerate or re-open (only if we actually placed)
    if (placed > 0) {
      updateMediaItem(media.id, { emojisPlaced: true });
      console.log('[ImageEditor] autoPlaceEmojis: placed', { placed, candidates });
      return true;
    } else {
      console.log('[ImageEditor] autoPlaceEmojis: nothing placed');
      return false;
    }
  };

  // Clear existing auto-placed emojis (for manual re-place)
  const clearAutoPlacedEmojis = (canvas: fabric.Canvas) => {
    const objs = canvas.getObjects();
    const toRemove: fabric.Object[] = [];
    for (const o of objs) {
      const data = (o as any).data;
      if (data && data.autoEmoji) toRemove.push(o);
    }
    toRemove.forEach((o) => canvas.remove(o));
    if (toRemove.length > 0) {
      canvas.requestRenderAll();
    }
  };

  // Initialize canvas only once
  useEffect(() => {
    if (isInitializedRef.current || !canvasContainerRef.current) return;

    try {
      // Create canvas element manually to avoid React conflicts
      const canvasElement = document.createElement('canvas');
      canvasElement.id = 'fabric-canvas';
      canvasContainerRef.current.appendChild(canvasElement);
      canvasRef.current = canvasElement;

      const container = canvasContainerRef.current;
      // Initialize with container size, fallback to 800x600
      const initialWidth = container?.clientWidth || 800;
      const initialHeight = container?.clientHeight || 600;
      const canvas = new fabric.Canvas(canvasElement, {
        width: initialWidth,
        height: initialHeight,
        backgroundColor: '#f0f0f0',
        selection: true,
        preserveObjectStacking: true,
        enableRetinaScaling: false,
      });

      fabricCanvasRef.current = canvas;
      isInitializedRef.current = true;
      onCanvasReady(canvas);
    } catch (error) {
      console.error('Failed to initialize canvas:', error);
    }

  // Cleanup - remove canvas element
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
      if (canvasRef.current && canvasContainerRef.current) {
        try {
          canvasContainerRef.current.removeChild(canvasRef.current);
        } catch (e) {
          console.error('Remove canvas error:', e);
        }
      }
      isInitializedRef.current = false;
    };
  }, [onCanvasReady]);

  // Helper: fit image within canvas maintaining aspect ratio without cropping
  const fitImageToCanvas = (img: fabric.Image, canvas: fabric.Canvas) => {
    // Ensure no viewport zoom/pan that could create apparent cropping
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    // Prefer original intrinsic size captured at load time
    const iw = originalSizeRef.current?.width || (img as any)._originalElement?.naturalWidth || img.width || 1;
    const ih = originalSizeRef.current?.height || (img as any)._originalElement?.naturalHeight || img.height || 1;
    const safeIW = iw || 1;
    const safeIH = ih || 1;
  const scaler = fitMode === 'cover' ? Math.max : Math.min;
  let scale = scaler(cw / safeIW, ch / safeIH) * 0.95; // small padding
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: cw / 2,
      top: ch / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      objectCaching: false,
    });
    // Clamp just in case rounding created an overflow
    const gw = img.getScaledWidth?.() ?? (safeIW * scale);
    const gh = img.getScaledHeight?.() ?? (safeIH * scale);
    if (fitMode === 'contain' && (gw > cw * 0.999 || gh > ch * 0.999)) {
      const clamp = Math.min((cw * 0.95) / gw, (ch * 0.95) / gh);
      scale = scale * clamp;
      img.set({ scaleX: scale, scaleY: scale, left: cw / 2, top: ch / 2 });
    }
    img.setCoords();
    // Diagnostics (visible)
    try {
      const gw2 = img.getScaledWidth?.() ?? (safeIW * scale);
      const gh2 = img.getScaledHeight?.() ?? (safeIH * scale);
      console.log('[ImageEditor] fit', { cw, ch, iw: safeIW, ih: safeIH, scale, gw: gw2, gh: gh2 });
    } catch {}
  };

  // Resize canvas to container
  const resizeCanvasToContainer = () => {
    const container = canvasContainerRef.current;
    const canvas = fabricCanvasRef.current;
    if (!container || !canvas) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width && height) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.calcOffset();
      // Refit base image when canvas resizes
      const baseImage = baseImageRef.current;
      if (baseImage) {
        fitImageToCanvas(baseImage, canvas);
        // Keep any auto emojis within the new bounds
        reclampAutoEmojis(canvas);
        canvas.renderAll();
      }
    }
  };

  // Load image when file or URL changes
  useEffect(() => {
    if ((!imageFile && !imageUrl) || !fabricCanvasRef.current) return;

    setIsLoading(true);
    const canvas = fabricCanvasRef.current;
    let isMounted = true;

    const loadImage = (imgSrc: string) => {
      try {
        fabric.Image.fromURL(
          imgSrc,
          (img) => {
            if (!isMounted || !img || !canvas) {
              setIsLoading(false);
              return;
            }

            try {
              // Clear canvas safely
              canvas.clear();
              // Track original source and intrinsic size for aspect/quality preservation
              originalSrcRef.current = imgSrc;
              const el: HTMLImageElement | undefined = (img as any)?._originalElement;
              const natW = el?.naturalWidth || img.width || 0;
              const natH = el?.naturalHeight || img.height || 0;
              originalSizeRef.current = { width: natW, height: natH };

              // Ensure clean state
              img.set({ cropX: 0, cropY: 0, clipPath: undefined, objectCaching: false });
              // Fit image to current canvas without cropping
              fitImageToCanvas(img, canvas);
              baseImageRef.current = img;
              canvas.add(img);
              canvas.sendToBack(img);
              canvas.renderAll();
              // Auto-place emojis after first caption generation (defer to next tick for stable bounds)
              try {
                setTimeout(() => {
                  try {
                    const ok = autoPlaceEmojis(canvas);
                    if (!ok) {
                      // Try again shortly in case store sync or bounds not ready yet
                      setTimeout(() => {
                        try { autoPlaceEmojis(canvas); } catch {}
                      }, 200);
                    }
                    // Ensure any placed ones are perfectly clamped
                    reclampAutoEmojis(canvas);
                  } catch (e) {
                    console.log('[ImageEditor] autoPlaceEmojis error (deferred):', e);
                  }
                }, 0);
              } catch {}
              setIsLoading(false);
            } catch (err) {
              console.error('Error setting up image:', err);
              setIsLoading(false);
            }
          },
          { crossOrigin: 'anonymous' }
        );
      } catch (err) {
        console.error('Error loading image:', err);
        setIsLoading(false);
      }
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgSrc = e.target?.result as string;
        if (imgSrc && isMounted) {
          loadImage(imgSrc);
        }
      };
      reader.onerror = () => {
        if (isMounted) {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
      loadImage(imageUrl);
    }

    return () => {
      isMounted = false;
    };
  }, [imageFile, imageUrl]);

  // Retry auto-placement once when media item appears in store (handles upload race)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !imageUrl) return;
    const media = mediaItems.find((m) => m.fileUrl === imageUrl);
    if (!media) return;
    if (!baseImageRef.current) return;
    if (media.emojisPlaced) return;
    if (attemptedAutoPlaceRef.current === imageUrl) return;
    try {
      const ok = autoPlaceEmojis(canvas);
      if (ok) {
        attemptedAutoPlaceRef.current = imageUrl;
      }
    } catch {}
  }, [mediaItems, imageUrl]);

  // Apply filter when selectedFilter changes (no cropping, maintain positioning)
  useEffect(() => {
    if (!baseImageRef.current || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const currentSrc = originalSrcRef.current;
    if (!currentSrc) {
      // Fallback to refitting existing image if src missing
      const img = baseImageRef.current;
      if (img) {
        img.set({ cropX: 0, cropY: 0, clipPath: undefined, objectCaching: false });
        applyFilter(img, selectedFilter);
        fitImageToCanvas(img, canvas);
        img.setCoords();
        canvas.requestRenderAll();
      }
      return;
    }

    // Rebuild a fresh image from original source to avoid any stale state
    fabric.Image.fromURL(
      currentSrc,
      (newImg) => {
        if (!newImg) return;
        try {
          // Remove old base image
          if (baseImageRef.current) {
            canvas.remove(baseImageRef.current);
          }

          // Prepare clean state
          newImg.set({ cropX: 0, cropY: 0, clipPath: undefined, objectCaching: false, originX: 'center', originY: 'center' });
          applyFilter(newImg, selectedFilter);
          fitImageToCanvas(newImg, canvas);
          baseImageRef.current = newImg;
          canvas.add(newImg);
          canvas.sendToBack(newImg);
          newImg.setCoords();
          // Re-clamp any auto emojis to the potentially changed bounds
          reclampAutoEmojis(canvas);
          canvas.requestRenderAll();
        } catch (e) {
          console.error('Filter rebuild error:', e);
        }
      },
      { crossOrigin: 'anonymous' }
    );
  }, [selectedFilter]);

  // Resize canvas on container size changes
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      resizeCanvasToContainer();
    });
    if (canvasContainerRef.current) {
      observer.observe(canvasContainerRef.current);
    }
    window.addEventListener('resize', resizeCanvasToContainer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvasToContainer);
    };
  }, []);

  // Expose helper on window for export (optional)
  // Consumers should still use canvas.toDataURL with multiplier
  (window as any).getEditorExport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;
    // Use higher multiplier for better quality without changing displayed size
    return canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  };

  // Listen for Delete key to remove selected emoji (text only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active && active.type === 'text') {
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.renderAll();
          setSelectedEmojiCoords(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-[48vh] 2xl:h-[60vh] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
      {/* Auto-place Emoji control */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!imageUrl || !fabricCanvasRef.current || isPlacingEmojis}
          onClick={() => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            setIsPlacingEmojis(true);
            try {
              // Remove previous auto emojis and force re-place
              clearAutoPlacedEmojis(canvas);
              const ok = autoPlaceEmojis(canvas, { force: true });
              if (!ok) {
                // Retry once if bounds/media not ready yet
                setTimeout(() => {
                  try {
                    clearAutoPlacedEmojis(canvas);
                    autoPlaceEmojis(canvas, { force: true });
                    reclampAutoEmojis(canvas);
                  } catch {}
                  setIsPlacingEmojis(false);
                }, 200);
              } else {
                reclampAutoEmojis(canvas);
                setIsPlacingEmojis(false);
              }
            } catch (e) {
              console.log('[ImageEditor] manual auto-place error:', e);
              setIsPlacingEmojis(false);
            }
          }}
        >
          {isPlacingEmojis ? 'Placing…' : 'Auto-place emoji'}
        </Button>
      </div>
      {/* Floating delete button for selected emoji */}
      {selectedEmojiCoords && (
        <button
          className="absolute z-30 bg-white border border-gray-300 rounded-full shadow p-1 text-lg hover:bg-red-100"
          style={{ left: selectedEmojiCoords.left + 32, top: selectedEmojiCoords.top - 16 }}
          title="Delete emoji"
          onClick={() => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const active = canvas.getActiveObject();
            if (active && active.type === 'text') {
              canvas.remove(active);
              canvas.discardActiveObject();
              canvas.renderAll();
              setSelectedEmojiCoords(null);
            }
          }}
        >
          🗑️
        </button>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading image...</div>
        </div>
      )}
      <div ref={canvasContainerRef} className="canvas-wrapper w-full h-full" />
    </div>
  );
}
