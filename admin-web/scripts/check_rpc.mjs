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

async function checkRpc() {
  await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });

  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql', 'query'];
  for (const r of rpcs) {
    const { data, error } = await supabase.rpc(r, { query: 'SELECT 1;' });
    console.log(`RPC ${r}:`, error ? error.message : 'EXISTS!');
  }
}

checkRpc();
