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

async function reconcile() {
  console.log('🚀 Memulai proses rekonsiliasi stok berdasarkan riwayat pesanan...\n');
  await sb.auth.signInWithPassword({ email: 'ditoapp@atomicmail.io', password: 'admin123' });

  // 1. Ambil pesanan aktif dalam urutan waktu pembuatan (kronologis)
  const { data: orders, error: oErr } = await sb
    .from('orders')
    .select('id, order_number, status, created_at, dealers(store_name)')
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: true });

  if (oErr || !orders) {
    console.error('Gagal mengambil orders:', oErr);
    return;
  }

  // 2. Cek order yang sudah pernah dicatat di stock_logs agar tidak terpotong dua kali (idempotent)
  const { data: existingLogs } = await sb.from('stock_logs').select('notes');
  const loggedOrderNumbers = new Set();
  for (const l of existingLogs || []) {
    if (l.notes) {
      const match = l.notes.match(/ORD-\d+/);
      if (match) loggedOrderNumbers.add(match[0]);
    }
  }

  console.log(`Ditemukan ${orders.length} pesanan aktif.`);
  console.log(`Pesanan yang sudah tercatat sebelumnya: ${loggedOrderNumbers.size}\n`);

  let processedOrdersCount = 0;
  let processedItemsCount = 0;
  const auditSummary = [];

  for (const order of orders) {
    if (loggedOrderNumbers.has(order.order_number)) {
      console.log(`⏩ [SKIP] ${order.order_number} (${order.dealers?.store_name}) sudah pernah diproses.`);
      continue;
    }

    console.log(`\n📦 [PROSES] ${order.order_number} | Toko: ${order.dealers?.store_name || '-'} | Tanggal: ${order.created_at.slice(0, 10)}`);

    // Ambil order items untuk pesanan ini
    const { data: items, error: iErr } = await sb
      .from('order_items')
      .select('id, product_id, quantity, products(id, name, sku, stock)')
      .eq('order_id', order.id);

    if (iErr || !items || items.length === 0) {
      console.warn(`   ⚠️ Tidak ada items untuk order ${order.order_number}`);
      continue;
    }

    for (const it of items) {
      if (!it.product_id) continue;

      // Ambil stok terkini dari database
      const { data: curProd, error: pErr } = await sb
        .from('products')
        .select('id, name, sku, stock')
        .eq('id', it.product_id)
        .single();

      if (pErr || !curProd) {
        console.warn(`   ⚠️ Produk ID ${it.product_id} tidak ditemukan.`);
        continue;
      }

      const prevStock = Number(curProd.stock) || 0;
      const orderQty = Math.max(1, Math.round(Number(it.quantity) || 1));
      const newStock = Math.max(0, prevStock - orderQty);

      // 1. Update stok di tabel products
      const { error: updErr } = await sb
        .from('products')
        .update({ stock: newStock })
        .eq('id', it.product_id);

      if (updErr) {
        console.error(`   ❌ Gagal update stok produk ${curProd.name}:`, updErr);
        continue;
      }

      // 2. Masukkan catatan ke tabel stock_logs dengan created_at sesuai tanggal pesanan
      const { error: logErr } = await sb
        .from('stock_logs')
        .insert([{
          product_id: it.product_id,
          type: 'SALE',
          quantity: orderQty,
          previous_stock: prevStock,
          current_stock: newStock,
          notes: `Pengurangan Stok Pesanan #${order.order_number}`,
          created_by: order.dealers?.store_name || 'Dealer',
          created_at: order.created_at,
        }]);

      if (logErr) {
        console.warn(`   ⚠️ Gagal mencatat stock log untuk ${curProd.name}:`, logErr);
      }

      processedItemsCount++;
      console.log(`   ✅ ${curProd.sku || '-'} - ${curProd.name} | Qty: ${orderQty} pcs | Stok: ${prevStock} ➔ ${newStock}`);

      auditSummary.push({
        order_number: order.order_number,
        dealer: order.dealers?.store_name,
        date: order.created_at.slice(0, 10),
        sku: curProd.sku,
        product: curProd.name,
        qty: orderQty,
        prevStock,
        newStock,
      });
    }

    processedOrdersCount++;
  }

  console.log('\n========================================');
  console.log(`🎉 REKONSILIASI SELESAI SUKSES!`);
  console.log(`- Total Pesanan Berhasil Direkonsiliasi : ${processedOrdersCount}`);
  console.log(`- Total SKU / Item Mutasi Dicatat     : ${processedItemsCount}`);
  console.log('========================================\n');
}

reconcile();
