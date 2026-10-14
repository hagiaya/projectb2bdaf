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
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      store_name,
      full_name,
      phone_number,
      password,
      email,
      region_id,
      sales_id,
      address,
      ktp_url,
      npwp_url,
      credit_limit = 0,
      is_credit_eligible = false,
      credit_term_days = 15,
      is_special_dealer = false,
      special_dealer_tier = 'VIP',
      special_discount_percentage = 0,
    } = body;

    if (!store_name || !store_name.trim()) {
      return NextResponse.json({ error: 'Nama toko wajib diisi.' }, { status: 400 });
    }
    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Nama pemilik / owner wajib diisi.' }, { status: 400 });
    }
    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ error: 'Nomor HP / WhatsApp pemilik wajib diisi.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }
    if (!region_id) {
      return NextResponse.json({ error: 'Provinsi / Wilayah wajib dipilih.' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone_number);
    const finalEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : `${cleanPhone}@b2b-app.local`;

    // Client Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Check if phone number already belongs to another profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, role')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existingProfile) {
      // Check if already has a dealer
      const { data: existingDealer } = await supabase
        .from('dealers')
        .select('id, store_name')
        .eq('profile_id', existingProfile.id)
        .maybeSingle();

      if (existingDealer) {
        return NextResponse.json(
          { error: `Nomor HP ${cleanPhone} sudah terdaftar untuk toko "${existingDealer.store_name}" (Pemilik: ${existingProfile.full_name}).` },
          { status: 400 }
        );
      }
    }

    let newUserId = existingProfile?.id;

    // STRATEGY 1: Call RPC admin_create_dealer_account if exists
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_create_dealer_account', {
        p_store_name: store_name.trim(),
        p_owner_name: full_name.trim(),
        p_phone_number: cleanPhone,
        p_email: finalEmail,
        p_password: password,
        p_region_id: region_id,
        p_sales_id: sales_id || null,
        p_address: address ? address.trim() : '',
        p_ktp_url: ktp_url || null,
        p_npwp_url: npwp_url || null,
        p_credit_limit: Number(credit_limit) || 0,
        p_is_credit_eligible: !!is_credit_eligible,
        p_credit_term_days: Number(credit_term_days) || 15,
        p_is_special_dealer: !!is_special_dealer,
        p_special_tier: is_special_dealer ? (special_dealer_tier || 'VIP') : 'REGULAR',
        p_special_discount: is_special_dealer ? (Number(special_discount_percentage) || 0) : 0,
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        // Fetch complete joined dealer record for frontend state
        const { data: joinedDealer } = await supabase
          .from('dealers')
          .select('*, profiles(full_name, approval_status, phone_number, ktp_url, npwp_url, store_photo_url), regions(name), sales(id, profiles(full_name))')
          .eq('id', rpcRes.dealer_id)
          .single();

        return NextResponse.json({
          success: true,
          dealer: joinedDealer,
          user_id: rpcRes.user_id,
          message: `Dealer "${store_name}" berhasil didaftarkan.`,
        });
      }
    } catch (e) {
      console.warn('RPC admin_create_dealer_account not available or failed, falling back:', e);
    }

    // STRATEGY 2: Fallback via Supabase Auth signUp
    if (!newUserId) {
      // If service role is available, we can use admin.createUser to bypass confirmation
      if (SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            role: 'DEALER',
            full_name: full_name.trim(),
            phone_number: cleanPhone,
          }
        });
        if (!adminErr && adminUser?.user?.id) {
          newUserId = adminUser.user.id;
        }
      }

      if (!newUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: finalEmail,
          password: password,
          options: {
            data: {
              role: 'DEALER',
              full_name: full_name.trim(),
              phone_number: cleanPhone,
            },
          },
        });

        if (authError) {
          if (authError.message.includes('rate limit') || (authError as any).status === 429) {
            return NextResponse.json(
              {
                error: 'Batas pendaftaran auth tercapai (Rate Limit). Jalankan file "create_admin_dealer_function.sql" di Supabase SQL Editor.',
                code: 'RATE_LIMIT_EXCEEDED',
                requires_sql: true,
              },
              { status: 429 }
            );
          }
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        newUserId = authData?.user?.id;
      }
    }

    if (!newUserId) {
      return NextResponse.json({ error: 'Gagal membuat akun authentication di Supabase.' }, { status: 500 });
    }

    // Upsert Profile
    const profilePayload: any = {
      id: newUserId,
      role: 'DEALER',
      full_name: full_name.trim(),
      phone_number: cleanPhone,
      company_name: store_name.trim(),
      address: address ? address.trim() : '',
      approval_status: 'APPROVED',
      created_at: new Date().toISOString(),
    };
    if (ktp_url) profilePayload.ktp_url = ktp_url;
    if (npwp_url) profilePayload.npwp_url = npwp_url;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload);

    if (profileError) {
      console.error('Failed to upsert profile:', profileError);
    }

    // Insert into Dealers
    const parsedLimit = Number(credit_limit) || 0;
    const dealerPayload: any = {
      profile_id: newUserId,
      store_name: store_name.trim(),
      region_id: region_id,
      address: address ? address.trim() : '',
      credit_limit: is_credit_eligible ? parsedLimit : 0,
      is_credit_eligible: !!is_credit_eligible,
      credit_status: is_credit_eligible ? 'ACTIVE' : 'DISABLED',
      credit_term_days: parseInt(String(credit_term_days), 10) || 15,
      is_special_dealer: !!is_special_dealer,
      special_dealer_tier: is_special_dealer ? (special_dealer_tier || 'VIP') : 'REGULAR',
      special_discount_percentage: is_special_dealer ? (Number(special_discount_percentage) || 0) : 0,
      status: 'ACTIVE',
    };
    if (sales_id) dealerPayload.sales_id = sales_id;

    let { data: newDealer, error: dealerErr } = await supabase
      .from('dealers')
      .insert([dealerPayload])
      .select('*, profiles(full_name, approval_status, phone_number, ktp_url, npwp_url, store_photo_url), regions(name), sales(id, profiles(full_name))')
      .single();

    // Fallback if schema lacks newer columns
    if (dealerErr && (dealerErr.message?.includes('is_credit_eligible') || dealerErr.message?.includes('is_special_dealer') || dealerErr.code === '42703')) {
      delete dealerPayload.is_credit_eligible;
      delete dealerPayload.credit_status;
      delete dealerPayload.credit_term_days;
      delete dealerPayload.is_special_dealer;
      delete dealerPayload.special_dealer_tier;
      delete dealerPayload.special_discount_percentage;

      const fb = await supabase
        .from('dealers')
        .insert([dealerPayload])
        .select('*, profiles(full_name, approval_status, phone_number, ktp_url, npwp_url, store_photo_url), regions(name), sales(id, profiles(full_name))')
        .single();
      newDealer = fb.data;
      dealerErr = fb.error;
    }

    if (dealerErr || !newDealer) {
      return NextResponse.json({ error: dealerErr?.message || 'Gagal menyimpan data dealer.' }, { status: 400 });
    }

    // Insert initial credit limit log if credit limit was set
    if (is_credit_eligible && parsedLimit > 0) {
      try {
        await supabase.from('credit_limit_logs').insert([{
          dealer_id: newDealer.id,
          action: 'SET',
          amount_changed: parsedLimit,
          previous_limit: 0,
          current_limit: parsedLimit,
          notes: `Plafon awal Rp ${parsedLimit.toLocaleString('id-ID')} (Termin ${credit_term_days} Hari) saat pendaftaran manual`,
          changed_by: 'Admin Panel',
        }]);
      } catch (logErr) {
        console.warn('Initial credit limit log error:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      dealer: newDealer,
      user_id: newUserId,
      email: finalEmail,
      message: `Akun & Toko Dealer "${store_name}" berhasil didaftarkan.`,
    });
  } catch (err: any) {
    console.error('Create dealer error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server saat mendaftarkan dealer.' },
      { status: 500 }
    );
  }
}
