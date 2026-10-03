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

async function fixProducts() {
  console.log('Logging in as Admin...');
  const { data: adminAuth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  if (aErr) return console.error('Admin login error:', aErr);
  console.log('Logged in as Admin:', adminAuth.user.id);

  console.log('Fetching all products that have LOW_STOCK or OUT_OF_STOCK...');
  const { data: prods, error: pErr } = await supabase
    .from('products')
    .select('id, name, status, stock')
    .in('status', ['LOW_STOCK', 'OUT_OF_STOCK']);
    
  if (pErr) {
    console.error('Error fetching products:', pErr);
    return;
  }
  
  console.log(`Found ${prods?.length || 0} products with incorrect status.`);
  
  if (prods && prods.length > 0) {
    for (const p of prods) {
      console.log(`Updating product: ${p.name} (ID: ${p.id}) from ${p.status} to ACTIVE`);
      const { error: updateErr } = await supabase
        .from('products')
        .update({ status: 'ACTIVE' })
        .eq('id', p.id);
        
      if (updateErr) {
        console.error(`Failed to update ${p.name}:`, updateErr);
      } else {
        console.log(`Successfully updated ${p.name}`);
      }
    }
  } else {
    console.log('No products to update. All good!');
  }
}

fixProducts();
