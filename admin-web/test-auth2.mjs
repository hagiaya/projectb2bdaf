import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}

globalThis.WebSocket = MockWebSocket;

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function check() {
  const email = '082111277520@sales.b2b.app';
  console.log('Login attempt with ajisales123');
  const res1 = await supabase.auth.signInWithPassword({ email, password: 'ajisales123' });
  console.log('Res1:', res1.error?.message || 'Success');
}
check();
