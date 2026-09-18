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

async function testAuthInserts() {
  console.log('Logging in as Admin...');
  const { data: adminAuth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  if (aErr) return console.error('Admin login error:', aErr);
  console.log('Logged in as Admin:', adminAuth.user.id);

  // Test insert payroll as Admin
  const budiSalesId = '7a71d961-c18d-4a72-ba70-2d3866dff979';
  const { data: pr, error: prErr } = await supabase.from('sales_payrolls').insert({
    payroll_number: 'TEST-001',
    sales_id: budiSalesId,
    period_month: 'September',
    period_year: 2026,
    status: 'DRAFT',
  }).select();
  console.log('Admin insert sales_payrolls result:', prErr ? prErr.message : 'SUCCESS');

  // Test Budi login and insert sales_attendance
  console.log('Logging in as Budi...');
  const { data: budiAuth, error: bErr } = await supabase.auth.signInWithPassword({
    email: '088899997777@sales.b2b.app',
    password: 'sales123',
  });
  if (bErr) return console.error('Budi login error:', bErr);
  console.log('Logged in as Budi:', budiAuth.user.id);

  // Test insert attendance as Budi
  const { error: attErr } = await supabase.from('sales_attendance').upsert({
    sales_id: budiSalesId,
    attendance_date: '2026-09-18',
    check_in_time: '2026-09-18T07:55:00Z',
    check_out_time: '2026-09-18T17:30:00Z',
    is_late: false,
    status: 'PRESENT',
  }, { onConflict: 'sales_id,attendance_date' });
  console.log('Budi upsert sales_attendance result:', attErr ? attErr.message : 'SUCCESS');

  // Test insert sales_visits as Budi
  // First get a dealer
  const { data: dealers } = await supabase.from('dealers').select('id').limit(1);
  if (dealers && dealers.length > 0) {
    const { error: visErr } = await supabase.from('sales_visits').insert({
      sales_id: budiSalesId,
      dealer_id: dealers[0].id,
      check_in_time: '2026-09-18T09:00:00Z',
      check_out_time: '2026-09-18T09:45:00Z',
      earned_amount: 32000,
      status: 'COMPLETED',
      notes: 'Test visit',
    });
    console.log('Budi insert sales_visits result:', visErr ? visErr.message : 'SUCCESS');
  }
}

testAuthInserts();
