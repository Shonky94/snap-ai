
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/context/StoreContext";
import { processMediaFile } from "@/utils/media";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function MediaUpload() {
  const { addMediaItem, currentUser } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const handleFile = async (file: File) => {
    if (!file) return;
    
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
    <Card className="w-full scale-in hover-scale">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent float">
          Upload Media
        </CardTitle>
        <CardDescription className="text-center">
          Upload an image or video to generate AI captions and enhancement suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`
            relative rounded-lg border-2 border-dashed p-10 text-center
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
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium">
                Drag & drop or click to upload
              </p>
              <p className="text-sm text-muted-foreground">
                Supports images (JPG, PNG, GIF) and videos (MP4, MOV)
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
    </Card>
  );
}
