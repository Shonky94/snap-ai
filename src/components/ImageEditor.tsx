import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { applyFilter } from '@/services/filterService';

interface ImageEditorProps {
  imageFile?: File | null;
  imageUrl?: string | null;
  selectedFilter: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  fitMode?: 'contain' | 'cover';
}

export function ImageEditor({ imageFile, imageUrl, selectedFilter, onCanvasReady, fitMode = 'contain' }: ImageEditorProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const baseImageRef = useRef<fabric.Image | null>(null);
  const originalSizeRef = useRef<{ width: number; height: number } | null>(null);
  const originalSrcRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="relative w-full h-[60vh] 2xl:h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading image...</div>
        </div>
      )}
      <div ref={canvasContainerRef} className="canvas-wrapper w-full h-full" />
    </div>
  );
}
