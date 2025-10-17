
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/context/StoreContext";
import { EnhancementSuggestion, MediaItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogHeader as DialogHeader,
  AlertDialogTitle as DialogTitle,
  AlertDialogFooter as DialogFooter
} from "@/components/ui/alert-dialog";
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
    <div className="h-32 overflow-hidden rounded-t-md border border-border bg-gray-100">
      {item.fileType === 'image' ? (
        <img
          src={item.fileUrl}
          alt="Preview"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <video
          src={item.fileUrl}
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
    <Card className="overflow-hidden transition-all duration-300">
      <MediaPreview item={item} />
      <CardHeader className="p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </p>
          <CardTitle className="text-sm font-medium line-clamp-2">
            {item.caption || "No caption"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardFooter className="p-3 pt-0 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
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

interface MediaGalleryProps {
  onMediaSelect?: (mediaItem: MediaItem) => void;
  selectedMediaId?: string | null;
}

export default function MediaGallery({ onMediaSelect, selectedMediaId }: MediaGalleryProps) {
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

  // Helper to render selectable media cards
  const renderMediaCards = (items: MediaItem[]) => (
    <div className="grid grid-cols-1 gap-4">
      {items.map(item => (
        <div
          key={item.id}
          className={
            `cursor-pointer transition-all rounded-lg ${selectedMediaId === item.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`
          }
          onClick={() => {
            try {
              if (onMediaSelect && item) {
                onMediaSelect(item);
              }
            } catch (err) {
              console.error('Error selecting media:', err);
            }
          }}
        >
          <MediaCard item={item} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto">
      {renderMediaCards(mediaItems)}
    </div>
  );
}
