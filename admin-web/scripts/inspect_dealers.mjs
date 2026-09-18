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

async function inspectDealersAndRegions() {
  const { data: regions } = await supabase.from('regions').select('*');
  console.log('Regions:', regions);

  const { data: dealers } = await supabase.from('dealers').select('id, profile_id, store_name, address, sales_id, region_id');
  console.log('Dealers:', dealers);

  const { data: products } = await supabase.from('products').select('id, name, price, stock').limit(5);
  console.log('Products:', products);
}

inspectDealersAndRegions();
