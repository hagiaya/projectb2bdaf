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

async function checkCols() {
  const { data: adminAuth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  console.log('Admin login:', adminAuth?.user?.id, aErr?.message);

  const cols = [
    'period_month',
    'status',
    'notes',
  ];

  for (const c of cols) {
    const testPayload = {
      [c]: '12345678', // 8 chars
    };
    const { error } = await supabase.from('sales_targets').insert(testPayload);
    console.log(`Column ${c} with 8 chars result:`, error?.message);
  }
}

checkCols();
