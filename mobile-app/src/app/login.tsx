import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';


export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [otpOrPassword, setOtpOrPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Input identifier, 2 = Password/OTP Input
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [detectedRole, setDetectedRole] = useState<'SALES' | 'DEALER' | null>(null);

  const normalizePhone = (p: string) => {
    let digits = p.replace(/\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits;
  };

  const handleNextStep = async () => {
    const raw = identifier.trim();
    if (!raw) {
      Alert.alert('Error', 'Silakan masukkan nomor Handphone atau Email.');
      return;
    }

    setLoading(true);
    try {
      // Check if raw is email
      if (raw.includes('@')) {
        setDetectedRole('DEALER');
        setAuthMode('password');
        setStep(2);
        setLoading(false);
        return;
      }

      const normalizedPhone = normalizePhone(raw);

      // Check role in profiles table via RPC
      const { data: profileCheck, error: checkError } = await supabase
        .rpc('check_user_role', { p_phone: normalizedPhone });

      if (checkError) {
        throw new Error('Gagal mengecek status akun: ' + checkError.message);
      }

      if (!profileCheck) {
        Alert.alert(
          'Nomor Belum Terdaftar',
          'Nomor ini belum memiliki akun. Silakan lakukan pendaftaran terlebih dahulu.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Daftar Sekarang', onPress: () => router.push('/register') },
          ]
        );
        setLoading(false);
        return;
      }

      if (profileCheck.role === 'SALES') {
        if (profileCheck.approval_status === 'PENDING') {
          Alert.alert('Akun Belum Aktif', 'Akun Sales Anda masih menunggu persetujuan Admin.');
          setLoading(false);
          return;
        }
        setDetectedRole('SALES');
        setAuthMode('password');
        setStep(2);
      } else {
        // Dealer: default to Password login (instant) with option for OTP
        setDetectedRole('DEALER');
        setAuthMode('password');
        setStep(2);
      }
    } catch (err: any) {
      Alert.alert('Gagal Memproses', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otpOrPassword) {
      Alert.alert('Error', authMode === 'otp' ? 'Masukkan kode OTP.' : 'Masukkan Password.');
      return;
    }

    setLoading(true);
    try {
      const raw = identifier.trim();

      if (authMode === 'otp') {
        // Dealer OTP Verification
        const { data, error } = await supabase.functions.invoke('verify-otp', {
          body: { phone: raw, otp: otpOrPassword },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || 'OTP tidak valid atau kadaluarsa');
        }

        if (data.session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          if (sessionError) throw new Error('Gagal menyimpan sesi login.');
        } else {
          throw new Error('Server tidak mengembalikan sesi login.');
        }

        router.replace('/(dealer)/home');
      } else {
        // Password verification (Sales or Dealer)
        let loginEmail = raw;
        if (!raw.includes('@')) {
          const normalizedPhone = normalizePhone(raw);
          if (detectedRole === 'SALES') {
            loginEmail = `${normalizedPhone}@sales.b2b.app`;
          } else {
            loginEmail = `${normalizedPhone}@b2b-app.local`;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: otpOrPassword,
        });

        if (error) {
          // If dealer login with default password failed, check if custom password
          throw new Error('Kata sandi salah atau akun tidak ditemukan. (Kata sandi default: ' + (detectedRole === 'SALES' ? 'sales123' : 'dealer123') + ')');
        }

        // Verify role of logged in user
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'SALES') {
          router.replace('/(sales)');
        } else {
          router.replace('/(dealer)/home');
        }
      }
    } catch (err: any) {
      Alert.alert('Gagal Masuk', err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
      
      <Text style={styles.title}>
        {step === 1
          ? 'Masuk ke Akun B2B'
          : detectedRole === 'SALES'
          ? 'Login Sales'
          : 'Login Dealer'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? 'Gunakan nomor WhatsApp / HP terdaftar'
          : authMode === 'otp'
          ? `Masukkan kode OTP yang dikirim ke ${identifier}`
          : `Masukkan kata sandi untuk ${identifier}`}
      </Text>

      <View style={styles.formContainer}>
        {step === 1 ? (
          <>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput
                style={styles.inputIcon}
                placeholder="Nomor HP atau Email terdaftar"
                placeholderTextColor="#94a3b8"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNextStep} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Lanjut</Text>}
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
            <View style={styles.inputWrapper}>
              <Feather name={authMode === 'otp' ? 'key' : 'lock'} size={20} color="#94a3b8" style={styles.icon} />
              <TextInput
                style={styles.inputIcon}
                placeholder={authMode === 'otp' ? '6 Digit OTP' : 'Kata Sandi'}
                placeholderTextColor="#94a3b8"
                value={otpOrPassword}
                onChangeText={setOtpOrPassword}
                keyboardType={authMode === 'otp' ? 'number-pad' : 'default'}
                secureTextEntry={authMode === 'password'}
                maxLength={authMode === 'otp' ? 6 : 50}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Masuk Sekarang</Text>}
            </TouchableOpacity>

            {detectedRole === 'DEALER' && (
              <TouchableOpacity
                style={styles.switchAuthButton}
                onPress={() => {
                  setAuthMode(authMode === 'password' ? 'otp' : 'password');
                  setOtpOrPassword('');
                }}
              >
                <Text style={styles.switchAuthText}>
                  {authMode === 'password' ? 'Gunakan OTP WhatsApp' : 'Gunakan Kata Sandi'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} disabled={loading}>
              <Text style={styles.backButtonText}>← Ganti Akun / Nomor HP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f6fbf0' },
  container: { padding: 24, paddingTop: 48, alignItems: 'center' },
  logoImage: { width: 220, height: 80, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#14532d', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center', paddingHorizontal: 16 },
  formContainer: { width: '100%', gap: 12, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcf0c3',
    paddingHorizontal: 16,
  },
  icon: { marginRight: 12 },
  inputIcon: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1e293b' },
  button: {
    backgroundColor: '#8ec44a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  outlineButton: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8ec44a',
  },
  outlineButtonText: { color: '#8ec44a', fontSize: 14, fontWeight: 'bold' },
  switchAuthButton: { paddingVertical: 8, alignItems: 'center' },
  switchAuthText: { color: '#166534', fontSize: 13, fontWeight: '600' },
  backButton: { paddingVertical: 10, alignItems: 'center' },
  backButtonText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

});
