
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <main className="w-full px-8 md:px-12 lg:px-16 xl:px-20 py-20">
        {/* Hero Section */}
  <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Content Creation</span>
          </div>
          
          <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
            Create Stunning Instagram Posts
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Upload your photos, get AI-generated captions, apply beautiful filters, and add fun stickers - all in one place!
          </p>
          
          <Link to="/editor">
            <Button size="lg" className="text-lg px-8 py-6 h-auto">
              <Wand2 className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
  <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Captions</h3>
            <p className="text-muted-foreground">
              Generate trendy, engaging Instagram captions using BLIP-2 and Llama 3 AI models running locally on your machine.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instagram Filters</h3>
            <p className="text-muted-foreground">
              Apply professional Instagram-style filters like Clarendon, Valencia, and Aden to make your photos pop.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Wand2 className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fun Stickers</h3>
            <p className="text-muted-foreground">
              Drag and drop emojis, shapes, and text stickers to add personality and style to your images.
            </p>
          </div>
        </div>


        {/* Tech Stack Info */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-4">Powered by</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <span className="px-4 py-2 bg-white/60 rounded-full">BLIP-2</span>
            <span className="px-4 py-2 bg-white/60 rounded-full">Llama 3</span>
            <span className="px-4 py-2 bg-white/60 rounded-full">Fabric.js</span>
            <span className="px-4 py-2 bg-white/60 rounded-full">FastAPI</span>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t text-center text-sm text-muted-foreground bg-white/50">
        <p>© 2025 Snap-AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
