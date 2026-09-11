import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const ACTIVE_SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ACTIVE_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ACTIVE_SUPABASE_ANON_KEY;

// Auto-heal: Jika environment di Vercel/Hosting masih menyimpan URL Supabase lama yang sudah mati (rbezcgrxokzhtslrxuta)
if (!supabaseUrl || supabaseUrl.includes('rbezcgrxokzhtslrxuta')) {
  supabaseUrl = ACTIVE_SUPABASE_URL;
  supabaseAnonKey = ACTIVE_SUPABASE_ANON_KEY;
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
