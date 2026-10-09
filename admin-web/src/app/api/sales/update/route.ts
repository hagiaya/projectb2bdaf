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
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, full_name, phone_number, password } = body;

    if (!profile_id) {
      return NextResponse.json({ error: 'Profile ID tidak ditemukan.' }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service Role Key tidak tersedia. Tidak dapat mengupdate password.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Update nama & nomor telepon di tabel profiles
    let updateData: any = {};
    if (full_name) updateData.full_name = full_name.trim();
    if (phone_number) {
      let digits = phone_number.replace(/\D/g, '');
      if (digits.startsWith('62')) digits = '0' + digits.slice(2);
      if (!digits.startsWith('0')) digits = '0' + digits;
      updateData.phone_number = digits;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', profile_id);

      if (profileError) throw profileError;
    }

    // 2. Update password & email di Supabase Auth
    let authUpdateData: any = {};
    if (password && password.trim() !== '') {
      authUpdateData.password = password.trim();
    }
    if (updateData.phone_number) {
      authUpdateData.email = `${updateData.phone_number}@sales.b2b.app`;
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile_id, authUpdateData);
      if (authError) throw authError;
    }

    return NextResponse.json({
      success: true,
      message: 'Data personil berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('Update sales error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server saat memperbarui akun.' },
      { status: 500 }
    );
  }
}
