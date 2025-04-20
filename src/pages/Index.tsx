
import { StoreProvider } from "@/context/StoreContext";
import Header from "@/components/Header";
import MediaUpload from "@/components/MediaUpload";
import MediaGallery from "@/components/MediaGallery";
import Footer from "@/components/Footer";
import ConnectionNote from "@/components/ConnectionNote";

const Index = () => {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container max-w-7xl p-6">
          <div className="mx-auto max-w-2xl mb-12">
            <h1 className="text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI-generated Captions & Visual Enhancements
            </h1>
            <p className="text-center text-lg text-muted-foreground">
              Upload your images or videos and get AI-generated caption suggestions
              and visual enhancement recommendations for your social media stories.
            </p>
          </div>
          
          <div className="space-y-12">
            <MediaUpload />
            <ConnectionNote />
            <MediaGallery />
          </div>
        </main>
        <Footer />
        <footer className="py-6 mt-10 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 SnapAI. All rights reserved.</p>
        </footer>
      </div>
    </StoreProvider>
  );
};

export default Index;
