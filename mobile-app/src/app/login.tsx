import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

interface QuickAccount {
  label: string;
  role: 'SALES' | 'DEALER';
  phoneOrEmail: string;
  authEmail: string;
  pass: string;
  subtitle: string;
  badge: string;
}

const REAL_ACCOUNTS: QuickAccount[] = [
  {
    label: 'Ahmad Fauzi (Sales Field)',
    role: 'SALES',
    phoneOrEmail: '081234567890',
    authEmail: '081234567890@sales.b2b.app',
    pass: 'sales123',
    subtitle: '3 Toko Binaan • 11 Order • Saldo Rp 1.25M',
    badge: 'Sales Field',
  },
  {
    label: 'Budi Pratama (Sales Spv)',
    role: 'SALES',
    phoneOrEmail: '088899997777',
    authEmail: '088899997777@sales.b2b.app',
    pass: 'sales123',
    subtitle: '1 Toko Binaan (Tiwi Acc) • Saldo Rp 850K',
    badge: 'Supervisor',
  },
  {
    label: 'Lie Sudito (CV. JAVA CELLULER)',
    role: 'DEALER',
    phoneOrEmail: '08114991888',
    authEmail: '08114991888@b2b-app.local',
    pass: 'dealer123',
    subtitle: 'Timika Papua • PIC: Ahmad Fauzi • 2 Program',
    badge: 'Dealer',
  },
  {
    label: 'Reza Latandrang (Toko Reza Cell)',
    role: 'DEALER',
    phoneOrEmail: '085123968217',
    authEmail: '085123968217@b2b-app.local',
    pass: 'dealer123',
    subtitle: '9 Order Aktif • PIC: Ahmad Fauzi',
    badge: 'Dealer',
  },
  {
    label: 'mokoagow (Toko Tiwi Accessories)',
    role: 'DEALER',
    phoneOrEmail: '083117927964',
    authEmail: '083117927964@b2b-app.local',
    pass: 'dealer123',
    subtitle: 'PIC: Budi Pratama',
    badge: 'Dealer',
  },
  {
    label: 'Demo Dealer (Toko Sinar Abadi)',
    role: 'DEALER',
    phoneOrEmail: 'demo@dealer.com',
    authEmail: 'demo@dealer.com',
    pass: 'dealer123',
    subtitle: 'PIC: Ahmad Fauzi',
    badge: 'Dealer',
  },
];

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [otpOrPassword, setOtpOrPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Input identifier, 2 = Password/OTP Input
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [detectedRole, setDetectedRole] = useState<'SALES' | 'DEALER' | null>(null);
  const [showQuickPicker, setShowQuickPicker] = useState(true);

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

  const handleQuickLogin = async (acc: QuickAccount) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: acc.authEmail,
        password: acc.pass,
      });

      if (error) {
        throw error;
      }

      if (acc.role === 'SALES') {
        router.replace('/(sales)');
      } else {
        router.replace('/(dealer)/home');
      }
    } catch (err: any) {
      Alert.alert('Gagal Login Cepat', err.message);
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

      {/* QUICK ACCOUNT PICKER (DATA REAL) */}
      <View style={styles.quickSection}>
        <TouchableOpacity
          style={styles.quickHeader}
          onPress={() => setShowQuickPicker(!showQuickPicker)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="zap" size={16} color="#166534" />
            <Text style={styles.quickTitle}>Pilih Akun Cepat (Data Real Database)</Text>
          </View>
          <Feather name={showQuickPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
        </TouchableOpacity>

        {showQuickPicker && (
          <View style={styles.quickList}>
            {REAL_ACCOUNTS.map((acc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.accountCard}
                onPress={() => handleQuickLogin(acc)}
                disabled={loading}
              >
                <View style={styles.accountCardLeft}>
                  <View
                    style={[
                      styles.avatarBadge,
                      { backgroundColor: acc.role === 'SALES' ? '#dcfce7' : '#e0f2fe' },
                    ]}
                  >
                    <Feather
                      name={acc.role === 'SALES' ? 'briefcase' : 'shopping-bag'}
                      size={16}
                      color={acc.role === 'SALES' ? '#166534' : '#0369a1'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.accountName}>{acc.label}</Text>
                      <View
                        style={[
                          styles.roleTag,
                          { backgroundColor: acc.role === 'SALES' ? '#bbf7d0' : '#bae6fd' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleTagText,
                            { color: acc.role === 'SALES' ? '#14532d' : '#0c4a6e' },
                          ]}
                        >
                          {acc.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.accountSub}>{acc.subtitle}</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
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

  // Quick picker
  quickSection: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 40,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#14532d' },
  quickList: { marginTop: 8, gap: 10 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accountCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 10, fontWeight: '700' },
  accountSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
