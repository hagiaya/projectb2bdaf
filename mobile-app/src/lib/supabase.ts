import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure you have set the environment variables in .env.');
}

// Storage adapter yang aman untuk SSR (web server-side rendering)
// Pada native (iOS/Android), gunakan AsyncStorage
// Pada web client, gunakan localStorage
// Pada SSR (Node.js), gunakan memory storage (no-op)
const createStorage = () => {
  // SSR / Node.js environment - tidak ada window
  if (typeof window === 'undefined') {
    return {
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: string) => Promise.resolve(),
      removeItem: (_key: string) => Promise.resolve(),
    };
  }

  // Native (iOS/Android)
  if (Platform.OS !== 'web') {
    // Lazy import AsyncStorage hanya di native
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }

  // Web browser - gunakan localStorage
  return {
    getItem: (key: string) => {
      try {
        return Promise.resolve(window.localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return Promise.resolve();
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
