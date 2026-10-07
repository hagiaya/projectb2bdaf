import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, email, password } = body;

    if (!profile_id) {
      return NextResponse.json({ error: 'Profile ID tidak ditemukan.' }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service Role Key tidak tersedia. Tidak dapat mengupdate kredensial.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let updatePayload: any = {};
    if (email && email.trim() !== '') {
      updatePayload.email = email.trim();
    }
    if (password && password.trim() !== '') {
      updatePayload.password = password.trim();
    }

    if (Object.keys(updatePayload).length > 0) {
      // 1. Update auth.users di Supabase
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile_id, updatePayload);
      if (authError) {
        throw authError;
      }
      
      // 2. Jika email diubah, kita juga simpan di tabel dealers sebagai referensi
      if (updatePayload.email) {
        await supabaseAdmin.from('dealers').update({ email: updatePayload.email }).eq('profile_id', profile_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kredensial login dealer berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('Update dealer credentials error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server saat memperbarui kredensial.' },
      { status: 500 }
    );
  }
}
