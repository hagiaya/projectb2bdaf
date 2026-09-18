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

async function testTargetInsert() {
  const { data: adminAuth } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  console.log('Admin auth:', adminAuth.user.id);

  const budiSalesId = '7a71d961-c18d-4a72-ba70-2d3866dff979';

  // Test 1: period_month: 'Sep' (3 chars)
  const { data: t1, error: e1 } = await supabase.from('sales_targets').upsert({
    sales_id: budiSalesId,
    period_month: 'Sep',
    period_year: 2026,
    daily_visit_target: 6,
    work_days: 26,
    target_visits: 156,
    target_amount: 250000000,
    is_spv_target: true,
  }, { onConflict: 'sales_id,period_month,period_year' }).select();
  console.log('Test Sep result:', e1 ? e1.message : 'SUCCESS', t1);

  // Test 2: period_month: '2026-09' (7 chars)
  const { data: t2, error: e2 } = await supabase.from('sales_targets').upsert({
    sales_id: budiSalesId,
    period_month: '2026-09',
    period_year: 2026,
    daily_visit_target: 6,
    work_days: 26,
    target_visits: 156,
    target_amount: 250000000,
    is_spv_target: true,
  }, { onConflict: 'sales_id,period_month,period_year' }).select();
  console.log('Test 2026-09 result:', e2 ? e2.message : 'SUCCESS', t2);
}

testTargetInsert();
