import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useSafeBottom } from '../../hooks/useSafeBottom';

export default function ProfileEditScreen() {
  const bottomPadding = useSafeBottom();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data Toko & Profil
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');
  const [address, setAddress] = useState('');
  
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Dokumen Legalitas (Existing URLs & New Picked Images)
  const [ktpUrl, setKtpUrl] = useState<string | null>(null);
  const [ktpNewUri, setKtpNewUri] = useState<string | null>(null);
  const [ktpNewBase64, setKtpNewBase64] = useState<string | null>(null);

  const [npwpUrl, setNpwpUrl] = useState<string | null>(null);
  const [npwpNewUri, setNpwpNewUri] = useState<string | null>(null);
  const [npwpNewBase64, setNpwpNewBase64] = useState<string | null>(null);

  const [storePhotoUrl, setStorePhotoUrl] = useState<string | null>(null);
  const [storePhotoNewUri, setStorePhotoNewUri] = useState<string | null>(null);
  const [storePhotoNewBase64, setStorePhotoNewBase64] = useState<string | null>(null);

  // Kata Sandi (Password)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error('Not authenticated');

      const userId = sessionData.session.user.id;
      setProfileId(userId);

      const authEmail = sessionData.session.user.email || '';
      setCurrentAuthEmail(authEmail);
      // Jangan tampilkan email dummy internal (b2b-app.local / sales.b2b.app) sebagai email asli
      if (authEmail && !authEmail.endsWith('@b2b-app.local') && !authEmail.endsWith('@sales.b2b.app')) {
        setEmail(authEmail);
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setKtpUrl(profile.ktp_url || null);
      setNpwpUrl(profile.npwp_url || null);
      setStorePhotoUrl(profile.store_photo_url || null);

      // Fetch dealer
      const { data: dealer, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('profile_id', userId)
        .single();
        
      if (dealerError && dealerError.code !== 'PGRST116') throw dealerError;
      
      if (dealer) {
        setDealerId(dealer.id);
        setStoreName(dealer.store_name || '');
        setAddress(dealer.address || '');
      }
      
    } catch (e: any) {
      console.warn("Error fetching profile:", e);
      Alert.alert("Error", "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handlePickSource = (type: 'KTP' | 'NPWP' | 'Store') => {
    const title = type === 'KTP' ? 'Foto KTP' : type === 'NPWP' ? 'Foto NPWP' : 'Foto Toko';
    Alert.alert(
      `Pilih Sumber ${title}`,
      'Ambil foto baru menggunakan kamera atau pilih dari galeri perangkat:',
      [
        { text: '📷 Buka Kamera', onPress: () => pickImage(type, 'camera') },
        { text: '🖼️ Pilih dari Galeri', onPress: () => pickImage(type, 'gallery') },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (type: 'KTP' | 'NPWP' | 'Store', source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin kamera untuk mengambil foto dokumen.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.3,
          base64: false,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin galeri untuk memilih foto.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.3,
          base64: false,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let uri = result.assets[0].uri;

        // Kompresi dan resize agar hemat kuota dan upload cepat
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (type === 'KTP') {
          setKtpNewUri(manipResult.uri);
          setKtpNewBase64(manipResult.base64 || null);
        } else if (type === 'NPWP') {
          setNpwpNewUri(manipResult.uri);
          setNpwpNewBase64(manipResult.base64 || null);
        } else if (type === 'Store') {
          setStorePhotoNewUri(manipResult.uri);
          setStorePhotoNewBase64(manipResult.base64 || null);
        }
      }
    } catch (error: any) {
      console.warn('Error picking image:', error);
      Alert.alert('Error', 'Gagal memproses gambar: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!storeName.trim() || !fullName.trim() || !phoneNumber.trim() || !address.trim()) {
      Alert.alert("Data Tidak Lengkap", "Nama toko, nama pemilik, nomor HP, dan alamat lengkap wajib diisi.");
      return;
    }

    // Validasi Password jika diisi
    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        Alert.alert("Kata Sandi Kurang Panjang", "Kata sandi minimal 6 karakter.");
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        Alert.alert("Kata Sandi Tidak Cocok", "Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
        return;
      }
    }

    // Validasi Email jika diisi
    if (email.trim() && !email.trim().includes('@')) {
      Alert.alert("Format Email Salah", "Harap masukkan format alamat email yang benar (contoh: toko@gmail.com).");
      return;
    }

    setSaving(true);
    try {
      const userId = profileId;
      if (!userId) throw new Error("Sesi login Anda tidak valid.");

      let uploadedKtpUrl = ktpUrl;
      let uploadedNpwpUrl = npwpUrl;
      let uploadedStorePhotoUrl = storePhotoUrl;

      // 1. Upload KTP jika ada foto baru
      if (ktpNewBase64) {
        const ktpFilePath = `${userId}/ktp_${Date.now()}.jpg`;
        const cleanKtp = ktpNewBase64.replace(/^data:image\/\w+;base64,/, "");
        const { error: ktpErr } = await supabase.storage
          .from('dealer_documents')
          .upload(ktpFilePath, decode(cleanKtp), { contentType: 'image/jpeg', upsert: true });
        if (ktpErr) throw ktpErr;
        uploadedKtpUrl = supabase.storage.from('dealer_documents').getPublicUrl(ktpFilePath).data.publicUrl;
      }

      // 2. Upload NPWP jika ada foto baru
      if (npwpNewBase64) {
        const npwpFilePath = `${userId}/npwp_${Date.now()}.jpg`;
        const cleanNpwp = npwpNewBase64.replace(/^data:image\/\w+;base64,/, "");
        const { error: npwpErr } = await supabase.storage
          .from('dealer_documents')
          .upload(npwpFilePath, decode(cleanNpwp), { contentType: 'image/jpeg', upsert: true });
        if (npwpErr) throw npwpErr;
        uploadedNpwpUrl = supabase.storage.from('dealer_documents').getPublicUrl(npwpFilePath).data.publicUrl;
      }

      // 3. Upload Foto Toko jika ada foto baru
      if (storePhotoNewBase64) {
        const storeFilePath = `${userId}/store_${Date.now()}.jpg`;
        const cleanStore = storePhotoNewBase64.replace(/^data:image\/\w+;base64,/, "");
        const { error: storeErr } = await supabase.storage
          .from('dealer_documents')
          .upload(storeFilePath, decode(cleanStore), { contentType: 'image/jpeg', upsert: true });
        if (storeErr) throw storeErr;
        uploadedStorePhotoUrl = supabase.storage.from('dealer_documents').getPublicUrl(storeFilePath).data.publicUrl;
      }

      // 4. Update Profile
      const profileUpdatePayload: any = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        company_name: storeName.trim(),
        address: address.trim(),
        ktp_url: uploadedKtpUrl,
        npwp_url: uploadedNpwpUrl,
        store_photo_url: uploadedStorePhotoUrl,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdatePayload)
        .eq('id', userId);
        
      if (profileError) throw profileError;

      // 5. Update Dealer
      if (dealerId) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .update({
            store_name: storeName.trim(),
            address: address.trim(),
          })
          .eq('id', dealerId);
          
        if (dealerError) throw dealerError;
      }

      // 6. Update Kredensial Akun (Password & Email Login)
      const authUpdatePayload: any = {};
      if (newPassword.trim()) {
        authUpdatePayload.password = newPassword.trim();
      }
      if (email.trim() && email.trim().toLowerCase() !== currentAuthEmail.toLowerCase()) {
        authUpdatePayload.email = email.trim().toLowerCase();
      }

      if (Object.keys(authUpdatePayload).length > 0) {
        const { error: authErr } = await supabase.auth.updateUser(authUpdatePayload);
        if (authErr) {
          console.warn("Auth update error:", authErr);
          // Berikan catatan jika gagal update auth
          Alert.alert("Catatan", `Profil tersimpan, namun pembaruan email/password mengalami kendala: ${authErr.message}`);
        }
      }
      
      Alert.alert(
        "Berhasil Disimpan! 🎉", 
        "Data profil, dokumen toko, dan pengaturan keamanan Anda telah berhasil diperbarui.", 
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      console.warn("Error updating profile:", e);
      Alert.alert("Gagal Menyimpan", "Terjadi kesalahan: " + (e.message || 'Silakan coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8ec44a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil & Akun</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPadding + 32 }}>
          
          {/* ======================================================== */}
          {/* CARD 1: DATA TOKO & PEMILIK                              */}
          {/* ======================================================== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#f0fdf4' }]}>
                <Feather name="home" size={18} color="#16a34a" />
              </View>
              <div>
                <Text style={styles.cardTitle}>Data Toko & Kontak</Text>
                <Text style={styles.cardSubtitle}>Informasi nama toko, PIC, dan alamat pengiriman</Text>
              </div>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Toko <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Masukkan nama toko"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Pemilik / PIC <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Masukkan nama pemilik"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor HP / WhatsApp <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Email (Opsional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="contoh: toko@gmail.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>Email ini dapat digunakan sebagai alternatif login ke aplikasi.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Lengkap <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Jalan, kelurahan, kecamatan, kota..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ======================================================== */}
          {/* CARD 2: DOKUMEN LEGALITAS & FOTO TOKO                     */}
          {/* ======================================================== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#fef3c7' }]}>
                <Feather name="file-text" size={18} color="#d97706" />
              </View>
              <div>
                <Text style={styles.cardTitle}>Dokumen & Foto Toko</Text>
                <Text style={styles.cardSubtitle}>Unggah ulang atau perbarui dokumen legalitas toko</Text>
              </div>
            </View>

            {/* Item 1: Foto KTP */}
            <View style={styles.docItem}>
              <View style={styles.docThumbnailContainer}>
                {ktpNewUri || ktpUrl ? (
                  <Image
                    source={{ uri: ktpNewUri || ktpUrl! }}
                    style={styles.docThumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.docPlaceholder}>
                    <Feather name="credit-card" size={24} color="#94a3b8" />
                  </View>
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Foto KTP Pemilik</Text>
                <View style={styles.docStatusBadge}>
                  {ktpNewUri ? (
                    <Text style={[styles.docStatusText, { color: '#0284c7' }]}>● Foto Baru Dipilih</Text>
                  ) : ktpUrl ? (
                    <Text style={[styles.docStatusText, { color: '#16a34a' }]}>● Sudah Diunggah</Text>
                  ) : (
                    <Text style={[styles.docStatusText, { color: '#e11d48' }]}>○ Belum Diunggah</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.docActionBtn}
                  onPress={() => handlePickSource('KTP')}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={13} color="#0f172a" />
                  <Text style={styles.docActionBtnText}>
                    {ktpNewUri || ktpUrl ? 'Ganti Foto KTP' : 'Unggah Foto KTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Item 2: Foto NPWP */}
            <View style={styles.docItem}>
              <View style={styles.docThumbnailContainer}>
                {npwpNewUri || npwpUrl ? (
                  <Image
                    source={{ uri: npwpNewUri || npwpUrl! }}
                    style={styles.docThumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.docPlaceholder}>
                    <Feather name="briefcase" size={24} color="#94a3b8" />
                  </View>
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Foto NPWP (Opsional)</Text>
                <View style={styles.docStatusBadge}>
                  {npwpNewUri ? (
                    <Text style={[styles.docStatusText, { color: '#0284c7' }]}>● Foto Baru Dipilih</Text>
                  ) : npwpUrl ? (
                    <Text style={[styles.docStatusText, { color: '#16a34a' }]}>● Sudah Diunggah</Text>
                  ) : (
                    <Text style={[styles.docStatusText, { color: '#64748b' }]}>○ Belum Ada (Opsional)</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.docActionBtn}
                  onPress={() => handlePickSource('NPWP')}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={13} color="#0f172a" />
                  <Text style={styles.docActionBtnText}>
                    {npwpNewUri || npwpUrl ? 'Ganti Foto NPWP' : 'Unggah Foto NPWP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Item 3: Foto Fisik Toko */}
            <View style={[styles.docItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.docThumbnailContainer}>
                {storePhotoNewUri || storePhotoUrl ? (
                  <Image
                    source={{ uri: storePhotoNewUri || storePhotoUrl! }}
                    style={styles.docThumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.docPlaceholder}>
                    <Feather name="image" size={24} color="#94a3b8" />
                  </View>
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Foto Depan Toko</Text>
                <View style={styles.docStatusBadge}>
                  {storePhotoNewUri ? (
                    <Text style={[styles.docStatusText, { color: '#0284c7' }]}>● Foto Baru Dipilih</Text>
                  ) : storePhotoUrl ? (
                    <Text style={[styles.docStatusText, { color: '#16a34a' }]}>● Sudah Diunggah</Text>
                  ) : (
                    <Text style={[styles.docStatusText, { color: '#64748b' }]}>○ Belum Ada (Opsional)</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.docActionBtn}
                  onPress={() => handlePickSource('Store')}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={13} color="#0f172a" />
                  <Text style={styles.docActionBtnText}>
                    {storePhotoNewUri || storePhotoUrl ? 'Ganti Foto Toko' : 'Unggah Foto Toko'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* CARD 3: KEAMANAN & KATA SANDI (PASSWORD)                 */}
          {/* ======================================================== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#eff6ff' }]}>
                <Feather name="lock" size={18} color="#2563eb" />
              </View>
              <div>
                <Text style={styles.cardTitle}>Kata Sandi (Password Login)</Text>
                <Text style={styles.cardSubtitle}>Login instan tanpa perlu menunggu kode OTP WhatsApp</Text>
              </div>
            </View>

            <View style={styles.passwordBanner}>
              <Feather name="info" size={15} color="#0369a1" style={{ marginTop: 1 }} />
              <Text style={styles.passwordBannerText}>
                Jika Anda membuat kata sandi di sini, Anda bisa login langsung menggunakan Nomor HP dan kata sandi tanpa perlu meminta kode OTP WhatsApp.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Buat / Ganti Kata Sandi</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ketik kata sandi baru (min 6 karakter)..."
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {newPassword.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Konfirmasi Kata Sandi Baru</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Ketik ulang kata sandi baru..."
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <Text style={styles.passwordMismatchText}>⚠️ Konfirmasi kata sandi belum sama</Text>
                )}
              </View>
            )}

            <Text style={styles.inputHint}>
              Biarkan kolom kata sandi kosong jika tidak ingin mengubah kata sandi saat ini.
            </Text>
          </View>
          
          {/* Tombol Simpan */}
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.saveBtnText}>Menyimpan Perubahan...</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>Simpan Perubahan Profil</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  cardHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 15,
  },
  textArea: {
    minHeight: 80,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  passwordMismatchText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  passwordBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  passwordBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 16,
    fontWeight: '500',
  },
  // Document styles
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docThumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docThumbnail: {
    width: '100%',
    height: '100%',
  },
  docPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  docStatusBadge: {
    marginBottom: 6,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  docActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  docActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#8ec44a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  }
});
