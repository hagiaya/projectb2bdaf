import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { View, ActivityIndicator } from 'react-native';
import AutoUpdateBanner from '../components/AutoUpdateBanner';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Feather.font,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Safety timeout: Proceed after 400ms so font loading never blocks the screen
    const timer = setTimeout(() => {
      setReady(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded && !error && !ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#8ec44a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <WishlistProvider>
      <CartProvider>
        <AutoUpdateBanner />
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </WishlistProvider>
  );
}
