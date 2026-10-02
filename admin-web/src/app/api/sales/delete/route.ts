import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sales_id, profile_id } = body;

    if (!sales_id) {
      return NextResponse.json({ error: 'Sales ID wajib diberikan' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Unassign from dealers for all duplicate sales records of this profile
    await supabase.from('dealers').update({ sales_id: null }).eq('sales_id', sales_id);

    // 2. Unassign any child sales if this was an SPV
    await supabase.from('sales').update({ spv_id: null }).eq('spv_id', sales_id);

    // 3. Delete ALL duplicate sales records for this profile
    const { data: deletedSales, error: deleteErr } = await supabase.from('sales').delete().eq('profile_id', profile_id).select();

    if (deleteErr) {
      if (deleteErr.message.includes('foreign key constraint') || deleteErr.code === '23503') {
        // Set all duplicate records to INACTIVE
        await supabase.from('sales').update({ status: 'INACTIVE' }).eq('profile_id', profile_id);
        
        // Mark profile as REJECTED so it cannot log in and auto-heal won't recreate it
        await supabase.from('profiles').update({ approval_status: 'REJECTED' }).eq('id', profile_id);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Akun sales berhasil dihapus.' 
        });
      }
      throw deleteErr;
    }

    if (!deletedSales || deletedSales.length === 0) {
      throw new Error('Gagal menghapus sales (Mungkin ditolak oleh hak akses / RLS).');
    }

    // 4. Mark profile as REJECTED so auto-heal won't recreate it
    await supabase.from('profiles').update({ approval_status: 'REJECTED' }).eq('id', profile_id);

    return NextResponse.json({ success: true, message: 'Akun sales berhasil dihapus' });
  } catch (err: any) {
    console.error('Delete sales error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menghapus sales' }, { status: 500 });
  }
}
