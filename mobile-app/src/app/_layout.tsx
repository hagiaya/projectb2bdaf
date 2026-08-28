import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Feather.font,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <WishlistProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </WishlistProvider>
  );
}
