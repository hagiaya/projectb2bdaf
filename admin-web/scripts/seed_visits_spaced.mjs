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

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { transport: MockWebSocket },
  });
}

async function seedVisitsSpaced() {
  console.log('Logging in as Budi Pratama...');
  const client = getClient();
  await client.auth.signInWithPassword({
    email: '088899997777@sales.b2b.app',
    password: 'sales123',
  });

  const budiSalesId = '7a71d961-c18d-4a72-ba70-2d3866dff979';

  // Get dealers
  const { data: dealers } = await client.from('dealers').select('id, store_name');
  const javaCell = dealers?.find(d => d.store_name?.includes('JAVA CELLULER'));
  const tiwiStore = dealers?.find(d => d.store_name?.includes('Tiwi'));
  const rezaCell = dealers?.find(d => d.store_name?.includes('Reza Cell'));

  console.log('Dealers:', { javaCell: javaCell?.id, tiwiStore: tiwiStore?.id, rezaCell: rezaCell?.id });

  // Clear previous visits if any
  const { error: delErr } = await client.from('sales_visits').delete().eq('sales_id', budiSalesId);
  console.log('Delete old visits:', delErr?.message || 'SUCCESS');

  const visitRows = [];
  const valuePerVisit = 32051.28;

  // Dealer 1 (CV. JAVA CELLULER): Kunjungan tanggal 18, 15, 12, 9, 6, 3, 1 Sept
  const javaDays = [1, 3, 6, 9, 12, 15, 18];
  for (const day of javaDays) {
    if (!javaCell) continue;
    const cin = new Date(2026, 8, day, 9, 30);
    const cout = new Date(2026, 8, day, 10, 15);
    visitRows.push({
      sales_id: budiSalesId,
      dealer_id: javaCell.id,
      check_in_time: cin.toISOString(),
      check_out_time: cout.toISOString(),
      unit_percentage: 95,
      owner_met: true,
      latitude: -4.557833,
      longitude: 136.881533,
      notes: 'Pengecekan display DAP audio mobil & adaptor di etalase depan. Display rapi.',
      earned_amount: valuePerVisit,
      status: 'COMPLETED',
      created_at: cin.toISOString(),
    });
  }

  // Dealer 2 (Toko Tiwi Accessories): Kunjungan tanggal 2, 5, 8, 11, 14, 17 Sept
  const tiwiDays = [2, 5, 8, 11, 14, 17];
  for (const day of tiwiDays) {
    if (!tiwiStore) continue;
    const cin = new Date(2026, 8, day, 11, 0);
    const cout = new Date(2026, 8, day, 11, 45);
    visitRows.push({
      sales_id: budiSalesId,
      dealer_id: tiwiStore.id,
      check_in_time: cin.toISOString(),
      check_out_time: cout.toISOString(),
      unit_percentage: 90,
      owner_met: true,
      latitude: -2.533711,
      longitude: 140.718133,
      notes: 'Edukasi promo bundling aksesoris fast charging ke staf toko. Respons toko sangat positif.',
      earned_amount: valuePerVisit,
      status: 'COMPLETED',
      created_at: cin.toISOString(),
    });
  }

  // Dealer 3 (Toko Reza Cell): Kunjungan tanggal 4, 7, 10, 13, 16 Sept
  const rezaDays = [4, 7, 10, 13, 16];
  for (const day of rezaDays) {
    if (!rezaCell) continue;
    const cin = new Date(2026, 8, day, 14, 15);
    const cout = new Date(2026, 8, day, 15, 0);
    visitRows.push({
      sales_id: budiSalesId,
      dealer_id: rezaCell.id,
      check_in_time: cin.toISOString(),
      check_out_time: cout.toISOString(),
      unit_percentage: 88,
      owner_met: true,
      latitude: -4.545012,
      longitude: 136.879021,
      notes: 'Follow up pesanan PO baru. Pemilik toko melakukan pemesanan via aplikasi.',
      earned_amount: valuePerVisit,
      status: 'COMPLETED',
      created_at: cin.toISOString(),
    });
  }

  // Insert sequential (sorted by created_at)
  visitRows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let successCount = 0;
  for (const v of visitRows) {
    const { error: insErr } = await client.from('sales_visits').insert(v);
    if (insErr) {
      console.warn(`Visit on ${v.created_at.slice(0, 10)} err:`, insErr.message);
    } else {
      successCount++;
    }
  }

  console.log(`✅ Berhasil menyimpan ${successCount} dari ${visitRows.length} kunjungan toko terverifikasi!`);
}

seedVisitsSpaced();
