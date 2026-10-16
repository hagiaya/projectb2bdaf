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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getAdminClient() {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    const { error: signInErr } = await client.auth.signInWithPassword({
      email: 'ditoapp@atomicmail.io',
      password: 'admin123',
    });
    if (signInErr) {
      console.warn('Sign-in as fallback admin failed in programs API:', signInErr);
    }
  }

  return client;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: Fetch all programs & participants with administrative bypass of RLS
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = await getAdminClient();

    // 1. Fetch programs
    const { data: progData, error: progErr } = await supabaseAdmin
      .from('dealer_programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (progErr) {
      console.error('Error fetching dealer_programs:', progErr);
      return NextResponse.json({ error: progErr.message }, { status: 500, headers: corsHeaders });
    }

    // 2. Fetch participants
    const { data: partData, error: partErr } = await supabaseAdmin
      .from('dealer_program_participants')
      .select('*, dealers(id, store_name, address, profiles(full_name, phone_number)), dealer_programs(*)')
      .order('enrolled_at', { ascending: false });

    if (partErr) {
      console.error('Error fetching dealer_program_participants:', partErr);
      return NextResponse.json({ error: partErr.message }, { status: 500, headers: corsHeaders });
    }

    // 3. Enrich participants with parsed claim_notes metadata (photo URLs, item names, etc.)
    const enrichedParticipants = (partData || []).map((p: any) => {
      let photo_before_url = p.photo_before_url || null;
      let photo_after_url = p.photo_after_url || null;
      let selected_item_name = p.selected_item_name || null;
      let applicant_name = p.dealers?.profiles?.full_name || null;
      let applicant_store_name = p.dealers?.store_name || null;
      let applicant_phone = p.dealers?.profiles?.phone_number || null;

      if (p.claim_notes) {
        // Parse metadata JSON block if available
        const metaMatch = p.claim_notes.match(/__METADATA__:([\s\S]*)$/);
        if (metaMatch && metaMatch[1]) {
          try {
            const meta = JSON.parse(metaMatch[1]);
            photo_before_url = photo_before_url || meta.photo_before_url;
            photo_after_url = photo_after_url || meta.photo_after_url;
            selected_item_name = selected_item_name || meta.selected_item_name;
            applicant_name = applicant_name || meta.applicant_name;
            applicant_store_name = applicant_store_name || meta.applicant_store_name;
            applicant_phone = applicant_phone || meta.applicant_phone;
          } catch (_) {}
        }

        // Regex fallbacks
        if (!photo_before_url) {
          const beforeMatch = p.claim_notes.match(/\[BEFORE_URL:\s*(.*?)\]/);
          if (beforeMatch && beforeMatch[1]) photo_before_url = beforeMatch[1].trim();
        }
        if (!photo_after_url) {
          const afterMatch = p.claim_notes.match(/\[AFTER_URL:\s*(.*?)\]/);
          if (afterMatch && afterMatch[1]) photo_after_url = afterMatch[1].trim();
        }
        if (!selected_item_name) {
          const itemMatch = p.claim_notes.match(/\[PILIHAN ITEM:\s*(.*?)\]/);
          if (itemMatch && itemMatch[1]) selected_item_name = itemMatch[1].trim();
        }
      }

      return {
        ...p,
        photo_before_url,
        photo_after_url,
        selected_item_name,
        applicant_name,
        applicant_store_name,
        applicant_phone,
      };
    });

    return NextResponse.json(
      {
        success: true,
        programs: progData || [],
        participants: enrichedParticipants,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Unexpected error in GET /api/programs:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Direct enrollment / submission endpoint for Mobile App & Admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      program_id,
      dealer_id,
      status = 'ENROLLED',
      claim_notes,
      custom_target_amount,
      selected_item_qty = 1,
    } = body;

    if (!program_id) {
      return NextResponse.json(
        { error: 'program_id wajib disertakan.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!dealer_id || dealer_id === 'demo-dealer-id') {
      return NextResponse.json(
        { error: 'dealer_id toko wajib terdaftar dan valid.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = await getAdminClient();

    // Check if participant record already exists for this program and dealer
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('dealer_program_participants')
      .select('id, status')
      .eq('program_id', program_id)
      .eq('dealer_id', dealer_id)
      .maybeSingle();

    if (findErr) {
      console.warn('Error checking existing participant:', findErr);
    }

    let resultData = null;

    if (existing?.id) {
      // Update existing record
      const updatePayload: any = {
        status: status || existing.status || 'ENROLLED',
        claim_notes: claim_notes || undefined,
        custom_target_amount: custom_target_amount || undefined,
        selected_item_qty: selected_item_qty || 1,
      };

      const { data, error } = await supabaseAdmin
        .from('dealer_program_participants')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*, dealers(id, store_name, address, profiles(full_name, phone_number)), dealer_programs(*)')
        .single();

      if (error) {
        console.error('Error updating participant:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
      }

      resultData = data;
    } else {
      // Insert new participant
      const insertPayload: any = {
        program_id,
        dealer_id,
        status: status || 'ENROLLED',
        current_progress_amount: 0,
        claim_notes: claim_notes || '',
        custom_target_amount: custom_target_amount || undefined,
        selected_item_qty: selected_item_qty || 1,
      };

      const { data, error } = await supabaseAdmin
        .from('dealer_program_participants')
        .insert([insertPayload])
        .select('*, dealers(id, store_name, address, profiles(full_name, phone_number)), dealer_programs(*)')
        .single();

      if (error) {
        console.error('Error inserting participant:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
      }

      resultData = data;
    }

    return NextResponse.json(
      {
        success: true,
        participant: resultData,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/programs:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
