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

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { transport: MockWebSocket },
  });
}

async function runMasterSeed() {
  console.log('====================================================');
  console.log('🌟 MEMULAI PEMBUATAN MOCKUP DATA DEMO SALES TERLENGKAP');
  console.log('====================================================');

  const budiSalesId = '7a71d961-c18d-4a72-ba70-2d3866dff979';
  const ahmadSalesId = '67be0454-6ced-4632-8add-a5b0883d6624';

  // ----------------------------------------------------
  // TAHAP 1: EKSEKUSI SEBAGAI ADMIN
  // ----------------------------------------------------
  console.log('\n[1/3] Login sebagai Administrator (ditoapp@atomicmail.io)...');
  const adminClient = getClient();
  const { data: adminAuth, error: aErr } = await adminClient.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  if (aErr) throw new Error('Admin login failed: ' + aErr.message);
  console.log('✅ Admin login berhasil! ID:', adminAuth.user.id);

  // 1.1 Region Papua
  let { data: papuaRegion } = await adminClient
    .from('regions')
    .select('id, name')
    .eq('name', 'Papua')
    .single();

  if (!papuaRegion) {
    const { data: newReg } = await adminClient
      .from('regions')
      .insert({ code: 'PAP', name: 'Papua', manager_name: 'Dito', status: 'ACTIVE' })
      .select('id, name')
      .single();
    papuaRegion = newReg;
  }
  await adminClient
    .from('regions')
    .update({ assigned_sales_id: budiSalesId, coverage_status: 'COVERED' })
    .eq('id', papuaRegion.id);
  console.log('✅ Region Papua dikonfigurasi COVERED oleh Budi Pratama');

  // 1.2 Sales Budi Pratama (SPV) & Ahmad Fauzi (Sales Field)
  await adminClient
    .from('sales')
    .update({
      is_spv: true,
      spv_id: null,
      region_id: papuaRegion.id,
      base_salary: 5000000,
      daily_visit_target: 6,
      work_days_per_month: 26,
      direct_commission_pct: 1.0,
      team_bonus_pct: 0.25,
      balance: 3250000,
      status: 'ACTIVE',
    })
    .eq('id', budiSalesId);

  await adminClient
    .from('sales')
    .update({
      is_spv: false,
      spv_id: budiSalesId,
      region_id: papuaRegion.id,
      base_salary: 4500000,
      daily_visit_target: 6,
      work_days_per_month: 26,
      direct_commission_pct: 1.0,
      team_bonus_pct: 0.0,
      balance: 1450000,
      status: 'ACTIVE',
    })
    .eq('id', ahmadSalesId);
  console.log('✅ Budi Pratama (SPV) & Ahmad Fauzi (Sales Field) terkonfigurasi');

  // 1.3 Asosiasi Dealer / Toko Retail
  const { data: dealers } = await adminClient.from('dealers').select('id, store_name');
  const javaCell = dealers?.find(d => d.store_name?.includes('JAVA CELLULER'));
  const tiwiStore = dealers?.find(d => d.store_name?.includes('Tiwi'));
  const rezaCell = dealers?.find(d => d.store_name?.includes('Reza Cell'));
  const sinarAbadi = dealers?.find(d => d.store_name?.includes('Sinar Abadi'));

  if (javaCell) await adminClient.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion.id }).eq('id', javaCell.id);
  if (tiwiStore) await adminClient.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion.id }).eq('id', tiwiStore.id);
  if (rezaCell) await adminClient.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion.id }).eq('id', rezaCell.id);
  if (sinarAbadi) await adminClient.from('dealers').update({ sales_id: ahmadSalesId, region_id: papuaRegion.id }).eq('id', sinarAbadi.id);
  console.log('✅ Toko retail berhasil ditautkan ke sales binaan');

  // 1.4 Sales Targets (September 2026)
  const targetsPayload = [
    {
      sales_id: budiSalesId,
      spv_id: null,
      period_month: 'Sep',
      period_year: 2026,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: 58,
      visit_achievement_pct: 37.18,
      target_amount: 250000000,
      achieved_amount: 154500000,
      sales_achievement_pct: 61.80,
      is_spv_target: true,
      spv_direct_target_amount: 100000000,
      spv_direct_achieved_amount: 86000000,
      spv_team_target_amount: 150000000,
      spv_team_achieved_amount: 68500000,
      notes: 'Fokus penjualan display audio dan adaptor ke toko di area Timika & Jayapura.',
    },
    {
      sales_id: ahmadSalesId,
      spv_id: budiSalesId,
      period_month: 'Sep',
      period_year: 2026,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: 48,
      visit_achievement_pct: 30.77,
      target_amount: 120000000,
      achieved_amount: 68500000,
      sales_achievement_pct: 57.08,
      is_spv_target: false,
      notes: 'Tingkatkan kunjungan outlet baru.',
    },
  ];

  for (const tp of targetsPayload) {
    const { error: tErr } = await adminClient
      .from('sales_targets')
      .upsert(tp, { onConflict: 'sales_id,period_month,period_year' });
    if (tErr) console.warn('Target upsert warning:', tErr.message);
  }
  console.log('✅ Data Target & Pencapaian Sales & SPV September 2026 tersimpan');

  // 1.5 Sales Payrolls (Slip Gaji Resmi)
  const payrollsPayload = [
    {
      payroll_number: 'SLIP-2026-08-001',
      sales_id: budiSalesId,
      spv_id: null,
      period_month: 'Agustus',
      period_year: 2026,
      nominal_base_salary: 5000000,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: 154,
      visit_achievement_pct: 98.72,
      value_per_visit: 32051.28,
      earned_visit_salary: 4935897,
      target_sales_amount: 200000000,
      achieved_sales_amount: 224000000,
      sales_achievement_pct: 112.00,
      incentive_percentage: 1.0,
      earned_incentive_amount: 2240000,
      spv_direct_sales_amount: 110000000,
      spv_direct_sales_commission: 1100000,
      team_bonus_amount: 285000,
      other_bonus: 500000,
      bonus_notes: 'Reward Pencapaian Target >110%',
      deductions_amount: 0,
      net_salary: 9060897,
      status: 'PAID',
      payment_date: '2026-08-31',
      payment_method: 'BANK_TRANSFER',
    },
    {
      payroll_number: 'SLIP-2026-09-001',
      sales_id: budiSalesId,
      spv_id: null,
      period_month: 'September',
      period_year: 2026,
      nominal_base_salary: 5000000,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: 58,
      visit_achievement_pct: 37.18,
      value_per_visit: 32051.28,
      earned_visit_salary: 1858974,
      target_sales_amount: 250000000,
      achieved_sales_amount: 154500000,
      sales_achievement_pct: 61.80,
      incentive_percentage: 1.0,
      earned_incentive_amount: 1545000,
      spv_direct_sales_amount: 86000000,
      spv_direct_sales_commission: 860000,
      team_bonus_amount: 171250,
      other_bonus: 0,
      deductions_amount: 0,
      net_salary: 3575224,
      status: 'DRAFT',
      payment_method: 'BANK_TRANSFER',
    },
    {
      payroll_number: 'SLIP-2026-08-002',
      sales_id: ahmadSalesId,
      spv_id: budiSalesId,
      period_month: 'Agustus',
      period_year: 2026,
      nominal_base_salary: 4500000,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: 150,
      visit_achievement_pct: 96.15,
      value_per_visit: 28846.15,
      earned_visit_salary: 4326923,
      target_sales_amount: 100000000,
      achieved_sales_amount: 108000000,
      sales_achievement_pct: 108.00,
      incentive_percentage: 1.0,
      earned_incentive_amount: 1080000,
      net_salary: 5406923,
      status: 'PAID',
      payment_date: '2026-08-31',
      payment_method: 'BANK_TRANSFER',
    },
  ];

  for (const pr of payrollsPayload) {
    const { error: prErr } = await adminClient
      .from('sales_payrolls')
      .upsert(pr, { onConflict: 'sales_id,period_month,period_year' });
    if (prErr) console.warn('Payroll upsert warning:', prErr.message);
  }
  console.log('✅ Slip Gaji Resmi (Agustus PAID & September DRAFT) tersimpan');

  // ----------------------------------------------------
  // TAHAP 2: EKSEKUSI SEBAGAI SALES BUDI PRATAMA
  // ----------------------------------------------------
  console.log('\n[2/3] Login sebagai Sales Budi Pratama (088899997777@sales.b2b.app)...');
  const salesClient = getClient();
  const { data: budiAuth, error: bErr } = await salesClient.auth.signInWithPassword({
    email: '088899997777@sales.b2b.app',
    password: 'sales123',
  });
  if (bErr) throw new Error('Budi login failed: ' + bErr.message);
  console.log('✅ Budi Pratama login berhasil!');

  // 2.1 Presensi Harian (sales_attendance)
  const attendanceRows = [];
  for (let d = 1; d <= 18; d++) {
    const dt = new Date(2026, 8, d);
    if (dt.getDay() === 0) continue; // Minggu libur
    const dateStr = `2026-09-${String(d).padStart(2, '0')}`;
    const cin = new Date(2026, 8, d, 7, 50 + (d % 14)).toISOString();
    const cout = d === 18 ? new Date(2026, 8, d, 17, 30).toISOString() : new Date(2026, 8, d, 17, 10 + (d % 20)).toISOString();

    attendanceRows.push({
      sales_id: budiSalesId,
      attendance_date: dateStr,
      check_in_time: cin,
      check_out_time: cout,
      is_late: false,
      status: 'PRESENT',
    });
  }

  for (const att of attendanceRows) {
    await salesClient
      .from('sales_attendance')
      .upsert(att, { onConflict: 'sales_id,attendance_date' });
  }
  console.log(`✅ ${attendanceRows.length} Riwayat Presensi Harian September 2026 tersimpan`);

  // 2.2 Kunjungan Toko (sales_visits)
  const valuePerVisit = 32051.28;
  const visitStoreTargets = [
    { dealer: javaCell || tiwiStore, name: 'CV. JAVA CELLULER', lat: -4.557833, lng: 136.881533 },
    { dealer: tiwiStore || javaCell, name: 'Toko Tiwi Accessories', lat: -2.533711, lng: 140.718133 },
    { dealer: rezaCell || javaCell, name: 'Toko Reza Cell', lat: -4.545012, lng: 136.879021 },
  ];

  const visitRows = [];

  // 4 Kunjungan Hari ini (18 September 2026)
  const todayVisits = [
    { target: visitStoreTargets[0], h: 9, m: 15, dur: 45, unit: 95, note: 'Pengecekan display DAP audio mobil & adaptor di etalase depan. Display rapi dan promo banner terpasang.' },
    { target: visitStoreTargets[1], h: 11, m: 30, dur: 40, unit: 90, note: 'Edukasi promo bundling aksesoris fast charging ke staf toko. Respons toko sangat positif.' },
    { target: visitStoreTargets[2], h: 14, m: 10, dur: 50, unit: 88, note: 'Follow up pesanan PO baru. Pemilik toko melakukan pemesanan langsung melalui aplikasi.' },
    { target: visitStoreTargets[0], h: 16, m: 0, dur: 35, unit: 92, note: 'Monitoring stok sore hari dan input rekap penjualan harian outlet binaan.' },
  ];

  for (const tv of todayVisits) {
    if (!tv.target.dealer) continue;
    const cin = new Date(2026, 8, 18, tv.h, tv.m);
    const cout = new Date(cin.getTime() + tv.dur * 60000);
    visitRows.push({
      sales_id: budiSalesId,
      dealer_id: tv.target.dealer.id,
      check_in_time: cin.toISOString(),
      check_out_time: cout.toISOString(),
      unit_percentage: tv.unit,
      owner_met: true,
      latitude: tv.target.lat,
      longitude: tv.target.lng,
      notes: tv.note,
      earned_amount: valuePerVisit,
      status: 'COMPLETED',
      created_at: cin.toISOString(),
    });
  }

  // Hari-hari sebelumnya di bulan September (17, 16, 15, 14, 12, 11, 10, 9, 8, 7, 5, 4, 3, 2, 1)
  const pastDaysList = [17, 16, 15, 14, 12, 11, 10, 9, 8, 7, 5, 4, 3, 2, 1];
  for (const pDay of pastDaysList) {
    const visitsCount = 3 + (pDay % 3);
    for (let k = 0; k < visitsCount; k++) {
      const target = visitStoreTargets[k % visitStoreTargets.length];
      if (!target.dealer) continue;
      const h = 9 + k * 2;
      const cin = new Date(2026, 8, pDay, h, 15 + (k * 10));
      const cout = new Date(cin.getTime() + 40 * 60000);
      visitRows.push({
        sales_id: budiSalesId,
        dealer_id: target.dealer.id,
        check_in_time: cin.toISOString(),
        check_out_time: cout.toISOString(),
        unit_percentage: 80 + (k * 5),
        owner_met: true,
        latitude: target.lat,
        longitude: target.lng,
        notes: `Kunjungan kanvasing berkala dan verifikasi display DAP ke ${target.name}.`,
        earned_amount: valuePerVisit,
        status: 'COMPLETED',
        created_at: cin.toISOString(),
      });
    }
  }

  // Insert kunjungan
  const { error: vErr } = await salesClient.from('sales_visits').insert(visitRows);
  if (vErr) console.warn('Visits insert error:', vErr.message);
  else console.log(`✅ ${visitRows.length} Kunjungan Toko terverifikasi (COMPLETED) tersimpan`);

  // ----------------------------------------------------
  // TAHAP 3: EKSEKUSI SEBAGAI DEALER (PEMESANAN & KOMISI)
  // ----------------------------------------------------
  console.log('\n[3/3] Login sebagai Dealer Lie Sudito (08114991888@b2b-app.local)...');
  const dealerClient = getClient();
  const { data: dealerAuth, error: dErr } = await dealerClient.auth.signInWithPassword({
    email: '08114991888@b2b-app.local',
    password: 'dealer123',
  });
  if (dErr) throw new Error('Dealer login failed: ' + dErr.message);
  console.log('✅ Dealer login berhasil! ID:', dealerAuth.user.id);

  // List order realistis September 2026
  const ordersList = [
    {
      dealer: javaCell,
      order_number: 'ORD-20260918-001',
      total: 18500000,
      date: new Date(2026, 8, 18, 14, 35).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260918-002',
      total: 9200000,
      date: new Date(2026, 8, 18, 11, 45).toISOString(),
    },
    {
      dealer: rezaCell,
      order_number: 'ORD-20260917-003',
      total: 24000000,
      date: new Date(2026, 8, 17, 15, 20).toISOString(),
    },
    {
      dealer: javaCell,
      order_number: 'ORD-20260916-004',
      total: 14800000,
      date: new Date(2026, 8, 16, 10, 15).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260915-005',
      total: 32000000,
      date: new Date(2026, 8, 15, 16, 10).toISOString(),
    },
    {
      dealer: rezaCell,
      order_number: 'ORD-20260914-006',
      total: 11500000,
      date: new Date(2026, 8, 14, 13, 0).toISOString(),
    },
    {
      dealer: javaCell,
      order_number: 'ORD-20260911-007',
      total: 28000000,
      date: new Date(2026, 8, 11, 14, 40).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260908-008',
      total: 16500000,
      date: new Date(2026, 8, 8, 11, 25).toISOString(),
    },
  ];

  for (const o of ordersList) {
    if (!o.dealer) continue;
    const { error: ordErr } = await dealerClient.from('orders').upsert({
      order_number: o.order_number,
      dealer_id: o.dealer.id,
      sales_id: budiSalesId,
      total_amount: o.total,
      discount_amount: 0,
      final_amount: o.total,
      status: 'COMPLETED',
      created_at: o.date,
      payment_method: 'TRANSFER',
      payment_status: 'paid',
    }, { onConflict: 'order_number' });
    if (ordErr) console.warn('Order upsert warning:', ordErr.message);
  }
  console.log(`✅ ${ordersList.length} Transaksi Penjualan COMPLETED tersimpan dengan sales_id Budi Pratama`);

  console.log('\n====================================================');
  console.log('🎉 SELURUH MOCKUP DATA DEMO SALES BERHASIL DIBUAT!');
  console.log('====================================================');
}

runMasterSeed().catch(console.error);
