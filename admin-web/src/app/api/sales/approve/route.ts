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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sales_id, profile_id, status = 'ACTIVE', is_spv = false } = body;

    if (!sales_id && !profile_id) {
      return NextResponse.json({ error: 'ID personil diperlukan.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const targetRole = is_spv ? 'SPV' : 'SALES';
    const targetApprovalStatus = status === 'ACTIVE' ? 'APPROVED' : 'PENDING';

    // Strategy 1: Try calling RPC admin_approve_sales_account
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_approve_sales_account', {
        p_sales_id: sales_id && !sales_id.startsWith('unlinked-') ? sales_id : null,
        p_profile_id: profile_id || null,
        p_status: status,
        p_role: targetRole,
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return NextResponse.json({ success: true, message: 'Status berhasil diperbarui via RPC.' });
      }
    } catch {
      // Fallback to direct table updates below
    }

    // Strategy 2: Direct update on sales table
    if (sales_id && !sales_id.startsWith('unlinked-')) {
      await supabase.from('sales').update({ status }).eq('id', sales_id);
    }

    if (profile_id) {
      // Also update any sales record matching this profile_id
      await supabase.from('sales').update({ status }).eq('profile_id', profile_id);

      // Update profiles approval_status and role
      await supabase.from('profiles').update({
        approval_status: targetApprovalStatus,
        role: targetRole,
      }).eq('id', profile_id);
    }

    return NextResponse.json({
      success: true,
      message: `Akun personil berhasil diubah menjadi ${status}.`,
    });
  } catch (err: any) {
    console.error('Error approving sales:', err);
    return NextResponse.json({ error: err.message || 'Gagal memperbarui status.' }, { status: 500 });
  }
}
