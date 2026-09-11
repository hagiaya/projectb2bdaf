import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WishlistItem = {
  id: string; // product id
  name: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string | null;
};

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = '@b2b_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveWishlist = async (newItems: WishlistItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  };

  const addToWishlist = (product: any) => {
    if (items.some(item => item.id === product.id)) {
      Alert.alert('Info', `${product.name} sudah ada di wishlist.`);
      return;
    }
    
    const newItems = [...items, { 
      id: product.id, 
      name: product.name, 
      price: Number(product.price), 
      stock: product.stock,
      category: product.categories?.name || 'Uncategorized',
      image_url: product.image_url
    }];
    saveWishlist(newItems);
    Alert.alert('Berhasil', `${product.name} ditambahkan ke wishlist.`);
  };

  const removeFromWishlist = (productId: string) => {
    const newItems = items.filter(item => item.id !== productId);
    saveWishlist(newItems);
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  if (!isLoaded) return null; // or a loading spinner if appropriate

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
