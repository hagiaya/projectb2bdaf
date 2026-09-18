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

async function testDealerOrder() {
  console.log('Logging in as Dealer Lie Sudito...');
  const { data: dealerAuth, error: dErr } = await supabase.auth.signInWithPassword({
    email: '08114991888@b2b-app.local',
    password: 'dealer123',
  });
  if (dErr) console.error('Dealer login err:', dErr);
  else console.log('Dealer logged in:', dealerAuth.user.id);

  // Get dealer record
  const { data: dealerRec } = await supabase.from('dealers').select('id, sales_id').eq('profile_id', dealerAuth.user.id).single();
  console.log('Dealer record:', dealerRec);

  const testOrder = {
    order_number: 'ORD-TEST-001',
    dealer_id: dealerRec?.id,
    sales_id: dealerRec?.sales_id,
    total_amount: 15000000,
    final_amount: 15000000,
    status: 'COMPLETED',
  };

  const { data: ord, error: ordErr } = await supabase.from('orders').upsert(testOrder, { onConflict: 'order_number' }).select();
  console.log('Dealer upsert order result:', ordErr ? ordErr.message : 'SUCCESS', ord);
}

testDealerOrder();
