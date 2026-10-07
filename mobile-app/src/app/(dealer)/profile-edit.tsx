import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useSafeBottom } from '../../hooks/useSafeBottom';

export default function ProfileEditScreen() {
  const bottomPadding = useSafeBottom();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error('Not authenticated');

      const userId = sessionData.session.user.id;
      setProfileId(userId);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');

      // Fetch dealer
      const { data: dealer, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('profile_id', userId)
        .single();
        
      if (dealerError && dealerError.code !== 'PGRST116') throw dealerError; // PGRST116 is no rows
      
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

  const handleSave = async () => {
    if (!storeName.trim() || !fullName.trim() || !phoneNumber.trim() || !address.trim()) {
      Alert.alert("Gagal", "Semua kolom wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      if (profileId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
          })
          .eq('id', profileId);
          
        if (profileError) throw profileError;
      }

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
      
      Alert.alert("Berhasil", "Profil Anda telah diperbarui.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.warn("Error updating profile:", e);
      Alert.alert("Error", "Gagal menyimpan perubahan: " + e.message);
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
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data Toko</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Toko</Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Masukkan nama toko"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Pemilik / PIC</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Masukkan nama pemilik"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor HP / WA</Text>
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
              <Text style={styles.label}>Alamat Lengkap</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Detail alamat toko Anda"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
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
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
  },
  saveBtn: {
    backgroundColor: '#8ec44a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
