import { NextRequest, NextResponse } from 'next/server';

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

if (!SUPABASE_URL || SUPABASE_URL.includes('rbezcgrxokzhtslrxuta')) {
  SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
  SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await authRes.json();

    if (!authRes.ok) {
      const msg = data.error_description || data.msg || data.message || 'Email atau password salah.';
      return NextResponse.json({ error: msg }, { status: authRes.status });
    }

    return NextResponse.json({
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      },
      user: data.user,
    });
  } catch (err: any) {
    console.error('Server login proxy error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server login.' },
      { status: 500 }
    );
  }
}
