import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import MapPicker from '../components/MapPicker';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Form, 2 = OTP
  const [otp, setOtp] = useState('');

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); // Address can be filled if needed or use coordinates
  const [ktpImage, setKtpImage] = useState<string | null>(null);
  const [ktpBase64, setKtpBase64] = useState<string | null>(null);
  const [npwpImage, setNpwpImage] = useState<string | null>(null);
  const [npwpBase64, setNpwpBase64] = useState<string | null>(null);

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
    let digits = p.replace(/\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits;
  };

  const handleSendOtp = async () => {
    console.log('[Register] Memeriksa kelengkapan data...', {
      storeName: !!storeName,
      ownerName: !!ownerName,
      email: !!email,
      phone: !!phone,
      location: !!location,
      ktpBase64: !!ktpBase64,
      npwpBase64: !!npwpBase64
    });

    if (!storeName || !ownerName || !email || !phone || !location || !ktpBase64 || !npwpBase64) {
      const msg = 'Harap isi semua kolom (Toko, Nama, Email, HP), pilih lokasi peta, dan sertakan foto KTP serta NPWP.';
      console.warn(msg);
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      
      // Pengecekan: Apakah nomor ini sudah terdaftar di tabel profiles?
      const { data: profileCheck, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (checkError) {
        throw new Error('Gagal mengecek status akun: ' + checkError.message);
      }

      if (profileCheck) {
        const msg = 'Nomor ini sudah memiliki akun. Silakan login.';
        console.warn(msg);
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Nomor Sudah Terdaftar', msg, [{ text: 'Login Sekarang', onPress: () => router.push('/login') }]);
        return;
      }

      console.log('[Register] Mengirim OTP...');
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      console.log('[Register] Response send-otp:', data, error);
      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Gagal mengirim OTP');
      }

      console.log('[Register] OTP berhasil terkirim, pindah ke step 2');
      setStep(2);
      if (Platform.OS === 'web') window.alert(`Kode OTP telah dikirim ke nomor WhatsApp ${phone}.`);
      else Alert.alert('OTP Terkirim', `Kode OTP telah dikirim ke nomor WhatsApp ${phone}.`);
    } catch (err: any) {
      console.error('[Register] Error handleSendOtp:', err);
      if (Platform.OS === 'web') window.alert(err.message);
      else Alert.alert('Pengiriman Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Silakan masukkan 6 digit kode OTP.');
      return;
    }

    setLoading(true);

    try {
      console.log('[Register] Memverifikasi OTP...');
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

      console.log("Getting user...");
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Gagal mengautentikasi user. Silakan coba lagi.");
      }

      console.log("Updating user auth...");
      await supabase.auth.updateUser({
        data: {
          full_name: ownerName,
          store_name: storeName
        }
      });

      console.log("Uploading KTP...");
      const ktpFilePath = `${user.id}/ktp_${Date.now()}.jpg`;
      const cleanKtpBase64 = ktpBase64.replace(/^data:image\/\w+;base64,/, "");
      const { error: ktpError } = await supabase.storage
        .from('dealer_documents')
        .upload(ktpFilePath, decode(cleanKtpBase64), {
          contentType: 'image/jpeg',
          upsert: true
        });
      if (ktpError) {
        console.error("KTP Upload error:", ktpError);
        throw ktpError;
      }
      const ktpUrl = supabase.storage.from('dealer_documents').getPublicUrl(ktpFilePath).data.publicUrl;

      console.log("Uploading NPWP...");
      const npwpFilePath = `${user.id}/npwp_${Date.now()}.jpg`;
      const cleanNpwpBase64 = npwpBase64.replace(/^data:image\/\w+;base64,/, "");
      const { error: npwpError } = await supabase.storage
        .from('dealer_documents')
        .upload(npwpFilePath, decode(cleanNpwpBase64), {
          contentType: 'image/jpeg',
          upsert: true
        });
      if (npwpError) {
        console.error("NPWP Upload error:", npwpError);
        throw npwpError;
      }
      const npwpUrl = supabase.storage.from('dealer_documents').getPublicUrl(npwpFilePath).data.publicUrl;

      console.log("Upserting profile...");
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: ownerName,
        phone_number: phone,
        company_name: storeName,
        address: address || 'Alamat dari peta',
        lat: location.lat,
        lng: location.lng,
        approval_status: 'PENDING',
        ktp_url: ktpUrl,
        npwp_url: npwpUrl
      });

      if (error) {
        console.error("Profile Upsert error:", error);
        throw error;
      }

      // Buat record dealers jika belum ada (agar muncul di admin panel)
      console.log("Creating dealer record...");
      const { error: dealerError } = await supabase.from('dealers').upsert({
        profile_id: user.id,
        store_name: storeName,
        address: address || 'Alamat dari peta',
        latitude: location.lat,
        longitude: location.lng,
        credit_limit: 0,
        status: 'PENDING',
      }, { onConflict: 'profile_id' });

      if (dealerError) {
        // Jika kolom conflict tidak ada, coba insert biasa
        console.warn("Dealer upsert warning (mungkin tidak ada unique constraint):", dealerError);
        // Cek apakah dealer sudah ada
        const { data: existingDealer } = await supabase
          .from('dealers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (!existingDealer) {
          const { error: dealerInsertError } = await supabase.from('dealers').insert({
            profile_id: user.id,
            store_name: storeName,
            address: address || 'Alamat dari peta',
            latitude: location.lat,
            longitude: location.lng,
            credit_limit: 0,
            status: 'PENDING',
          });
          if (dealerInsertError) console.error("Dealer insert error:", dealerInsertError);
        }
      }

      console.log("Success! Logging out and redirecting to login.");
      await supabase.auth.signOut();
      
      if (Platform.OS === 'web') {
        window.alert('Pendaftaran Berhasil! 🎉\n\nProfil Anda telah disimpan. Mohon tunggu, Admin akan segera melakukan verifikasi.');
        router.replace('/login');
      } else {
        Alert.alert(
          'Pendaftaran Berhasil! 🎉', 
          'Profil Anda telah disimpan. Mohon tunggu, Admin akan segera melakukan verifikasi.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      console.error("Registration error caught:", error);
      Alert.alert('Gagal Daftar', error.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      console.log("Resetting loading state");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Daftar Akun Baru</Text>
      <Text style={styles.subtitle}>Bergabung sebagai Dealer B2B</Text>

      <View style={styles.formContainer}>
        {step === 1 ? (
          <>
            <TextInput 
              style={styles.input}
              placeholder="Nama Toko (Sesuai KTP/SIUP)"
              placeholderTextColor="#94a3b8"
              value={storeName}
              onChangeText={setStoreName}
            />
            <TextInput 
              style={styles.input}
              placeholder="Nama Lengkap Pemilik"
              placeholderTextColor="#94a3b8"
              value={ownerName}
              onChangeText={setOwnerName}
            />
            <TextInput 
              style={styles.input}
              placeholder="Email Aktif"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput 
              style={styles.input}
              placeholder="Nomor Handphone (WhatsApp)"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput 
              style={styles.input}
              placeholder="Alamat Lengkap Toko"
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Lokasi Toko (Peta)</Text>
              <TouchableOpacity style={styles.mapButton} onPress={() => setIsMapVisible(true)}>
                <Text style={styles.mapButtonText}>
                  {location ? `✓ Lokasi Terpilih (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : '📍 Tandai Lokasi di Peta (Wajib)'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* KTP Document */}
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Foto KTP Pemilik</Text>
              <TouchableOpacity style={styles.mapButton} onPress={() => pickImage('KTP')}>
                {ktpImage ? (
                  <Image source={{ uri: ktpImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Feather name="camera" size={24} color="#8ec44a" />
                    <Text style={styles.uploadText}>{Platform.OS === 'web' ? 'Pilih Foto KTP' : 'Ambil Foto KTP'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* NPWP Document */}
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Foto NPWP Toko/Pemilik</Text>
              <TouchableOpacity style={styles.mapButton} onPress={() => pickImage('NPWP')}>
                {npwpImage ? (
                  <Image source={{ uri: npwpImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Feather name="camera" size={24} color="#8ec44a" />
                    <Text style={styles.uploadText}>{Platform.OS === 'web' ? 'Pilih Foto NPWP' : 'Ambil Foto NPWP'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Lanjut Verifikasi OTP</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Login di sini</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        ) : (
          <View style={styles.otpContainer}>
            <Text style={styles.infoText}>Kode OTP telah dikirim ke WhatsApp: {phone}</Text>
            
            <TextInput 
              style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 4 }]}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            
            <TouchableOpacity style={styles.button} onPress={handleVerifyAndRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Selesaikan Pendaftaran</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} disabled={loading}>
              <Text style={styles.backButtonText}>Kembali Edit Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <MapPicker 
        visible={isMapVisible} 
        onClose={() => setIsMapVisible(false)} 
        onSelectLocation={(lat, lng) => {
          setLocation({lat, lng});
          setIsMapVisible(false);
        }} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbf0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a6b22',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcf0c3',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#8ec44a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLink: {
    color: '#8ec44a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500'
  },
  mapButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcf0c3',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#8ec44a',
    fontWeight: 'bold',
    fontSize: 14
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 12
  },
  uploadText: {
    marginTop: 8,
    color: '#8ec44a',
    fontWeight: '600'
  },
  otpContainer: {
    width: '100%',
    paddingVertical: 16,
    gap: 16,
  },
  infoText: {
    color: '#4a6b22',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
