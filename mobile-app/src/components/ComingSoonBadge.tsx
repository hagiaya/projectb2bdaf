import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export default function ComingSoonBadge({ style, textStyle }: { style?: any, textStyle?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.defaultBadge, style, { transform: [{ scale }] }]}>
      <Text style={[styles.defaultText, textStyle]}>COMING SOON</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  defaultBadge: {
    backgroundColor: '#8b5cf6', // Violet
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
