import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3; readyState = 3;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}
if (typeof WebSocket === 'undefined') globalThis.WebSocket = MockWebSocket;

const sb = createClient('https://mvpwgzkvmadtsspewxtu.supabase.co', 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj', {
  realtime: { transport: MockWebSocket },
  auth: { persistSession: false }
});

async function run() {
  await sb.auth.signInWithPassword({ email: 'ditoapp@atomicmail.io', password: 'admin123' });

  const { data: orders } = await sb.from('orders').select('id, order_number, status, total_amount, created_at, dealers(store_name)').order('created_at', { ascending: true });
  const { data: items } = await sb.from('order_items').select('id, order_id, product_id, quantity, unit_price, total_price, products(id, name, stock, sku)');
  const { data: logs } = await sb.from('stock_logs').select('notes, product_id, quantity');

  const loggedOrderNumbers = new Set();
  for (const l of logs || []) {
    if (l.notes) {
      const match = l.notes.match(/ORD-\d+/);
      if (match) loggedOrderNumbers.add(match[0]);
    }
  }

  const itemsByOrder = {};
  for (const it of items || []) {
    if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
    itemsByOrder[it.order_id].push(it);
  }

  console.log('=== LIST ALL ORDERS (Total: ' + orders?.length + ') ===');
  for (let i = 0; i < (orders || []).length; i++) {
    const o = orders[i];
    const isLogged = loggedOrderNumbers.has(o.order_number);
    const orderItems = itemsByOrder[o.id] || [];
    const totalQty = orderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    console.log(`${i+1}. [${o.created_at.slice(0, 10)}] ${o.order_number} | Toko: ${o.dealers?.store_name || '-'} | Status: ${o.status} | Item SKU: ${orderItems.length} (Total pcs: ${totalQty}) | Logged: ${isLogged}`);
  }
}

run();
