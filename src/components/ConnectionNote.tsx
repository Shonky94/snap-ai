
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConnectionNote() {
  return (
    <Alert className="mt-6 bg-accent">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Backend Connection</AlertTitle>
      <AlertDescription className="flex flex-col space-y-4">
        <p>
          This application is running in demo mode with simulated AI responses.
          For production use, connect to a backend service with proper AI capabilities.
        </p>
        <p className="text-xs text-muted-foreground">
          Recommended: Connect to a backend service (like Supabase) and integrate with AI models
          for caption generation and image analysis.
        </p>
      </AlertDescription>
    </Alert>
  );
}
