import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAutoUpdates } from '../hooks/useAutoUpdates';

export default function AutoUpdateBanner() {
  const { isDownloading, isUpdateAvailable, applyUpdate } = useAutoUpdates();

  if (isDownloading) {
    return (
      <View style={styles.downloadingBanner}>
        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.bannerText}>Mengunduh pembaruan otomatis...</Text>
      </View>
    );
  }

  if (!isUpdateAvailable) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.iconCircle}>
        <Feather name="download-cloud" size={16} color="#ffffff" />
      </View>
      <View style={{ flex: 1, marginHorizontal: 8 }}>
        <Text style={styles.title}>Pembaruan Siap Diterapkan! 🚀</Text>
        <Text style={styles.subtitle}>Versi terbaru telah diunduh di latar belakang.</Text>
      </View>
      <TouchableOpacity
        onPress={applyUpdate}
        style={styles.reloadBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.reloadBtnText}>Perbarui</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  downloadingBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 16,
    right: 16,
    backgroundColor: '#15803d',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: '#86efac',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  reloadBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reloadBtnText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
  },
});
