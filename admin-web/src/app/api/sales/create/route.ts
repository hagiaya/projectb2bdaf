import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Mock WebSocket for Node.js environments < v22
class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}

if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  (globalThis as any).WebSocket = MockWebSocket;
}

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

if (!SUPABASE_URL || SUPABASE_URL.includes('rbezcgrxokzhtslrxuta')) {
  SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
  SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
}

const normalizePhone = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  if (!digits.startsWith('0')) digits = '0' + digits;
  return digits;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name,
      phone_number,
      email,
      password,
      role = 'SALES',
      region_id,
      spv_id,
      base_salary = 4500000,
      direct_commission_pct = 1.0,
      team_bonus_pct = 0.25,
      transport_allowance = 500000,
      daily_visit_target = 6,
      work_days_per_month = 26,
    } = body;

    if (!full_name || !phone_number || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, nomor HP, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone_number);
    const roleUpper = role === 'SPV' ? 'SPV' : 'SALES';
    const isSpv = roleUpper === 'SPV';

    // Format login email
    const finalEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : `${cleanPhone}@sales.b2b.app`;

    // Isolated Supabase client with no session persistence
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Strategy 1: Call RPC admin_create_sales_account
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_create_sales_account', {
        p_full_name: full_name.trim(),
        p_phone_number: cleanPhone,
        p_email: finalEmail,
        p_password: password,
        p_role: roleUpper,
        p_region_id: region_id || null,
        p_spv_id: isSpv ? null : (spv_id || null),
        p_base_salary: isSpv ? 0 : Number(base_salary) || 0,
        p_direct_commission_pct: Number(direct_commission_pct) || 0,
        p_team_bonus_pct: Number(team_bonus_pct) || 0,
        p_transport_allowance: isSpv ? 0 : Number(transport_allowance) || 0,
        p_daily_visit_target: isSpv ? 0 : Number(daily_visit_target) || 6,
        p_work_days_per_month: isSpv ? 0 : Number(work_days_per_month) || 26,
      });

      if (!rpcErr && rpcRes) {
        if (rpcRes.success) {
          return NextResponse.json({
            success: true,
            user_id: rpcRes.user_id,
            sales_id: rpcRes.sales_id,
            message: `Akun ${isSpv ? 'Supervisor (SPV)' : 'Sales Lapangan'} "${full_name}" berhasil didaftarkan.`,
          });
        } else if (rpcRes.error) {
          if (rpcRes.error.toLowerCase().includes('transport_allowance')) {
            return NextResponse.json(
              {
                error: 'Kolom transport_allowance belum ada di tabel sales. Jalankan file SQL "create_admin_sales_function.sql" di Supabase SQL Editor.',
                requires_sql: true,
              },
              { status: 400 }
            );
          }
          return NextResponse.json({ error: rpcRes.error }, { status: 400 });
        }
      }
    } catch (e) {
      console.warn('RPC admin_create_sales_account call error:', e);
    }

    // Strategy 2: Fallback via Supabase Auth signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: finalEmail,
      password: password,
      options: {
        data: {
          role: roleUpper,
          full_name: full_name.trim(),
          phone_number: cleanPhone,
        },
      },
    });

    if (authError) {
      // If hit Supabase email rate limit
      if (authError.message.includes('rate limit') || (authError as any).status === 429) {
        return NextResponse.json(
          {
            error: 'Batas pengiriman email Supabase tercapai (Rate Limit). Jalankan fungsi SQL "create_admin_sales_function.sql" di Supabase SQL Editor agar pembuatan akun instan tanpa limitasi email.',
            code: 'RATE_LIMIT_EXCEEDED',
            requires_sql: true,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData?.user?.id;
    if (!newUserId) {
      return NextResponse.json({ error: 'Gagal membuat akun authentication di Supabase.' }, { status: 500 });
    }

    // Ensure Profile is approved and set with correct role
    await supabase
      .from('profiles')
      .update({
        role: roleUpper,
        full_name: full_name.trim(),
        phone_number: cleanPhone,
        approval_status: 'APPROVED',
      })
      .eq('id', newUserId);

    // Update or insert into sales table safely without relying on ON CONFLICT
    const salesPayload: any = {
      profile_id: newUserId,
      region_id: region_id || null,
      spv_id: isSpv ? null : (spv_id || null),
      status: 'ACTIVE',
      is_spv: isSpv,
      base_salary: isSpv ? 0 : Number(base_salary) || 0,
      direct_commission_pct: Number(direct_commission_pct) || 0,
      team_bonus_pct: Number(team_bonus_pct) || 0,
      daily_visit_target: isSpv ? 0 : Number(daily_visit_target) || 6,
      work_days_per_month: isSpv ? 0 : Number(work_days_per_month) || 26,
      balance: 0,
    };

    const { data: existingSales } = await supabase
      .from('sales')
      .select('id')
      .eq('profile_id', newUserId)
      .maybeSingle();

    if (existingSales?.id) {
      let { error: updateErr } = await supabase
        .from('sales')
        .update({ ...salesPayload, transport_allowance: isSpv ? 0 : Number(transport_allowance) || 0 })
        .eq('id', existingSales.id);

      if (updateErr && updateErr.message.toLowerCase().includes('transport_allowance')) {
        await supabase.from('sales').update(salesPayload).eq('id', existingSales.id);
      }
    } else {
      let { error: insertErr } = await supabase
        .from('sales')
        .insert({ ...salesPayload, transport_allowance: isSpv ? 0 : Number(transport_allowance) || 0 });

      if (insertErr && insertErr.message.toLowerCase().includes('transport_allowance')) {
        await supabase.from('sales').insert(salesPayload);
      }
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      email: finalEmail,
      message: `Akun ${isSpv ? 'Supervisor (SPV)' : 'Sales Lapangan'} "${full_name}" berhasil didaftarkan.`,
    });
  } catch (err: any) {
    console.error('Create sales error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server saat membuat akun.' },
      { status: 500 }
    );
  }
}
