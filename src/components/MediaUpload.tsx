
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/context/StoreContext";
import { processMediaFile } from "@/utils/media";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onFileSelect?: (file: File) => void;
}

export default function MediaUpload({ onFileSelect }: MediaUploadProps) {
  const { addMediaItem, currentUser } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file) return;

    // Call the callback if provided
    if (onFileSelect) {
      onFileSelect(file);
    }

    try {
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: "Your media is being processed...",
      });

      const mediaItem = await processMediaFile(file, currentUser?.id);
      addMediaItem(mediaItem);

      toast({
        title: "Upload Complete",
        description: "Your media has been processed successfully!",
      });

      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing media:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem processing your media. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <CardContent className="p-4">
        <div
          className={`
            relative rounded-lg border-2 border-dashed p-6 text-center
            transition-all duration-200 ease-in-out
            ${dragActive ? "border-primary bg-accent" : "border-muted"}
            ${isProcessing ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">Processing your media...</p>
              <p className="text-sm text-muted-foreground">
                Our AI is analyzing your content and generating suggestions
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium">
                Drag & drop or click
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF
              </p>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            disabled={isProcessing}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime"
            onChange={handleChange}
          />
        </div>
      </CardContent>
    </div>
  );
}
