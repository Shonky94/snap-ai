import { useState, useEffect, useMemo } from 'react';
import { generateCaption, type CaptionResponse } from '@/services/captionService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/context/StoreContext';

interface CaptionGeneratorProps {
  imageFile?: File | null;
  imageUrl?: string | null;
}

export function CaptionGenerator({ imageFile, imageUrl }: CaptionGeneratorProps) {
  const { mediaItems, updateMediaItem } = useStore();
  const [caption, setCaption] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Sync local view from store by matching on imageUrl (base64 data url)
  useEffect(() => {
    if (!imageUrl) {
      setCaption('');
      setImageDescription('');
      setError(null);
      return;
    }
    const media = mediaItems.find((m) => m.fileUrl === imageUrl);
    if (media) {
      setCaption(media.caption || '');
      setImageDescription(media.imageDescription || '');
    } else {
      // If image came directly from file upload (before store?) default to empty
      setCaption('');
      setImageDescription('');
    }
  }, [imageUrl, mediaItems]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!imageFile && !imageUrl) {
      setError('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Convert imageUrl to File if needed
      let fileToSend = imageFile;
      if (!fileToSend && imageUrl) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        fileToSend = new File([blob], 'image.jpg', { type: blob.type });
      }
      
      if (!fileToSend) {
        throw new Error('No image available');
      }

  const result: CaptionResponse = await generateCaption(fileToSend, imageDescription || undefined);
      setCaption(result.caption);
      setImageDescription(result.image_description);

      // Update store item if we can match by URL
      if (imageUrl) {
        const media = mediaItems.find((m) => m.fileUrl === imageUrl);
        if (media) {
          updateMediaItem(media.id, { caption: result.caption, imageDescription: result.image_description });
        }
      }
      toast({
        title: 'Caption generated!',
        description: 'Your Instagram caption is ready',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate caption';
      setError(errorMessage);
      toast({
        title: 'Generation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Caption copied to clipboard',
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Instagram Caption
          </h3>
          <p className="text-sm text-muted-foreground">
            {isGenerating ? 'Generating your caption...' : 'AI-generated caption'}
          </p>
        </div>
        
        {caption && !isGenerating && (
          <Button
            onClick={handleGenerate}
            disabled={!imageFile && !imageUrl}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {imageDescription && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Image Analysis:
          </p>
          <p className="text-sm italic">{imageDescription}</p>
        </div>
      )}

      {caption && (
        <div className="space-y-2">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[150px] font-sans"
            placeholder="Your caption will appear here..."
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{caption.length} / 2,200 characters</span>
            
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={!caption}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-3 w-3" />
                  Copy Caption
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!caption && !isGenerating && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">
            {imageUrl ? 'No caption yet. Generate one for this image.' : 'Upload an image to generate a caption'}
          </p>
          <div className="mt-3">
            <Button onClick={handleGenerate} disabled={!imageFile && !imageUrl} size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Caption
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
