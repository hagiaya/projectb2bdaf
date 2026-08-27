import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Generate random positions for background gadget icons
const generateMotifs = () => {
  const motifs = [];
  const icons = ['smartphone', 'headphones', 'battery-charging', 'watch', 'monitor', 'cpu', 'speaker', 'tv', 'radio', 'wifi'];
  for (let i = 0; i < 25; i++) {
    motifs.push({
      id: i,
      name: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 40 + 20, // 20 to 60
      rotation: Math.random() * 360,
    });
  }
  return motifs;
};

export default function WelcomeScreen() {
  const [motifs] = useState(generateMotifs());

  useEffect(() => {
    // Auto redirect to home if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If they already have a session, auto redirect to home
        router.replace('/(dealer)/home');
      }
    });
    
    // Also listen for auth state changes just in case
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(dealer)/home');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Motif */}
      {motifs.map((motif) => (
        <Feather
          key={motif.id}
          name={motif.name as any}
          size={motif.size}
          color="rgba(255, 255, 255, 0.12)"
          style={{
            position: 'absolute',
            left: motif.x,
            top: motif.y,
            transform: [{ rotate: `${motif.rotation}deg` }],
          }}
        />
      ))}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.tagline}>Solusi Belanja Grosir Aksesoris Gadget Terbaik dan Terpercaya</Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Login / Daftar</Text>
          <Feather name="arrow-right" size={20} color="#166534" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8ec44a', // Match logo green
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: width * 0.7,
    height: 120,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 100,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#166534', // Dark green text
    fontSize: 18,
    fontWeight: '800',
  }
});
