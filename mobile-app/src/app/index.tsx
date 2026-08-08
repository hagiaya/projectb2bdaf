import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Gunakan set timeout kecil untuk menghindari crash saat render pertama
    setTimeout(() => {
      router.replace('/login');
    }, 100);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fbf0' }}>
      <ActivityIndicator size="large" color="#8ec44a" />
    </View>
  );
}

