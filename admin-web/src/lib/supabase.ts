import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: getWebSocketTransport(),
  },
});
