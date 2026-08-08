import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import MapPicker from '../components/MapPicker';

export default function RegisterScreen() {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Daftar Akun Baru</Text>
      <Text style={styles.subtitle}>Bergabung sebagai Dealer B2B</Text>

      <View style={styles.formContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Nama Toko (Sesuai KTP/SIUP)"
          placeholderTextColor="#94a3b8"
        />
        <TextInput 
          style={styles.input}
          placeholder="Nama Lengkap Pemilik"
          placeholderTextColor="#94a3b8"
        />
        <TextInput 
          style={styles.input}
          placeholder="Email Aktif"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input}
          placeholder="Nomor Handphone (WhatsApp)"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />
        <TextInput 
          style={styles.input}
          placeholder="Konfirmasi Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Lokasi Toko (Peta)</Text>
          <TouchableOpacity style={styles.mapButton} onPress={() => setIsMapVisible(true)}>
            <Text style={styles.mapButtonText}>
              {location ? `✓ Lokasi Terpilih (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : '📍 Tandai Lokasi di Peta (Wajib)'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Buat Akun Sekarang</Text>
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Sudah punya akun? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Login di sini</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
  }
});
