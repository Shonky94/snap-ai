
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Footer() {
  return (
    <div className="w-full px-8 md:px-12 lg:px-16 xl:px-20 pb-16 pt-8">
      <Card className="p-6 text-center bg-accent">
        <h2 className="text-2xl font-bold mb-4">Ready to take your social media to the next level?</h2>
        <p className="mb-6 text-muted-foreground">
          SnapAI helps you create engaging social media content with AI-powered captions and visual enhancements.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <p className="text-sm text-muted-foreground w-full mb-2">
            Note: This is a demo application. Connect to a real database for persistent storage.
          </p>
        </div>
      </Card>
    </div>
  );
}
