/**
 * useSafeBottom / useSafeTop
 * Returns the correct inset padding needed to avoid Android system navigation
 * bar (gesture bar / 3-button nav) and iOS home indicator.
 * 
 * Usage: add `paddingBottom: safeBottom` to your ScrollView contentContainerStyle
 * so content is never hidden behind the system navigation bar.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Extra breathing room below safe inset
const ANDROID_EXTRA = 16;
const IOS_EXTRA = 8;

export function useSafeBottom(extra = 0): number {
  const insets = useSafeAreaInsets();
  // On Android, insets.bottom is usually correct for edge-to-edge. If 0 or small (e.g. inside Modal dialogs), fallback to 48 for standard 3-button nav bar.
  const baseBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : insets.bottom;
  return baseBottom + extra;
}

export function useSafeTop(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}
