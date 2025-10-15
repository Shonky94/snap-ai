import { useState, useEffect } from 'react';
import { FILTER_PRESETS, generateFilterPreviews } from '@/services/filterService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterSelectorProps {
  imageUrl: string | null;
  selectedFilter: string;
  onFilterSelect: (filterId: string) => void;
  disabled?: boolean;
}

export function FilterSelector({ imageUrl, selectedFilter, onFilterSelect, disabled }: FilterSelectorProps) {
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    setIsLoading(true);
    generateFilterPreviews(imageUrl, 80)
      .then(setPreviews)
      .finally(() => setIsLoading(false));
  }, [imageUrl]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Filters</h3>
        <p className="text-xs text-muted-foreground">Choose a filter style</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {FILTER_PRESETS.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              className="w-full justify-start h-auto p-2"
              onClick={() => onFilterSelect(filter.id)}
              disabled={disabled}
            >
              <div className="flex items-center gap-3 w-full">
                {/* Preview thumbnail */}
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center text-xs">
                      ...
                    </div>
                  ) : previews.has(filter.id) ? (
                    <img
                      src={previews.get(filter.id)}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300" />
                  )}
                </div>
                
                {/* Filter info */}
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{filter.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {filter.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
