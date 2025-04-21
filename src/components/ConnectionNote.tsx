
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ConnectionNote() {
  const [showAlert, setShowAlert] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test the edge function connection
        const { data, error } = await supabase.functions.invoke("generate-captions", {
          body: { 
            fileType: "image",
            prompt: "Test connection" 
          }
        });
        
        setShowAlert(!!error || !data);
      } catch (e) {
        setShowAlert(true);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    checkConnection();
  }, []);
  
  if (checkingConnection || !showAlert) return null;
  
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Issue Detected</AlertTitle>
      <AlertDescription>
        We're having trouble connecting to our AI service. Uploads will still work, but captions and enhancements
        may use fallback content instead of custom AI-generated suggestions.
      </AlertDescription>
    </Alert>
  );
}
