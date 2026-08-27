import React, { useState } from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface FallbackImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  fallbackIcon?: FeatherIconName;
  iconSize?: number;
  iconColor?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  downsampleWidth?: number;
}

export default function FallbackImage({ 
  uri, 
  style, 
  fallbackIcon = 'box', 
  iconSize = 36, 
  iconColor = '#8ec44a',
  resizeMode = 'cover'
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return <Feather name={fallbackIcon} size={iconSize} color={iconColor} />;
  }

  const safeUri = uri.includes(' ') ? uri.replace(/ /g, '%20') : uri;

  return (
    <Image 
      source={{ uri: safeUri }} 
      style={style} 
      contentFit={resizeMode === 'stretch' ? 'fill' : (resizeMode === 'repeat' || resizeMode === 'center' ? 'none' : resizeMode)}
      onError={() => setHasError(true)} 
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}
