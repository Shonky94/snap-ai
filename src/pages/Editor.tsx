import { useState, useCallback } from 'react';
import { fabric } from 'fabric';
import MediaUpload from '@/components/MediaUpload';
import MediaGallery from '@/components/MediaGallery';
import { ImageEditor } from '@/components/ImageEditor';
import { FilterSelector } from '@/components/FilterSelector';
import { StickerPicker } from '@/components/StickerPicker';
import { CaptionGenerator } from '@/components/CaptionGenerator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trash2, Upload as UploadIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function Editor() {
  // State for image editing
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const { toast } = useToast();

    // Handle file upload and selection
  const handleFileSelect = useCallback(async (file: File) => {
    setImageFile(file);
    // Convert to base64 data URL instead of blob URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFilter('original');
    setSelectedMediaId(null);
  }, []);

  // Handle gallery image selection
  const handleMediaSelect = useCallback((mediaItem: any) => {
    setSelectedMediaId(mediaItem.id);
    setImageFile(null);
    setImageUrl(mediaItem.fileUrl);
    setSelectedFilter('original');
  }, []);

  // Canvas ready callback
  const handleCanvasReady = useCallback((fabricCanvas: fabric.Canvas) => {
    setCanvas(fabricCanvas);
    // Enable delete key to remove selected objects
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && activeObject.type !== 'image') {
          fabricCanvas.remove(activeObject);
          fabricCanvas.renderAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Export edited image
  const handleExport = () => {
    if (!canvas) {
      toast({
        title: 'No image to export',
        description: 'Please upload and edit an image first',
        variant: 'destructive',
      });
      return;
    }
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `snap-ai-edit-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast({
      title: 'Image exported!',
      description: 'Your edited image has been downloaded',
    });
  };

  // Clear canvas except base image
  const handleClearCanvas = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj.type !== 'image' || obj.selectable !== false) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    toast({
      title: 'Canvas cleared',
      description: 'All stickers and text removed',
    });
  };

  const hasImage = imageFile || imageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="w-full px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Snap-AI Editor
              </h1>
              <p className="text-sm text-muted-foreground">Create stunning Instagram posts with AI</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                disabled={!canvas || !hasImage}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Image
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width, fit viewport height */}
      <main className="w-full px-4 md:px-6 py-6 h-[calc(100vh-72px)] overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Upload & Gallery */}
          <aside className="xl:col-span-2 space-y-6 h-full overflow-hidden">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <UploadIcon className="h-4 w-4 text-purple-600" />
                Upload Image
              </h3>
              <MediaUpload onFileSelect={handleFileSelect} />
            </Card>
            
            <Card className="p-4 h-[calc(100%-140px)] overflow-hidden">
              <h3 className="font-semibold mb-4 text-sm">Your Gallery</h3>
              <div className="h-[calc(100%-28px)] overflow-y-auto">
                <MediaGallery 
                  onMediaSelect={handleMediaSelect} 
                  selectedMediaId={selectedMediaId}
                />
              </div>
            </Card>
          </aside>

          {/* Center - Canvas with side tools */}
          <section className="xl:col-span-7 h-full flex flex-col min-h-0">
            <Card className="p-6 bg-white/80 backdrop-blur-sm h-full flex flex-col min-h-0">
              <div className="mb-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-lg">Canvas</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasImage ? 'Edit your image with filters and stickers' : 'Upload or select an image to start'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleClearCanvas}
                  disabled={!canvas || !hasImage}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Canvas
                </Button>
              </div>
              {/* Canvas with Sticker tools in a single full-height grid */}
              <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                <div className="col-span-12 2xl:col-span-9 h-full min-h-0">
                  {hasImage ? (
                    <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg h-full">
                      <ImageEditor
                        imageFile={imageFile}
                        imageUrl={imageUrl}
                        selectedFilter={selectedFilter}
                        onCanvasReady={handleCanvasReady}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Sparkles className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-lg text-gray-500 mb-2">No image selected</p>
                      <p className="text-sm text-gray-400">Upload a new image or select from your gallery</p>
                    </div>
                  )}
                </div>
                <div className="col-span-12 2xl:col-span-3 h-full flex flex-col min-h-0">
                  <Card className="p-4 bg-white/80 backdrop-blur-sm flex-1 min-h-0 overflow-hidden">
                    <StickerPicker 
                      canvas={canvas} 
                      disabled={!hasImage}
                    />
                  </Card>
                </div>
              </div>
            </Card>
          </section>

          {/* Right Sidebar - Caption Display with Filters below */}
          <aside className="xl:col-span-3 h-full overflow-hidden flex flex-col min-h-0 gap-4">
            <Card className="p-4 bg-white/80 backdrop-blur-sm overflow-auto flex-shrink-0">
              <CaptionGenerator 
                imageFile={imageFile} 
                imageUrl={imageUrl} 
              />
            </Card>
            <Card className="p-0 bg-white/80 backdrop-blur-sm overflow-hidden flex-1 min-h-0">
              <FilterSelector
                imageUrl={imageUrl}
                selectedFilter={selectedFilter}
                onFilterSelect={setSelectedFilter}
                disabled={!hasImage}
              />
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
