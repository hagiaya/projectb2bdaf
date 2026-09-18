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

async function inspectColumns() {
  const tables = ['sales_attendance', 'sales_visits', 'orders', 'sales_targets', 'sales_payrolls', 'dealers'];
  for (const t of tables) {
    // Try inserting an empty object or select with limit 0 to see headers / error details
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} count:`, data.length);
      if (data.length > 0) {
        console.log(`Table ${t} columns:`, Object.keys(data[0]));
      }
    }
  }

  // Let's get PostgreSQL column schema using rpc or information_schema if possible, or attempt an insert error to see columns
  const testInsert = async (table) => {
    const { error } = await supabase.from(table).insert({ __dummy_col_test__: 1 });
    console.log(`Test insert into ${table}:`, error?.message);
  };

  for (const t of tables) {
    await testInsert(t);
  }
}

inspectColumns();
