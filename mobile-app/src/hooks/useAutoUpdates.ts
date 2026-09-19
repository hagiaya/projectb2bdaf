import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useAutoUpdates() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async (silent = true) => {
    // If running in development mode (Expo Go or local dev server), expo-updates is disabled
    if (!Updates.isEnabled || __DEV__) {
      if (!silent) {
        Alert.alert(
          'Mode Development',
          'Pembaruan Over-The-Air (OTA) otomatis aktif pada aplikasi rilis standalone / APK (Production).'
        );
      }
      return;
    }

    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();
      setLastCheckTime(new Date());

      if (update.isAvailable) {
        setIsDownloading(true);
        const fetchResult = await Updates.fetchUpdateAsync();
        setIsDownloading(false);

        if (fetchResult.isNew) {
          setIsUpdateAvailable(true);
          if (!silent) {
            Alert.alert(
              'Pembaruan Siap! 🚀',
              'Versi terbaru aplikasi telah selesai diunduh. Mulai ulang aplikasi sekarang untuk menerapkan perubahan?',
              [
                { text: 'Nanti', style: 'cancel' },
                {
                  text: 'Mulai Ulang Sekarang',
                  onPress: async () => {
                    await Updates.reloadAsync();
                  },
                },
              ]
            );
          }
        }
      } else {
        if (!silent) {
          Alert.alert('Aplikasi Terkini', 'Aplikasi Anda sudah menggunakan versi terbaru.');
        }
      }
    } catch (error: any) {
      console.warn('Auto-update check error:', error.message);
      if (!silent) {
        Alert.alert('Pemeriksaan Gagal', error.message || 'Tidak dapat terhubung ke server update.');
      }
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!Updates.isEnabled) return;
    try {
      await Updates.reloadAsync();
    } catch (err: any) {
      Alert.alert('Gagal Memulai Ulang', err.message);
    }
  }, []);

  useEffect(() => {
    // Check on initial load
    checkForUpdates(true);

    // Also check whenever user brings the app to the foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkForUpdates]);

  return {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    lastCheckTime,
    checkForUpdates,
    applyUpdate,
    updateId: Updates.updateId,
    runtimeVersion: Updates.runtimeVersion,
    channel: Updates.channel,
    isEnabled: Updates.isEnabled,
  };
}
