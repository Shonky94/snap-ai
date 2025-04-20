
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MediaItem, User } from '@/types';

interface StoreContextType {
  mediaItems: MediaItem[];
  currentUser: User | null;
  addMediaItem: (item: MediaItem) => void;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  removeMediaItem: (id: string) => void;
  getMediaItemById: (id: string) => MediaItem | undefined;
  login: (email: string, name: string) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize store from localStorage
  useEffect(() => {
    const storedMediaItems = localStorage.getItem('storySparkMediaItems');
    const storedUser = localStorage.getItem('storySparkUser');
    
    if (storedMediaItems) {
      setMediaItems(JSON.parse(storedMediaItems));
    }
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (mediaItems.length > 0) {
      localStorage.setItem('storySparkMediaItems', JSON.stringify(mediaItems));
    }
  }, [mediaItems]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('storySparkUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('storySparkUser');
    }
  }, [currentUser]);

  const addMediaItem = (item: MediaItem) => {
    setMediaItems(prev => [item, ...prev]);
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaItems(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const getMediaItemById = (id: string) => {
    return mediaItems.find(item => item.id === id);
  };

  const login = (email: string, name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: email.includes('admin') ? 'admin' : 'user',
    };
    setCurrentUser(newUser);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = {
    mediaItems,
    currentUser,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
    getMediaItemById,
    login,
    logout,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
