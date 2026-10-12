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

async function simulate() {
  await sb.auth.signInWithPassword({ email: 'ditoapp@atomicmail.io', password: 'admin123' });

  const { data: orders } = await sb.from('orders').select('id, order_number, status, created_at, dealers(store_name)').order('created_at', { ascending: true });
  const { data: items } = await sb.from('order_items').select('id, order_id, product_id, quantity, products(id, name, stock, sku)');
  
  // Exclude CANCELLED
  const activeOrders = (orders || []).filter(o => o.status !== 'CANCELLED');
  const activeOrderIds = new Set(activeOrders.map(o => o.id));

  const itemsMap = {};
  for (const it of items || []) {
    if (!activeOrderIds.has(it.order_id)) continue;
    if (!itemsMap[it.product_id]) {
      itemsMap[it.product_id] = {
        name: it.products?.name,
        sku: it.products?.sku,
        currentStock: Number(it.products?.stock) || 0,
        totalOrdered: 0,
        ordersCount: 0
      };
    }
    itemsMap[it.product_id].totalOrdered += Number(it.quantity) || 0;
    itemsMap[it.product_id].ordersCount += 1;
  }

  console.log('=== SIMULASI REKONSILIASI STOK (25 ACTIVE ORDERS) ===');
  let negativeCount = 0;
  for (const pid of Object.keys(itemsMap)) {
    const p = itemsMap[pid];
    const newStock = p.currentStock - p.totalOrdered;
    if (newStock < 0) {
      negativeCount++;
      console.log(`[ALERT MINUS] SKU: ${p.sku || '-'} | Name: ${p.name} | Stok Sekarang: ${p.currentStock} | Total Order: ${p.totalOrdered} | Selisih: ${newStock}`);
    }
  }
  console.log('Total produk terdampak:', Object.keys(itemsMap).length);
  console.log('Produk dengan stok minus:', negativeCount);
}

simulate();
