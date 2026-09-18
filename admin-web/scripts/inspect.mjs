import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 3;
  url = '';
  protocol = '';
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  constructor(_url, _protocols) {}
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
  realtime: {
    transport: MockWebSocket,
  },
});

async function inspect() {
  console.log('--- SALES ---');
  const { data: sales, error: sErr } = await supabase.from('sales').select('*, profiles(*)');
  if (sErr) console.error('Sales err:', sErr);
  else console.log('Count sales:', sales?.length, JSON.stringify(sales, null, 2));

  console.log('--- PROFILES ---');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error('Profiles err:', pErr);
  else console.log('Count profiles:', profiles?.length, JSON.stringify(profiles, null, 2));

  console.log('--- RECENT ORDERS ---');
  const { data: orders, error: oErr } = await supabase.from('orders').select('id, order_number, total_amount, commission_amount, status, created_at, sales_id, store_id').order('created_at', { ascending: false }).limit(5);
  if (oErr) console.error('Orders err:', oErr);
  else console.log('Recent orders:', JSON.stringify(orders, null, 2));

  console.log('--- RECENT VISITS ---');
  const { data: visits, error: vErr } = await supabase.from('sales_visits').select('id, sales_id, store_id, status, earned_amount, visit_date, created_at').order('created_at', { ascending: false }).limit(5);
  if (vErr) console.error('Visits err:', vErr);
  else console.log('Recent visits:', JSON.stringify(visits, null, 2));

  console.log('--- RECENT TARGETS ---');
  const { data: targets, error: tErr } = await supabase.from('sales_targets').select('*').limit(5);
  if (tErr) console.error('Targets err:', tErr);
  else console.log('Recent targets:', JSON.stringify(targets, null, 2));

  console.log('--- STORES ---');
  const { data: stores, error: stErr } = await supabase.from('stores').select('id, name, address').limit(5);
  if (stErr) console.error('Stores err:', stErr);
  else console.log('Stores:', JSON.stringify(stores, null, 2));
}

inspect();
