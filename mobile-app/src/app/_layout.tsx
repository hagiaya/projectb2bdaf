import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Feather.font,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
