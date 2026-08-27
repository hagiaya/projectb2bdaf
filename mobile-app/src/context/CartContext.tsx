import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';

export type CartItem = {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image_url?: string | null;
  image_urls?: string[];
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: any, quantity: number = 1) => {
    setItems((prevItems) => {
      const existing = prevItems.find(item => item.id === product.id);
      
      if (existing) {
        if (existing.quantity + quantity > product.stock) {
          Alert.alert('Gagal', `Stok tidak mencukupi. Tersisa ${product.stock} barang.`);
          return prevItems;
        }
        
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      if (quantity > product.stock) {
        Alert.alert('Gagal', `Stok tidak mencukupi. Tersisa ${product.stock} barang.`);
        return prevItems;
      }
      
      return [...prevItems, { 
        id: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity, 
        stock: product.stock,
        image_url: product.image_url,
        image_urls: product.image_urls
      }];
    });
    Alert.alert('Berhasil', `${product.name} telah ditambahkan ke keranjang.`);
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems((prevItems) => 
      prevItems.map(item => {
        if (item.id === productId) {
          if (quantity > item.stock) {
            Alert.alert('Gagal', `Stok tidak mencukupi. Tersisa ${item.stock} barang.`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
