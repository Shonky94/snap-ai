
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancementSuggestion } from "@/types";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancementPreviewProps {
  suggestions: EnhancementSuggestion[];
}

const filterColors = {
  filter: "from-primary to-secondary",
  effect: "from-purple-400 to-purple-600",
  crop: "from-amber-400 to-amber-600",
  text: "from-emerald-400 to-emerald-600",
};

export default function EnhancementPreview({ suggestions }: EnhancementPreviewProps) {
  if (!suggestions.length) return null;

  return (
    <Card className="bg-accent my-6 scale-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Visual Enhancement Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <TooltipProvider>
            {suggestions.map((suggestion) => (
              <Tooltip key={suggestion.id}>
                <TooltipTrigger asChild>
                  <Badge
                    className={`
                      cursor-pointer px-3 py-2 hover:opacity-90 transition-all
                      bg-gradient-to-r ${filterColors[suggestion.type] || "from-primary to-secondary"}
                    `}
                  >
                    {suggestion.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{suggestion.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
