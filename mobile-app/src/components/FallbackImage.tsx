import React, { useState, useEffect } from 'react';
import { ImageStyle, StyleProp, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { resolveImageUrl } from '../lib/imageUrl';

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
  iconSize = 32, 
  iconColor = '#8ec44a',
  resizeMode = 'cover'
}: FallbackImageProps) {
  const [retryStage, setRetryStage] = useState<number>(0); 
  // 0: try resolved/proxied URL
  // 1: try direct raw encoded URL
  // 2: fail -> fallback icon

  const resolvedUrl = resolveImageUrl(uri);
  const directUrl = uri ? (uri.includes(' ') ? uri.replace(/ /g, '%20') : uri) : null;

  useEffect(() => {
    setRetryStage(0);
  }, [uri]);

  if (!uri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
        <Feather name={fallbackIcon} size={iconSize} color={iconColor} />
      </View>
    );
  }

  if (retryStage >= 2) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }]}>
        <Feather name={fallbackIcon} size={iconSize} color={iconColor} />
      </View>
    );
  }

  const currentSourceUri = retryStage === 0 
    ? (resolvedUrl || directUrl) 
    : directUrl;

  return (
    <Image 
      source={{ uri: currentSourceUri || undefined }} 
      style={style} 
      contentFit={resizeMode === 'stretch' ? 'fill' : (resizeMode === 'repeat' || resizeMode === 'center' ? 'none' : resizeMode)}
      onError={() => {
        setRetryStage(prev => prev + 1);
      }} 
      transition={150}
      cachePolicy="memory-disk"
    />
  );
}
