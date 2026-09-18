import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  readyState = 3;
  constructor() {}
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  globalThis.WebSocket = MockWebSocket;
}

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: MockWebSocket },
});

async function testAuth() {
  console.log('Testing Admin login...');
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  if (adminErr) console.error('Admin login error:', adminErr.message);
  else console.log('Admin login success! User ID:', adminAuth.user.id);

  console.log('Testing Budi login...');
  const { data: budiAuth, error: budiErr } = await supabase.auth.signInWithPassword({
    email: '088899997777@sales.b2b.app',
    password: 'sales123',
  });
  if (budiErr) console.error('Budi login error:', budiErr.message);
  else console.log('Budi login success! User ID:', budiAuth.user.id);
}

testAuth();
