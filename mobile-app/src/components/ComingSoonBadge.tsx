import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ComingSoonBadgeProps {
  stacked?: boolean;
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
}

export default function ComingSoonBadge({ 
  stacked = true, 
  style, 
  textStyle,
  showIcon = true,
}: ComingSoonBadgeProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  if (stacked) {
    return (
      <Animated.View style={[styles.stackedBadge, style, { transform: [{ scale }] }]}>
        <View style={styles.stackedContent}>
          {showIcon && (
            <Feather name="clock" size={8} color="#ffffff" style={{ marginBottom: 1 }} />
          )}
          <Text style={[styles.stackedTextTop, textStyle]}>COMING</Text>
          <Text style={[styles.stackedTextBottom, textStyle]}>SOON</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.horizontalBadge, style, { transform: [{ scale }] }]}>
      {showIcon && <Feather name="clock" size={9} color="#ffffff" style={{ marginRight: 3 }} />}
      <Text style={[styles.horizontalText, textStyle]}>COMING SOON</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stackedBadge: {
    backgroundColor: '#16a34a', // Emerald/Leaf Green
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  stackedContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedTextTop: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 10,
    textAlign: 'center',
  },
  stackedTextBottom: {
    color: '#dcfce7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 10,
    textAlign: 'center',
  },
  horizontalBadge: {
    backgroundColor: '#16a34a', // Green
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  horizontalText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
