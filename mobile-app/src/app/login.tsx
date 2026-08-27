import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Input

  const normalizePhone = (p: string) => {
    let digits = p.replace(/\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits;
  };

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Silakan masukkan nomor WhatsApp Anda.');
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

      if (!profileCheck) {
        Alert.alert(
          'Nomor Belum Terdaftar', 
          'Nomor ini belum memiliki akun. Silakan lakukan pendaftaran terlebih dahulu.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Daftar Sekarang', onPress: () => router.push('/register') }
          ]
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Gagal mengirim OTP');
      }

      setStep(2);
      Alert.alert('OTP Terkirim', `Kode OTP telah dikirim ke nomor WhatsApp ${phone}.`);
    } catch (err: any) {
      Alert.alert('Pengiriman Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Silakan masukkan 6 digit kode OTP.');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Memverifikasi OTP untuk nomor:', phone);

      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp },
      });

      console.log('[Login] Response verify-otp:', JSON.stringify({ data, error }));

      if (error) {
        throw new Error(error.message || 'Gagal menghubungi server. Cek koneksi internet Anda.');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'OTP tidak valid atau kadaluarsa');
      }

      // Set session dari response edge function
      if (data.session) {
        console.log('[Login] Menyimpan session...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        if (sessionError) {
          console.error('[Login] Session error:', sessionError);
          throw new Error('Gagal menyimpan sesi login: ' + sessionError.message);
        }
        console.log('[Login] Session berhasil disimpan');
      } else {
        throw new Error('Server tidak mengembalikan sesi login. Hubungi admin.');
      }

      // Karena ini murni login, kita asumsikan profil pasti ada (karena sudah dicek di awal)
      console.log('[Login] Masuk ke home');
      router.replace('/(dealer)/home');
    } catch (err: any) {
      console.error('[Login] Error lengkap:', err);
      // Pastikan selalu ada pesan yang ditampilkan
      const message = err?.message || err?.toString() || 'Terjadi kesalahan tak dikenal. Silakan coba lagi.';
      Alert.alert('Verifikasi Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={styles.logoImage} 
        resizeMode="contain" 
      />
      <Text style={styles.subtitle}>
        {step === 1 ? 'Masuk atau Daftar dengan WhatsApp' : 'Verifikasi Kode OTP'}
      </Text>

      <View style={styles.formContainer}>
        {step === 1 ? (
          <>
            <View style={styles.inputWrapper}>
              <Feather name="phone" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.inputIcon}
                placeholder="081234567890"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Kirim OTP via WhatsApp</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outlineButton} 
              onPress={() => router.push('/register')} 
              disabled={loading}
            >
              <Text style={styles.outlineButtonText}>Belum punya akun? Daftar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>Kode OTP telah dikirim ke: {phone}</Text>
            <View style={styles.inputWrapper}>
              <Feather name="key" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.inputIcon}
                placeholder="6 Digit OTP"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verifikasi & Masuk</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} disabled={loading}>
              <Text style={styles.backButtonText}>Ubah Nomor WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6fbf0',
    padding: 24,
  },
  logoImage: {
    width: '70%',
    height: 100,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 48,
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcf0c3',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  inputIcon: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b'
  },
  infoText: {
    color: '#4a6b22',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8
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
  backButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#8ec44a',
  },
  outlineButtonText: {
    color: '#8ec44a',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
