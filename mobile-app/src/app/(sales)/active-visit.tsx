import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Platform, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';

export default function ActiveVisit() {
  const { visitId, dealerId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visitData, setVisitData] = useState<any>(null);
  const [dealerData, setDealerData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [unitPercentage, setUnitPercentage] = useState('80');
  const [ownerMet, setOwnerMet] = useState(true);
  const [notes, setNotes] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [display1Uri, setDisplay1Uri] = useState<string | null>(null);
  const [display1Base64, setDisplay1Base64] = useState<string | null>(null);
  const [display2Uri, setDisplay2Uri] = useState<string | null>(null);
  const [display2Base64, setDisplay2Base64] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Timer State
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    fetchData();
  }, [visitId]);

  useEffect(() => {
    let interval: any;
    if (visitData?.check_in_time) {
      const calculateTime = () => {
        const checkIn = new Date(visitData.check_in_time).getTime();
        const now = new Date().getTime();
        const diffMins = Math.floor((now - checkIn) / (1000 * 60));
        setElapsedMinutes(Math.max(0, diffMins));
      };

      calculateTime();
      interval = setInterval(calculateTime, 10000);
    }
    return () => clearInterval(interval);
  }, [visitData]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      // Fetch Visit
      const { data: vData, error: vError } = await supabase
        .from('sales_visits')
        .select('*')
        .eq('id', visitId)
        .single();

      if (vError) throw vError;
      setVisitData(vData);

      // Fetch Dealer
      const { data: dData, error: dError } = await supabase
        .from('dealers')
        .select('store_name, address')
        .eq('id', dealerId)
        .single();

      if (dError) throw dError;
      setDealerData(dData);

      getLocation();
    } catch (error) {
      console.error('Error fetching visit data:', error);
      Alert.alert('Error', 'Gagal memuat data visit.');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const pickPhoto = async (type: 'selfie' | 'display1' | 'display2') => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Kamera Ditolak', 'Dibutuhkan izin kamera untuk mengambil foto di toko.');
          return;
        }
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: true,
      });

      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        // Fallback to library
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (type === 'selfie') {
          setSelfieUri(asset.uri);
          setSelfieBase64(asset.base64 || null);
        } else if (type === 'display1') {
          setDisplay1Uri(asset.uri);
          setDisplay1Base64(asset.base64 || null);
        } else if (type === 'display2') {
          setDisplay2Uri(asset.uri);
          setDisplay2Base64(asset.base64 || null);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const uploadPhoto = async (base64: string | null, prefix: string) => {
    if (!base64 || !userId) return null;
    try {
      const filePath = `sales/${userId}/${prefix}_${visitId}_${Date.now()}.jpg`;
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const { error: uploadError } = await supabase.storage
        .from('dealer_documents')
        .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

      if (!uploadError) {
        return supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
      }
    } catch (e) {
      console.warn('Upload error:', e);
    }
    return null;
  };

  const handleCheckOut = async () => {
    if (elapsedMinutes < 30) {
      Alert.alert(
        'Belum Memenuhi Durasi Minimal',
        `Kunjungan toko wajib berlangsung minimal 30 menit. Saat ini baru berjalan ${elapsedMinutes} menit. Harap selesaikan inspeksi atau tunggu hingga 30 menit.`
      );
      return;
    }

    if (!unitPercentage) {
      Alert.alert('Perhatian', 'Harap isi perkiraan Ketersediaan Unit Produk (%).');
      return;
    }

    setSubmitting(true);
    try {
      if (visitData.id && String(visitData.id).startsWith('dummy-')) {
        Alert.alert('Kunjungan Selesai!', 'Data demo berhasil diperbarui.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setSubmitting(false);
        return;
      }

      // Upload photos
      const [photoUrl, display1Url, display2Url] = await Promise.all([
        uploadPhoto(selfieBase64, 'selfie'),
        uploadPhoto(display1Base64, 'display1'),
        uploadPhoto(display2Base64, 'display2'),
      ]);

      // Update Visit Record
      const rewardPerVisit = 133333; // 4 juta / 30 hari

      const { error: updateError } = await supabase
        .from('sales_visits')
        .update({
          check_out_time: new Date().toISOString(),
          unit_percentage: parseInt(unitPercentage) || 0,
          owner_met: ownerMet,
          notes: notes.trim(),
          selfie_url: photoUrl || selfieUri,
          display_image_1_url: display1Url || display1Uri,
          display_image_2_url: display2Url || display2Uri,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          status: 'COMPLETED',
          earned_amount: rewardPerVisit,
        })
        .eq('id', visitId);

      if (updateError) throw updateError;

      // Increment Sales Balance
      const { data: sRec } = await supabase
        .from('sales')
        .select('balance')
        .eq('id', visitData.sales_id)
        .single();

      if (sRec) {
        await supabase
          .from('sales')
          .update({ balance: (Number(sRec.balance) || 0) + rewardPerVisit })
          .eq('id', visitData.sales_id);
      }

      Alert.alert('Kunjungan Berhasil Diselesaikan!', 'Reward kunjungan telah ditambahkan ke saldo akun Anda.', [
        { text: 'Selesai', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Check-out', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8ec44a" />
      </View>
    );
  }

  const isReady = elapsedMinutes >= 30;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sesi Kunjungan Toko</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.storeName}>{dealerData?.store_name}</Text>
          <Text style={styles.address}>{dealerData?.address}</Text>

          <View style={[styles.timerRow, isReady && styles.timerRowReady]}>
            <Feather name="clock" size={20} color={isReady ? '#16a34a' : '#d97706'} />
            <Text style={[styles.timerText, { color: isReady ? '#16a34a' : '#d97706' }]}>
              {elapsedMinutes} Menit Berjalan
            </Text>
            {isReady && <Text style={styles.readyBadge}>✓ Siap Check-out</Text>}
          </View>
          <Text style={styles.timerSub}>
            {isReady
              ? 'Syarat durasi minimal 30 menit telah terpenuhi.'
              : `Kurang ${30 - elapsedMinutes} menit lagi untuk dapat menyelesaikan kunjungan.`}
          </Text>
        </View>

        {/* Quick View Toko Orders button */}
        <TouchableOpacity
          style={styles.canvassingBtn}
          onPress={() => router.push({ pathname: '/(sales)/create-order', params: { dealerId } })}
        >
          <Feather name="file-text" size={20} color="#16a34a" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.canvassingTitle}>Riwayat Pesanan Toko Ini</Text>
            <Text style={styles.canvassingSub}>Lihat transaksi dan status pesanan toko binaan</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#16a34a" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Laporan Hasil Kunjungan</Text>

        {/* 1. Selfie Photo */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>1. Foto Selfie di Toko *</Text>
          <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto('selfie')}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.photoImg} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="camera" size={32} color="#8ec44a" />
                <Text style={styles.photoText}>Ambil Foto Selfie di Toko</Text>
                <Text style={styles.photoSub}>Pastikan wajah dan lingkungan toko terlihat</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Dua Foto Display */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>2. Dua (2) Foto Display Produk di Toko *</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Display 1 */}
            <TouchableOpacity style={styles.displayCardBox} onPress={() => pickPhoto('display1')}>
              {display1Uri ? (
                <Image source={{ uri: display1Uri }} style={styles.displayImg} contentFit="cover" />
              ) : (
                <View style={styles.smallPhotoPlaceholder}>
                  <Feather name="image" size={24} color="#64748b" />
                  <Text style={styles.smallPhotoText}>Foto Display 1</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Display 2 */}
            <TouchableOpacity style={styles.displayCardBox} onPress={() => pickPhoto('display2')}>
              {display2Uri ? (
                <Image source={{ uri: display2Uri }} style={styles.displayImg} contentFit="cover" />
              ) : (
                <View style={styles.smallPhotoPlaceholder}>
                  <Feather name="image" size={24} color="#64748b" />
                  <Text style={styles.smallPhotoText}>Foto Display 2</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Unit Availability with Caption */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>3. Ketersediaan Display & Unit Produk (%) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 85"
            keyboardType="number-pad"
            maxLength={3}
            value={unitPercentage}
            onChangeText={setUnitPercentage}
          />
          {/* Tertulis di bawah berapa persen jumlah produk */}
          <View style={styles.displayBadgeRow}>
            <Feather name="check-circle" size={14} color="#16a34a" />
            <Text style={styles.displayBadgeText}>
              Tertulis di bawah Display: Ketersediaan Produk Toko <Text style={{ fontWeight: 'bold' }}>{unitPercentage || 0}%</Text>
            </Text>
          </View>
        </View>

        {/* 4. Owner Met Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>4. Bertemu dengan Pemilik / PIC Toko?</Text>
            <Text style={styles.switchSub}>{ownerMet ? 'Ya, bertemu langsung' : 'Tidak, hanya dengan staf / penjaga'}</Text>
          </View>
          <Switch
            value={ownerMet}
            onValueChange={setOwnerMet}
            trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
            thumbColor={ownerMet ? '#8ec44a' : '#f1f5f9'}
          />
        </View>

        {/* 5. Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>5. Catatan / Rangkuman Pertemuan</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Kebutuhan stok baru, respon owner, kendala..."
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* 6. GPS */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>6. Lokasi GPS Geotag</Text>
          <View style={styles.locationBox}>
            <Feather name="map-pin" size={18} color="#2563eb" />
            <Text style={styles.locationText}>
              {location
                ? `Terekam: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : 'Mencari sinyal GPS...'}
            </Text>
          </View>
        </View>

        {/* Submit Checkout */}
        <TouchableOpacity
          style={[styles.checkoutBtn, (!isReady || submitting) && styles.checkoutBtnDisabled]}
          onPress={handleCheckOut}
          disabled={!isReady || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.checkoutText}>
              {isReady ? 'Selesaikan Kunjungan (Check-out)' : `Menunggu Durasi 30 Menit (${elapsedMinutes}/30 m)`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 56,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  infoCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  address: { fontSize: 13, color: '#64748b', marginBottom: 14 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  timerRowReady: { backgroundColor: '#f0fdf4' },
  timerText: { fontSize: 15, fontWeight: 'bold' },
  readyBadge: { fontSize: 11, fontWeight: 'bold', color: '#15803d', marginLeft: 4 },
  timerSub: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  canvassingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  canvassingTitle: { fontSize: 14, fontWeight: 'bold', color: '#15803d' },
  canvassingSub: { fontSize: 11, color: '#166534', marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 14 },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 18,
  },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  photoBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 140,
  },
  photoPlaceholder: { alignItems: 'center', padding: 24 },
  photoText: { color: '#8ec44a', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  photoSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  photoImg: { width: '100%', height: 220 },
  displayCardBox: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayImg: { width: '100%', height: 120 },
  smallPhotoPlaceholder: { alignItems: 'center', padding: 16, gap: 4 },
  smallPhotoText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  displayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  displayBadgeText: { fontSize: 12, color: '#15803d' },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  locationText: { color: '#1d4ed8', fontSize: 13, fontWeight: '500' },
  checkoutBtn: {
    backgroundColor: '#8ec44a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnDisabled: { backgroundColor: '#cbd5e1' },
  checkoutText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
