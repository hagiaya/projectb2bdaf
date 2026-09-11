import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import * as Location from 'expo-location';

export default function NewDealer() {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [regionId, setRegionId] = useState<string>('');
  const [regions, setRegions] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [salesId, setSalesId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // 1. Get Sales ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sData } = await supabase
          .from('sales')
          .select('id, region_id')
          .eq('profile_id', user.id)
          .maybeSingle();
        if (sData) {
          setSalesId(sData.id);
          if (sData.region_id) setRegionId(sData.region_id);
        }
      }

      // 2. Fetch regions
      const { data: rData } = await supabase.from('regions').select('id, name').order('name');
      if (rData && rData.length > 0) {
        setRegions(rData);
        if (!regionId) setRegionId(rData[0].id);
      }

      // 3. Get current location
      getCurrentLocation();
    } catch (err) {
      console.error('Error init new dealer:', err);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      console.error('GPS error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!storeName.trim() || !address.trim()) {
      Alert.alert('Perhatian', 'Nama Toko dan Alamat wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        store_name: storeName.trim(),
        address: address.trim(),
        status: 'PENDING',
        credit_limit: 0,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
      };

      if (regionId) payload.region_id = regionId;
      if (salesId) payload.sales_id = salesId;

      const { error } = await supabase.from('dealers').insert(payload);

      if (error) throw error;

      Alert.alert('Berhasil', 'Toko baru berhasil didaftarkan ke daftar toko binaan Anda!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Mendaftarkan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftarkan Toko Baru</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBanner}>
          <Feather name="info" size={20} color="#0284c7" />
          <Text style={styles.infoBannerText}>
            Daftarkan toko prospek baru langsung di lapangan. Toko ini akan otomatis terhubung dengan akun Sales Anda.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Toko / Outlet *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Toko Berkah Abadi"
            value={storeName}
            onChangeText={setStoreName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Pemilik / PIC</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Bpk. Hendra"
            value={ownerName}
            onChangeText={setOwnerName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nomor Kontak / WhatsApp</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 081234567890"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Wilayah Toko *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {regions.map((reg) => (
              <TouchableOpacity
                key={reg.id}
                style={[styles.chip, regionId === reg.id && styles.chipActive]}
                onPress={() => setRegionId(reg.id)}
              >
                <Text style={[styles.chipText, regionId === reg.id && styles.chipTextActive]}>
                  {reg.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Alamat Lengkap Toko *</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Jl. Gajah Mada No. 12, RT/RW, Patokan..."
            multiline
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* GPS Geotag */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Koordinat Lokasi Toko (GPS)</Text>
          <View style={styles.locationBox}>
            <Feather name="map-pin" size={18} color="#16a34a" />
            <Text style={styles.locationText}>
              {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Mencari titik koordinat...'}
            </Text>
          </View>
          <TouchableOpacity style={styles.locRefresh} onPress={getCurrentLocation}>
            <Feather name="refresh-cw" size={14} color="#8ec44a" />
            <Text style={styles.locRefreshText}>Perbarui Koordinat GPS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Simpan Toko Binaan</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: '#0369a1', lineHeight: 18 },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  chipScroll: { flexDirection: 'row', marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#8ec44a', borderColor: '#8ec44a' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  locationText: { fontSize: 14, color: '#15803d', fontWeight: '500' },
  locRefresh: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  locRefreshText: { fontSize: 12, color: '#8ec44a', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#8ec44a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
