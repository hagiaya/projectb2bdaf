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
  const platformExtra = Platform.OS === 'android' ? 80 : IOS_EXTRA; // Increased to 80 to ensure it doesn't touch the bottom nav
  return Math.max(insets.bottom + platformExtra + extra, platformExtra); // Ensure minimum padding even if insets.bottom is 0
}

export function useSafeTop(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}
