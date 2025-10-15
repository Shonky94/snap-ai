import { fabric } from 'fabric';

export interface FilterOption {
  id: string;
  name: string;
  description: string;
}

export const FILTER_PRESETS: FilterOption[] = [
  { id: 'original', name: 'Original', description: 'No filter' },
  { id: 'clarendon', name: 'Clarendon', description: 'High contrast & vibrant' },
  { id: 'juno', name: 'Juno', description: 'Cool tones & high contrast' },
  { id: 'lark', name: 'Lark', description: 'Bright & desaturated reds' },
  { id: 'valencia', name: 'Valencia', description: 'Warm & faded' },
  { id: 'aden', name: 'Aden', description: 'Soft pastel tones' },
  { id: 'vintage', name: 'Vintage', description: 'Sepia & low contrast' },
  { id: 'grayscale', name: 'B&W', description: 'Classic black & white' },
];

/**
 * Apply filter to Fabric.js image object
 */
export function applyFilter(
  fabricImage: fabric.Image,
  filterId: string
): fabric.Image {
  // Clear existing filters
  fabricImage.filters = [];

  switch (filterId) {
    case 'original':
      // No filters
      break;

    case 'clarendon':
      // High contrast, vibrant colors
      fabricImage.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.1 }),
        new fabric.Image.filters.Contrast({ contrast: 0.2 }),
        new fabric.Image.filters.Saturation({ saturation: 0.3 })
      );
      break;

    case 'juno':
      // Cool tones, high contrast
      fabricImage.filters.push(
        new fabric.Image.filters.Contrast({ contrast: 0.15 }),
        new fabric.Image.filters.Saturation({ saturation: -0.2 }),
        new fabric.Image.filters.HueRotation({ rotation: 0.05 })
      );
      break;

    case 'lark':
      // Bright, desaturated reds
      fabricImage.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.15 }),
        new fabric.Image.filters.Saturation({ saturation: -0.1 }),
        new fabric.Image.filters.Contrast({ contrast: -0.05 })
      );
      break;

    case 'valencia':
      // Warm, faded look
      fabricImage.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.05 }),
        new fabric.Image.filters.Contrast({ contrast: -0.05 }),
        new fabric.Image.filters.Saturation({ saturation: -0.15 }),
        new fabric.Image.filters.HueRotation({ rotation: 0.02 })
      );
      break;

    case 'aden':
      // Soft pastel tones
      fabricImage.filters.push(
        new fabric.Image.filters.Saturation({ saturation: -0.2 }),
        new fabric.Image.filters.Brightness({ brightness: 0.1 }),
        new fabric.Image.filters.HueRotation({ rotation: -0.02 })
      );
      break;

    case 'vintage':
      // Sepia effect
      fabricImage.filters.push(
        new fabric.Image.filters.Sepia(),
        new fabric.Image.filters.Contrast({ contrast: -0.1 }),
        new fabric.Image.filters.Brightness({ brightness: 0.05 })
      );
      break;

    case 'grayscale':
      // Black and white
      fabricImage.filters.push(
        new fabric.Image.filters.Grayscale(),
        new fabric.Image.filters.Contrast({ contrast: 0.1 })
      );
      break;
  }

  // Apply the filters
  fabricImage.applyFilters();
  // Defensive: ensure we didn't change the underlying element dimensions
  const el: any = (fabricImage as any)._originalElement;
  if (el && el.naturalWidth && el.naturalHeight) {
    // No-op to ensure intrinsic stays referenced; Fabric keeps width/height from element
    fabricImage.set({ dirty: true });
  }
  return fabricImage;
}

/**
 * Generate filter preview thumbnails
 */
export async function generateFilterPreviews(
  imageUrl: string,
  size: number = 100
): Promise<Map<string, string>> {
  return new Promise((resolve) => {
    const previews = new Map<string, string>();
    let loadedCount = 0;

    FILTER_PRESETS.forEach((filter) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        // Create small canvas for preview
        const canvas = new fabric.Canvas(null as any, {
          width: size,
          height: size,
        });

        // Scale image to fit preview
        const scale = Math.min(size / (img.width || 1), size / (img.height || 1));
        img.scale(scale);
        img.set({ originX: 'center', originY: 'center', left: size / 2, top: size / 2, selectable: false });

        // Apply filter
        applyFilter(img as any, filter.id);

        // Add to canvas and export
        canvas.add(img as any);
        canvas.renderAll();

        const dataUrl = canvas.toDataURL({ format: 'png' });
        previews.set(filter.id, dataUrl);

        loadedCount++;
        if (loadedCount === FILTER_PRESETS.length) {
          resolve(previews);
        }

        // Cleanup
        canvas.dispose();
      });
    });
  });
}
