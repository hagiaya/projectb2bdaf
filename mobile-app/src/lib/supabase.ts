import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill WebSocket untuk SSR di Node.js < 22 agar Supabase Realtime tidak crash saat prerender
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 3;
  url = '';
  protocol = '';
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  constructor(_url?: string, _protocols?: string | string[]) {}
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

const getWebSocketTransport = () => {
  if (typeof WebSocket !== 'undefined') {
    return WebSocket;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).WebSocket) {
    return (globalThis as any).WebSocket;
  }
  return MockWebSocket;
};

if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  (globalThis as any).WebSocket = MockWebSocket;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure you have set the environment variables in .env.');
}

// Storage adapter yang aman untuk SSR (web server-side rendering)
// Pada native dan web client, gunakan AsyncStorage (sudah support web)
// Pada SSR (Node.js), gunakan memory storage (no-op)
const createStorage = () => {
  // SSR / Node.js environment - tidak ada window
  if (typeof window === 'undefined' && Platform.OS === 'web') {
    return {
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: string) => Promise.resolve(),
      removeItem: (_key: string) => Promise.resolve(),
    };
  }

  // Native & Web Client (Expo sudah support web untuk AsyncStorage)
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: getWebSocketTransport(),
  },
});
