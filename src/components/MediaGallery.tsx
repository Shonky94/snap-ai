
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/context/StoreContext";
import { EnhancementSuggestion, MediaItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancementPreview from "./EnhancementPreview";

interface MediaPreviewProps {
  item: MediaItem;
}

const MediaPreview = ({ item }: MediaPreviewProps) => {
  return (
    <div className="h-60 overflow-hidden rounded-t-md border border-border">
      {item.fileType === 'image' ? (
        <img
          src={item.fileUrl}
          alt="Preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={item.fileUrl}
          controls
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};

interface EnhancementBadgeProps {
  suggestion: EnhancementSuggestion;
}

const EnhancementBadge = ({ suggestion }: EnhancementBadgeProps) => {
  const bgClass = 
    suggestion.type === 'filter' ? 'bg-primary/20 text-primary' :
    suggestion.type === 'effect' ? 'bg-purple-100 text-purple-600' :
    suggestion.type === 'crop' ? 'bg-amber-100 text-amber-600' :
    'bg-emerald-100 text-emerald-600';
  
  return (
    <Badge variant="outline" className={`${bgClass} p-2`}>
      {suggestion.name}
    </Badge>
  );
};

interface MediaCardProps {
  item: MediaItem;
}

const MediaCard = ({ item }: MediaCardProps) => {
  const { updateMediaItem, removeMediaItem, currentUser } = useStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedCaption, setEditedCaption] = useState(item.caption);
  
  const handleSave = () => {
    updateMediaItem(item.id, { caption: editedCaption });
    setIsEditDialogOpen(false);
  };
  
  const handleDelete = () => {
    removeMediaItem(item.id);
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md fade-in-up hover-scale">
      <MediaPreview item={item} />
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
            <CardTitle className="text-lg font-medium">
              {item.caption || "No caption available"}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <EnhancementPreview suggestions={item.enhancementSuggestions} />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default function MediaGallery() {
  const { mediaItems } = useStore();
  
  if (mediaItems.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-muted-foreground">
            No media items yet. Upload something to get started!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full">
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Media</h2>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaItems.map(item => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="images">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaItems
              .filter(item => item.fileType === 'image')
              .map(item => (
                <MediaCard key={item.id} item={item} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="videos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaItems
              .filter(item => item.fileType === 'video')
              .map(item => (
                <MediaCard key={item.id} item={item} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
