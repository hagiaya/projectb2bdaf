import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
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

async function inspectSchema() {
  const tables = [
    'orders',
    'dealers',
    'sales_visits',
    'sales_targets',
    'sales_payrolls',
    'sales_attendances',
    'attendance',
    'attendances',
    'regions'
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table [${t}] ERROR:`, error.message);
    } else {
      console.log(`Table [${t}] OK. Sample keys:`, data && data[0] ? Object.keys(data[0]) : '(empty table)');
    }
  }
}

inspectSchema();
