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

async function seedData() {
  console.log('🚀 Mulai pembuatan Mockup Data Demo Sales...');

  // 1. Dapatkan Region Papua
  let { data: papuaRegion } = await supabase
    .from('regions')
    .select('id, name')
    .eq('name', 'Papua')
    .single();

  if (!papuaRegion) {
    const { data: newReg, error: rErr } = await supabase
      .from('regions')
      .insert({ code: 'PAP', name: 'Papua', manager_name: 'Dito', status: 'ACTIVE' })
      .select('id, name')
      .single();
    if (rErr) console.error('Error insert region:', rErr);
    papuaRegion = newReg;
  }
  console.log('✅ Region Papua:', papuaRegion?.id);

  // 2. Setup Sales Budi Pratama (Supervisor) & Ahmad Fauzi (Sales Field)
  const budiSalesId = '7a71d961-c18d-4a72-ba70-2d3866dff979';
  const ahmadSalesId = '67be0454-6ced-4632-8add-a5b0883d6624';

  // Update Budi Pratama sebagai SPV
  const { error: budiErr } = await supabase
    .from('sales')
    .update({
      is_spv: true,
      spv_id: null,
      region_id: papuaRegion?.id,
      base_salary: 5000000,
      daily_visit_target: 6,
      work_days_per_month: 26,
      direct_commission_pct: 1.0,
      team_bonus_pct: 0.25,
      balance: 2850000,
      status: 'ACTIVE',
    })
    .eq('id', budiSalesId);
  if (budiErr) console.error('Update Budi error:', budiErr);
  else console.log('✅ Budi Pratama dikonfigurasi sebagai Sales Supervisor (SPV)');

  // Update Region Papua assigned to Budi Pratama
  await supabase.from('regions').update({ assigned_sales_id: budiSalesId, coverage_status: 'COVERED' }).eq('id', papuaRegion.id);

  // Update Ahmad Fauzi bawahan Budi Pratama
  const { error: ahmadErr } = await supabase
    .from('sales')
    .update({
      is_spv: false,
      spv_id: budiSalesId,
      region_id: papuaRegion?.id,
      base_salary: 4500000,
      daily_visit_target: 6,
      work_days_per_month: 26,
      direct_commission_pct: 1.0,
      team_bonus_pct: 0.0,
      balance: 1450000,
      status: 'ACTIVE',
    })
    .eq('id', ahmadSalesId);
  if (ahmadErr) console.error('Update Ahmad error:', ahmadErr);
  else console.log('✅ Ahmad Fauzi dikonfigurasi sebagai Sales Field (Bawahan Budi)');

  // 3. Pastikan Toko/Dealer terhubung ke Sales
  // Dapatkan dealers yang ada
  const { data: dealers } = await supabase.from('dealers').select('id, store_name');
  console.log('Dealers available:', dealers?.length);

  const javaCell = dealers?.find(d => d.store_name?.includes('JAVA CELLULER'));
  const tiwiStore = dealers?.find(d => d.store_name?.includes('Tiwi'));
  const sinarAbadi = dealers?.find(d => d.store_name?.includes('Sinar Abadi'));
  const rezaCell = dealers?.find(d => d.store_name?.includes('Reza Cell'));

  if (javaCell) {
    await supabase.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion?.id }).eq('id', javaCell.id);
  }
  if (tiwiStore) {
    await supabase.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion?.id }).eq('id', tiwiStore.id);
  }
  if (rezaCell) {
    await supabase.from('dealers').update({ sales_id: budiSalesId, region_id: papuaRegion?.id }).eq('id', rezaCell.id);
  }
  if (sinarAbadi) {
    await supabase.from('dealers').update({ sales_id: ahmadSalesId, region_id: papuaRegion?.id }).eq('id', sinarAbadi.id);
  }
  console.log('✅ Toko retail berhasil di-assign ke Sales Budi & Ahmad');

  // 4. Seed Presensi Harian (sales_attendance) untuk Budi Pratama
  // Tanggal 1 s/d 18 September 2026
  console.log('📅 Menyiapkan data Presensi Harian...');
  const attendanceRecords = [];
  for (let day = 1; day <= 18; day++) {
    // Lewatkan hari Minggu (contoh kalender 2026: Sept 6, 13)
    const dateObj = new Date(2026, 8, day); // month is 0-indexed (8 = Sept)
    if (dateObj.getDay() === 0) continue; // skip Sunday

    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
    const checkIn = new Date(2026, 8, day, 7, 50 + (day % 15)).toISOString();
    const checkOut = day === 18 ? new Date(2026, 8, day, 17, 30).toISOString() : new Date(2026, 8, day, 17, 10 + (day % 20)).toISOString();

    attendanceRecords.push({
      sales_id: budiSalesId,
      attendance_date: dateStr,
      check_in_time: checkIn,
      check_out_time: checkOut,
      is_late: false,
      status: 'PRESENT',
    });
  }

  // Upsert attendance records
  for (const att of attendanceRecords) {
    const { error: attErr } = await supabase
      .from('sales_attendance')
      .upsert(att, { onConflict: 'sales_id,attendance_date' });
    if (attErr) console.warn('Attendance upsert warning:', attErr.message);
  }
  console.log(`✅ ${attendanceRecords.length} Catatan Presensi September 2026 berhasil dibuat`);

  // 5. Seed Kunjungan Toko (sales_visits)
  console.log('📍 Menyiapkan data Kunjungan Toko...');
  const visitRecords = [];
  const valuePerVisit = Math.round(5000000 / (6 * 26)); // ~32.051 per visit

  const dealerTargets = [
    { dealer: javaCell || tiwiStore, name: 'CV. JAVA CELLULER', lat: -4.5578, lng: 136.8815 },
    { dealer: tiwiStore || javaCell, name: 'Toko Tiwi Accessories', lat: -2.5337, lng: 140.7181 },
    { dealer: rezaCell || javaCell, name: 'Toko Reza Cell', lat: -4.5450, lng: 136.8790 },
  ];

  // 18 September 2026 (Hari ini) - 4 Kunjungan
  const visitsToday = [
    {
      dealer: dealerTargets[0].dealer,
      hour: 9, min: 15, duration: 45,
      notes: 'Display produk DAP audio & adaptor terpasang rapi di rak depan. Stok kabel Type-C menipis.',
      unit: 95,
    },
    {
      dealer: dealerTargets[1].dealer,
      hour: 11, min: 30, duration: 40,
      notes: 'Pengecekan promo bundling aksesoris. Toko antusias mengambil paket grosir.',
      unit: 90,
    },
    {
      dealer: dealerTargets[2].dealer,
      hour: 14, min: 10, duration: 50,
      notes: 'Follow up pesanan PO baru. Pemilik toko melakukan pemesanan langsung melalui aplikasi.',
      unit: 85,
    },
    {
      dealer: dealerTargets[0].dealer,
      hour: 16, min: 0, duration: 35,
      notes: 'Verifikasi stok fisik dan rekap hasil penjualan harian toko mitra.',
      unit: 92,
    },
  ];

  for (let i = 0; i < visitsToday.length; i++) {
    const v = visitsToday[i];
    if (!v.dealer) continue;
    const cin = new Date(2026, 8, 18, v.hour, v.min);
    const cout = new Date(cin.getTime() + v.duration * 60000);
    visitRecords.push({
      sales_id: budiSalesId,
      dealer_id: v.dealer.id,
      check_in_time: cin.toISOString(),
      check_out_time: cout.toISOString(),
      unit_percentage: v.unit,
      owner_met: true,
      latitude: -4.557833,
      longitude: 136.881533,
      notes: v.notes,
      earned_amount: valuePerVisit,
      status: 'COMPLETED',
      created_at: cin.toISOString(),
    });
  }

  // Hari-hari sebelumnya di bulan September (17, 16, 15, 12, 11, 10, dll)
  const pastDays = [17, 16, 15, 14, 12, 11, 10, 9, 8, 7, 5, 4, 3, 2, 1];
  for (const pDay of pastDays) {
    const visitsPerDay = 3 + (pDay % 3);
    for (let k = 0; k < visitsPerDay; k++) {
      const target = dealerTargets[k % dealerTargets.length];
      if (!target.dealer) continue;
      const hour = 9 + k * 2;
      const cin = new Date(2026, 8, pDay, hour, 15 + (k * 10));
      const cout = new Date(cin.getTime() + 40 * 60000);
      visitRecords.push({
        sales_id: budiSalesId,
        dealer_id: target.dealer.id,
        check_in_time: cin.toISOString(),
        check_out_time: cout.toISOString(),
        unit_percentage: 80 + (k * 5),
        owner_met: true,
        latitude: target.lat,
        longitude: target.lng,
        notes: `Kunjungan kanvasing dan monitoring etalase DAP ke ${target.name}.`,
        earned_amount: valuePerVisit,
        status: 'COMPLETED',
        created_at: cin.toISOString(),
      });
    }
  }

  // Hapus kunjungan lama demo bila perlu atau langsung insert
  const { error: visitErr } = await supabase.from('sales_visits').insert(visitRecords);
  if (visitErr) console.warn('Visits insert error:', visitErr.message);
  else console.log(`✅ ${visitRecords.length} Kunjungan Toko terverifikasi berhasil disimpan`);

  // 6. Seed Transaksi Penjualan (orders)
  console.log('🛍️ Menyiapkan data Transaksi Penjualan & Komisi...');
  const orderList = [
    {
      dealer: javaCell,
      order_number: 'ORD-20260918-001',
      total: 18500000,
      final: 18500000,
      date: new Date(2026, 8, 18, 14, 35).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260918-002',
      total: 9200000,
      final: 9200000,
      date: new Date(2026, 8, 18, 11, 45).toISOString(),
    },
    {
      dealer: rezaCell,
      order_number: 'ORD-20260917-003',
      total: 24000000,
      final: 24000000,
      date: new Date(2026, 8, 17, 15, 20).toISOString(),
    },
    {
      dealer: javaCell,
      order_number: 'ORD-20260916-004',
      total: 14800000,
      final: 14800000,
      date: new Date(2026, 8, 16, 10, 15).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260915-005',
      total: 32000000,
      final: 32000000,
      date: new Date(2026, 8, 15, 16, 10).toISOString(),
    },
    {
      dealer: rezaCell,
      order_number: 'ORD-20260914-006',
      total: 11500000,
      final: 11500000,
      date: new Date(2026, 8, 14, 13, 0).toISOString(),
    },
    {
      dealer: javaCell,
      order_number: 'ORD-20260911-007',
      total: 28000000,
      final: 28000000,
      date: new Date(2026, 8, 11, 14, 40).toISOString(),
    },
    {
      dealer: tiwiStore,
      order_number: 'ORD-20260908-008',
      total: 16500000,
      final: 16500000,
      date: new Date(2026, 8, 8, 11, 25).toISOString(),
    },
  ];

  for (const ord of orderList) {
    if (!ord.dealer) continue;
    const { error: oErr } = await supabase.from('orders').upsert({
      order_number: ord.order_number,
      dealer_id: ord.dealer.id,
      sales_id: budiSalesId,
      total_amount: ord.total,
      discount_amount: 0,
      final_amount: ord.final,
      status: 'COMPLETED',
      created_at: ord.date,
    }, { onConflict: 'order_number' });
    if (oErr) console.warn('Order upsert warning:', oErr.message);
  }
  console.log(`✅ ${orderList.length} Order Penjualan dengan status COMPLETED berhasil dibuat`);

  // 7. Seed Target Penjualan & Kunjungan (sales_targets)
  console.log('🎯 Menyiapkan Target Sales September 2026...');
  // Total visits dibuat tadi: visitsToday.length + 15 * ~3.5 = ~55 visits
  const totalVisitsCount = visitRecords.length;
  const totalSalesAmount = orderList.reduce((acc, curr) => acc + curr.final, 0);

  const targetsPayload = [
    {
      sales_id: budiSalesId,
      spv_id: null,
      period_month: 'September',
      period_year: 2026,
      daily_visit_target: 6,
      work_days: 26,
      target_visits: 156,
      achieved_visits: totalVisitsCount,
      visit_achievement_pct: Number(((totalVisitsCount / 156) * 100).toFixed(2)),
      target_amount: 250000000,
      achieved_amount: totalSalesAmount,
      sales_achievement_pct: Number(((totalSalesAmount / 250000000) * 100).toFixed(2)),
      is_spv_target: true,
      spv_direct_target_amount: 100000000,
      spv_direct_achieved_amount: totalSalesAmount,
      spv_team_target_amount: 150000000,
      spv_team_achieved_amount: 68500000,
      notes: 'Fokus penetrasi outlet Timika dan Jayapura. Tingkatkan display visual DAP.',
    },
    {
      sales_id: ahmadSalesId,
      spv_id: budiSalesId,
      period_month: 'September',
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
      notes: 'Tingkatkan kunjungan toko daerah pesisir.',
    }
  ];

  for (const tp of targetsPayload) {
    const { error: tErr } = await supabase
      .from('sales_targets')
      .upsert(tp, { onConflict: 'sales_id,period_month,period_year' });
    if (tErr) console.warn('Target upsert warning:', tErr.message);
  }
  console.log('✅ Target Sales & SPV September 2026 berhasil disimpan');

  // 8. Seed Slip Gaji Resmi (sales_payrolls)
  console.log('💵 Menyiapkan Slip Gaji Sales...');
  const payrollsPayload = [
    // Slip Gaji Resmi Agustus 2026 (SUDAH DIBAYAR / PAID)
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
      bonus_notes: 'Reward Target Melampaui 110%',
      deductions_amount: 0,
      deduction_notes: '',
      net_salary: 9060897,
      status: 'PAID',
      payment_date: '2026-08-31',
      payment_method: 'BANK_TRANSFER',
    },
    // Slip Gaji Berjalan September 2026 (DRAFT)
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
      achieved_visits: totalVisitsCount,
      visit_achievement_pct: Number(((totalVisitsCount / 156) * 100).toFixed(2)),
      value_per_visit: 32051.28,
      earned_visit_salary: Math.round(totalVisitsCount * 32051.28),
      target_sales_amount: 250000000,
      achieved_sales_amount: totalSalesAmount,
      sales_achievement_pct: Number(((totalSalesAmount / 250000000) * 100).toFixed(2)),
      incentive_percentage: 1.0,
      earned_incentive_amount: Math.round(totalSalesAmount * 0.01),
      spv_direct_sales_amount: totalSalesAmount,
      spv_direct_sales_commission: Math.round(totalSalesAmount * 0.01),
      team_bonus_amount: Math.round(68500000 * 0.0025),
      other_bonus: 0,
      deductions_amount: 0,
      net_salary: Math.round((totalVisitsCount * 32051.28) + (totalSalesAmount * 0.01) + (68500000 * 0.0025)),
      status: 'DRAFT',
      payment_method: 'BANK_TRANSFER',
    },
    // Slip Gaji Agustus 2026 untuk Ahmad Fauzi
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
    }
  ];

  for (const pr of payrollsPayload) {
    const { error: prErr } = await supabase
      .from('sales_payrolls')
      .upsert(pr, { onConflict: 'sales_id,period_month,period_year' });
    if (prErr) console.warn('Payroll upsert warning:', prErr.message);
  }
  console.log('✅ Slip Gaji Resmi berhasil dibuat');

  console.log('🎉 SEMUA MOCKUP DATA DEMO SALES BERHASIL DISIAPKAN!');
}

seedData();
