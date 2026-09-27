import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export default function NewBadge({ style, textStyle }: { style?: any, textStyle?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.defaultBadge, style, { transform: [{ scale }] }]}>
      <Text style={[styles.defaultText, textStyle]}>NEW</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  defaultBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
