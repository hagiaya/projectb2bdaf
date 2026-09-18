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

async function checkCurrent() {
  await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });

  const { data: v } = await supabase.from('sales_visits').select('id, dealer_id, check_in_time, status');
  console.log('Visits count:', v?.length, v);

  const { data: o } = await supabase.from('orders').select('id, order_number, final_amount, status, created_at');
  console.log('Orders count:', o?.length, o);

  const { data: a } = await supabase.from('sales_attendance').select('id, attendance_date, status');
  console.log('Attendance count:', a?.length);

  const { data: t } = await supabase.from('sales_targets').select('*');
  console.log('Targets count:', t?.length, t);

  const { data: p } = await supabase.from('sales_payrolls').select('*');
  console.log('Payrolls count:', p?.length, p);
}

checkCurrent();
