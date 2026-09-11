import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MapPicker from '../components/MapPicker';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [roleType, setRoleType] = useState<'dealer' | 'sales'>('dealer');
  
  // Dealer States
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Form, 2 = OTP
  const [otp, setOtp] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'perusahaan'>('personal');
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ktpImage, setKtpImage] = useState<string | null>(null);
  const [ktpBase64, setKtpBase64] = useState<string | null>(null);
  const [npwpImage, setNpwpImage] = useState<string | null>(null);
  const [npwpBase64, setNpwpBase64] = useState<string | null>(null);
  const [salesList, setSalesList] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [selectedSalesId, setSelectedSalesId] = useState<string>('');
  const [salesModalVisible, setSalesModalVisible] = useState(false);

  useEffect(() => {
    fetchSalesList();
  }, []);

  const fetchSalesList = async () => {
    try {
      const { data: sData, error: sErr } = await supabase
        .from('sales')
        .select('id, profile_id, status, profiles(id, full_name, phone_number)')
        .eq('status', 'ACTIVE');

      if (!sErr && sData && sData.length > 0) {
        setSalesList(sData.map((s: any) => ({
          id: s.id,
          name: s.profiles?.full_name || 'Sales Staff',
          phone: s.profiles?.phone_number
        })));
        return;
      }

      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('role', 'SALES');

      if (pData && pData.length > 0) {
        setSalesList(pData.map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Sales Staff',
          phone: p.phone_number
        })));
        return;
      }

      setSalesList([
        { id: '4b8741ba-852f-4676-81c0-9269dcbee607', name: 'Demo Sales', phone: '081234567890' },
        { id: 'ef8f5bc9-f6d6-409b-b74d-31d641ff9636', name: 'Demo Sales Baru', phone: '088899997777' },
      ]);
    } catch (err) {
      console.log('Error fetching sales list:', err);
    }
  };

  // Sales States
  const [salesName, setSalesName] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesKtp, setSalesKtp] = useState('');
  const [salesPassword, setSalesPassword] = useState('');

  const pickImage = async (type: 'KTP' | 'NPWP') => {
    try {
      let result;
      if (Platform.OS === 'web') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin kamera untuk mengambil foto dokumen.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'KTP') {
          setKtpImage(result.assets[0].uri);
          setKtpBase64(result.assets[0].base64 || null);
        } else {
          setNpwpImage(result.assets[0].uri);
          setNpwpBase64(result.assets[0].base64 || null);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Gagal mengambil gambar.');
    }
  };

  const normalizePhone = (p: string) => {
    let digits = p.replace(/\\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits;
  };

  const handleAutoLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin lokasi untuk deteksi otomatis.');
          return;
        }
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      
      const [addressDetails] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      if (addressDetails) {
        const fullAddress = [addressDetails.street, addressDetails.city, addressDetails.subregion, addressDetails.region].filter(Boolean).join(', ');
        if (fullAddress) setAddress(fullAddress);
      }
      
      if (Platform.OS !== 'web') Alert.alert('Berhasil', 'Lokasi berhasil dideteksi.');
      else window.alert('Lokasi berhasil dideteksi.');
    } catch (error) {
      console.log('Location error:', error);
      if (Platform.OS !== 'web') Alert.alert('Gagal', 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
      else window.alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
    }
  };

  const handleSendOtpDealer = async () => {
    if (!storeName || !ownerName || !email || !phone || !location || !ktpBase64 || (accountType === 'perusahaan' && !npwpBase64)) {
      const msg = 'Harap isi semua kolom (Toko, Nama, Email, HP), lokasi peta, serta foto dokumen yang diwajibkan.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      
      const { data: profileCheck, error: checkError } = await supabase
        .rpc('check_user_role', { p_phone: normalizedPhone });

      if (checkError) {
        throw new Error('Gagal mengecek nomor: ' + checkError.message);
      }

      if (profileCheck) {
        const msg = 'Nomor ini sudah memiliki akun. Silakan login.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Nomor Sudah Terdaftar', msg, [{ text: 'Login Sekarang', onPress: () => router.push('/login') }]);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Gagal mengirim OTP');
      }

      setStep(2);
      if (Platform.OS === 'web') window.alert(`Kode OTP telah dikirim ke nomor WhatsApp ${phone}.`);
      else Alert.alert('OTP Terkirim', `Kode OTP telah dikirim ke nomor WhatsApp ${phone}.`);
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert(err.message);
      else Alert.alert('Pengiriman Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegisterDealer = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Silakan masukkan 6 digit kode OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp },
      });

      if (authError || !authData?.success) {
        throw new Error(authData?.error || authError?.message || 'OTP tidak valid');
      }

      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Gagal mengautentikasi user. Silakan coba lagi.");

      await supabase.auth.updateUser({
        data: { full_name: ownerName, store_name: storeName }
      });

      const ktpFilePath = `${user.id}/ktp_${Date.now()}.jpg`;
      const cleanKtpBase64 = ktpBase64!.replace(/^data:image\/\w+;base64,/, "");
      const { error: ktpError } = await supabase.storage
        .from('dealer_documents')
        .upload(ktpFilePath, decode(cleanKtpBase64), { contentType: 'image/jpeg', upsert: true });
      if (ktpError) throw ktpError;
      const ktpUrl = supabase.storage.from('dealer_documents').getPublicUrl(ktpFilePath).data.publicUrl;

      let npwpUrl = null;
      if (npwpBase64) {
        const npwpFilePath = `${user.id}/npwp_${Date.now()}.jpg`;
        const cleanNpwpBase64 = npwpBase64.replace(/^data:image\/\w+;base64,/, "");
        const { error: npwpError } = await supabase.storage
          .from('dealer_documents')
          .upload(npwpFilePath, decode(cleanNpwpBase64), { contentType: 'image/jpeg', upsert: true });
        if (npwpError) throw npwpError;
        npwpUrl = supabase.storage.from('dealer_documents').getPublicUrl(npwpFilePath).data.publicUrl;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: ownerName,
        phone_number: phone,
        company_name: storeName,
        address: address || 'Alamat dari peta',
        lat: location!.lat,
        lng: location!.lng,
        approval_status: 'PENDING',
        ktp_url: ktpUrl,
        npwp_url: npwpUrl,
        role: 'DEALER'
      });
      if (error) throw error;

      let finalSalesId = selectedSalesId || null;
      if (finalSalesId) {
        const { data: sMatch } = await supabase
          .from('sales')
          .select('id')
          .or(`id.eq.${finalSalesId},profile_id.eq.${finalSalesId}`)
          .maybeSingle();
        if (sMatch) {
          finalSalesId = sMatch.id;
        }
      }

      await supabase.from('dealers').upsert({
        profile_id: user.id,
        store_name: storeName,
        address: address || 'Alamat dari peta',
        latitude: location!.lat,
        longitude: location!.lng,
        credit_limit: 0,
        status: 'PENDING',
        sales_id: finalSalesId,
      }, { onConflict: 'profile_id' });

      await supabase.auth.signOut();
      
      const successMsg = 'Pendaftaran Berhasil! 🎉\\n\\nProfil Anda telah disimpan. Mohon tunggu, Admin akan segera melakukan verifikasi.';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.replace('/login');
      } else {
        Alert.alert('Pendaftaran Berhasil! 🎉', successMsg, [{ text: 'OK', onPress: () => router.replace('/login') }]);
      }
    } catch (error: any) {
      Alert.alert('Gagal Daftar', error.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSales = async () => {
    if (!salesName || !salesPhone || !salesKtp || !salesPassword) {
      Alert.alert('Error', 'Harap isi semua kolom pendaftaran Sales.');
      return;
    }
    
    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(salesPhone);
      
      // Check if phone exists
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (profileCheck) {
        throw new Error('Nomor ini sudah terdaftar.');
      }

      // Create user using dummy email approach for "No OTP" phone login
      const dummyEmail = `${normalizedPhone}@sales.b2b.app`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: salesPassword,
        options: {
          data: {
            role: 'SALES',
            full_name: salesName,
            phone_number: normalizedPhone,
            ktp_number: salesKtp
          }
        }
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Gagal membuat akun.");

      // Upload KTP if any (optional for Sales for now)

      await supabase.auth.signOut();

      
      Alert.alert('Berhasil', 'Pendaftaran Sales berhasil. Menunggu persetujuan Admin.', [
        { text: 'Login', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Daftar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Daftar Akun Baru</Text>
      <Text style={styles.subtitle}>Bergabung dengan B2B App</Text>

      <View style={styles.formContainer}>
        
        {/* Role Toggle */}
        <View style={styles.accountTypeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, roleType === 'dealer' && styles.typeButtonActive]}
            onPress={() => { setRoleType('dealer'); setStep(1); }}
          >
            <Text style={[styles.typeButtonText, roleType === 'dealer' && styles.typeButtonTextActive]}>Dealer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, roleType === 'sales' && styles.typeButtonActive]}
            onPress={() => { setRoleType('sales'); setStep(1); }}
          >
            <Text style={[styles.typeButtonText, roleType === 'sales' && styles.typeButtonTextActive]}>Sales</Text>
          </TouchableOpacity>
        </View>

        {roleType === 'dealer' ? (
          // DEALER FORM
          step === 1 ? (
            <>
              <View style={styles.accountTypeContainer}>
                <TouchableOpacity 
                  style={[styles.typeButton, accountType === 'personal' && styles.typeButtonActive]}
                  onPress={() => setAccountType('personal')}
                >
                  <Text style={[styles.typeButtonText, accountType === 'personal' && styles.typeButtonTextActive]}>Personal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, accountType === 'perusahaan' && styles.typeButtonActive]}
                  onPress={() => setAccountType('perusahaan')}
                >
                  <Text style={[styles.typeButtonText, accountType === 'perusahaan' && styles.typeButtonTextActive]}>Perusahaan</Text>
                </TouchableOpacity>
              </View>

              <TextInput style={styles.input} placeholder="Nama Toko (Sesuai KTP/SIUP)" value={storeName} onChangeText={setStoreName} />
              <TextInput style={styles.input} placeholder="Nama Lengkap Pemilik" value={ownerName} onChangeText={setOwnerName} />
              <TextInput style={styles.input} placeholder="Email Aktif" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Nomor Handphone (WhatsApp)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <TextInput style={styles.input} placeholder="Alamat Lengkap Toko" value={address} onChangeText={setAddress} />

              <View style={styles.locationContainer}>
                <Text style={styles.locationLabel}>Lokasi Toko (Peta)</Text>
                <TouchableOpacity style={styles.mapButton} onPress={() => setIsMapVisible(true)}>
                  <Text style={styles.mapButtonText}>
                    {location ? `✓ Lokasi Terpilih (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : '📍 Tandai Lokasi di Peta (Wajib)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.autoLocationButton} onPress={handleAutoLocation}>
                  <Feather name="navigation" size={16} color="white" />
                  <Text style={styles.autoLocationButtonText}>Deteksi Lokasi Otomatis</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.locationContainer}>
                <Text style={styles.locationLabel}>Foto KTP Pemilik</Text>
                <TouchableOpacity style={styles.mapButton} onPress={() => pickImage('KTP')}>
                  {ktpImage ? <Image source={{ uri: ktpImage }} style={styles.previewImage} /> : (
                    <View style={styles.uploadPlaceholder}>
                      <Feather name="camera" size={24} color="#8ec44a" />
                      <Text style={styles.uploadText}>Ambil Foto KTP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {accountType === 'perusahaan' && (
                <View style={styles.locationContainer}>
                  <Text style={styles.locationLabel}>Foto NPWP (Wajib untuk Perusahaan)</Text>
                  <TouchableOpacity style={styles.mapButton} onPress={() => pickImage('NPWP')}>
                    {npwpImage ? <Image source={{ uri: npwpImage }} style={styles.previewImage} /> : (
                      <View style={styles.uploadPlaceholder}>
                        <Feather name="camera" size={24} color="#8ec44a" />
                        <Text style={styles.uploadText}>Ambil Foto NPWP</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Didaftarkan Oleh Sales (Toko Binaan) */}
              <View style={styles.salesReferralCard}>
                <View style={styles.salesReferralHeader}>
                  <Feather name="user-check" size={18} color="#4a6b22" />
                  <Text style={styles.salesReferralTitle}>Didaftarkan oleh Sales</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>Opsional</Text>
                  </View>
                </View>
                <Text style={styles.salesReferralDesc}>
                  Pilih nama akun sales yang merekomendasikan toko Anda agar terhubung resmi sebagai toko binaan:
                </Text>

                {Platform.OS === 'web' ? (
                  <select
                    value={selectedSalesId}
                    onChange={(e) => setSelectedSalesId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #dcf0c3',
                      backgroundColor: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: selectedSalesId ? '#1e293b' : '#64748b',
                      outline: 'none',
                      marginTop: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Pendaftaran Mandiri (Tanpa Sales) --</option>
                    {salesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TouchableOpacity
                    style={styles.nativeSalesPickerBtn}
                    onPress={() => setSalesModalVisible(true)}
                  >
                    <Text style={[styles.nativeSalesPickerText, !selectedSalesId && { color: '#94a3b8' }]}>
                      {selectedSalesId
                        ? salesList.find((s) => s.id === selectedSalesId)?.name || 'Sales Terpilih'
                        : '-- Pilih Nama Akun Sales --'}
                    </Text>
                    <Feather name="chevron-down" size={18} color="#4a6b22" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleSendOtpDealer} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Lanjut Verifikasi OTP</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.otpContainer}>
              <Text style={styles.infoText}>Kode OTP telah dikirim ke WhatsApp: {phone}</Text>
              <TextInput style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 4 }]} placeholder="000000" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
              <TouchableOpacity style={styles.button} onPress={handleVerifyAndRegisterDealer} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Selesaikan Pendaftaran</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} disabled={loading}>
                <Text style={styles.backButtonText}>Kembali Edit Data</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // SALES FORM
          <>
            <TextInput style={styles.input} placeholder="Nama Lengkap" value={salesName} onChangeText={setSalesName} />
            <TextInput style={styles.input} placeholder="Nomor Handphone (Aktif)" keyboardType="phone-pad" value={salesPhone} onChangeText={setSalesPhone} />
            <TextInput style={styles.input} placeholder="Nomor KTP (NIK)" keyboardType="number-pad" value={salesKtp} onChangeText={setSalesKtp} />
            <TextInput style={styles.input} placeholder="Buat Password" secureTextEntry value={salesPassword} onChangeText={setSalesPassword} />
            
            <TouchableOpacity style={styles.button} onPress={handleRegisterSales} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Daftar Sebagai Sales</Text>}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Sudah punya akun? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Login di sini</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>

      <MapPicker visible={isMapVisible} onClose={() => setIsMapVisible(false)} onSelectLocation={(lat, lng) => { setLocation({lat, lng}); setIsMapVisible(false); }} />

      {/* Native Sales Picker Modal */}
      <Modal visible={salesModalVisible} transparent animationType="slide">
        <View style={styles.salesModalOverlay}>
          <View style={styles.salesModalContent}>
            <View style={styles.salesModalHeader}>
              <Text style={styles.salesModalTitle}>Pilih Nama Akun Sales</Text>
              <TouchableOpacity onPress={() => setSalesModalVisible(false)} style={styles.salesModalCloseBtn}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              <TouchableOpacity
                style={[styles.salesItem, !selectedSalesId && styles.salesItemActive]}
                onPress={() => { setSelectedSalesId(''); setSalesModalVisible(false); }}
              >
                <Text style={[styles.salesItemText, !selectedSalesId && styles.salesItemTextActive]}>
                  -- Pendaftaran Mandiri (Tanpa Sales) --
                </Text>
                {!selectedSalesId && <Feather name="check" size={18} color="#4a6b22" />}
              </TouchableOpacity>

              {salesList.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.salesItem, selectedSalesId === s.id && styles.salesItemActive]}
                  onPress={() => { setSelectedSalesId(s.id); setSalesModalVisible(false); }}
                >
                  <View>
                    <Text style={[styles.salesItemText, selectedSalesId === s.id && styles.salesItemTextActive]}>
                      {s.name}
                    </Text>
                    {s.phone ? <Text style={styles.salesItemPhone}>{s.phone}</Text> : null}
                  </View>
                  {selectedSalesId === s.id && <Feather name="check" size={18} color="#4a6b22" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingVertical: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4a6b22', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 40, textAlign: 'center' },
  formContainer: { width: '100%', gap: 16 },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#dcf0c3', fontSize: 16 },
  button: { backgroundColor: '#8ec44a', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { color: '#64748b', fontSize: 14 },
  loginLink: { color: '#8ec44a', fontSize: 14, fontWeight: 'bold' },
  locationContainer: { marginTop: 8, marginBottom: 8 },
  locationLabel: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  mapButton: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#dcf0c3', borderStyle: 'dashed', alignItems: 'center' },
  mapButtonText: { color: '#8ec44a', fontWeight: 'bold', fontSize: 14 },
  previewImage: { width: '100%', height: 150, borderRadius: 8 },
  uploadPlaceholder: { alignItems: 'center', paddingVertical: 12 },
  uploadText: { marginTop: 8, color: '#8ec44a', fontWeight: '600' },
  otpContainer: { width: '100%', paddingVertical: 16, gap: 16 },
  infoText: { color: '#4a6b22', textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  backButton: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#64748b', fontSize: 14, fontWeight: 'bold' },
  accountTypeContainer: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#dcf0c3', overflow: 'hidden', marginBottom: 8 },
  typeButton: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: 'transparent' },
  typeButtonActive: { backgroundColor: '#8ec44a' },
  typeButtonText: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
  typeButtonTextActive: { color: 'white' },
  autoLocationButton: { flexDirection: 'row', backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 8 },
  autoLocationButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  // Sales Referral Card Styles
  salesReferralCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dcf0c3',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  salesReferralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  salesReferralTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  optionalBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  salesReferralDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 6,
  },
  nativeSalesPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  nativeSalesPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  salesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  salesModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  salesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  salesModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  salesModalCloseBtn: {
    padding: 6,
  },
  salesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    borderRadius: 8,
  },
  salesItemActive: {
    backgroundColor: '#f0fdf4',
  },
  salesItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  salesItemTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  salesItemPhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
