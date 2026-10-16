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
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

    // Safely check existing participant record using base columns
    let existingQuery = supabaseAdmin
      .from('dealer_program_participants')
      .select('id, status, claim_notes, current_progress_amount');

    if (body.participant_id || body.id) {
      existingQuery = existingQuery.eq('id', body.participant_id || body.id);
    } else {
      existingQuery = existingQuery
        .eq('program_id', program_id)
        .eq('dealer_id', dealer_id);
    }

    const { data: existingList, error: findErr } = await existingQuery;

    if (findErr) {
      console.warn('Error checking existing participant:', findErr);
    }

    // Check if an existing row matches this specific item
    let existing = null;
    if (existingList && existingList.length > 0) {
      if (body.participant_id || body.id) {
        existing = existingList[0];
      } else if (body.selected_item_id) {
        // match by selected_item_id in metadata or column
        existing = existingList.find((p: any) => {
          if (p.selected_item_id === body.selected_item_id) return true;
          if (p.claim_notes) {
            const metaMatch = p.claim_notes.match(/__METADATA__:([\s\S]*)$/);
            if (metaMatch && metaMatch[1]) {
              try {
                const meta = JSON.parse(metaMatch[1]);
                if (meta.selected_item_id === body.selected_item_id) return true;
              } catch (_) {}
            }
          }
          return false;
        });
      } else {
        existing = existingList[0];
      }
    }

    // Build enriched claim_notes with __METADATA__
    let finalClaimNotes = claim_notes || (existing ? existing.claim_notes : '') || '';
    const currentMeta: any = {
      selected_item_id: body.selected_item_id || undefined,
      selected_item_name: body.selected_item_name || undefined,
      selected_item_qty: selected_item_qty || 1,
      custom_target_amount: custom_target_amount || undefined,
      photo_before_url: body.photo_before_url || undefined,
      photo_after_url: body.photo_after_url || undefined,
      applicant_name: body.applicant_name || undefined,
      applicant_store_name: body.applicant_store_name || undefined,
      applicant_location: body.applicant_location || undefined,
      applicant_phone: body.applicant_phone || undefined,
      enrolled_at: new Date().toISOString(),
    };

    if (!finalClaimNotes.includes('__METADATA__:')) {
      finalClaimNotes = (finalClaimNotes ? finalClaimNotes + '\n' : '') + `__METADATA__:${JSON.stringify(currentMeta)}`;
    } else {
      // Merge metadata
      const metaMatch = finalClaimNotes.match(/__METADATA__:([\s\S]*)$/);
      let existingMeta: any = {};
      if (metaMatch && metaMatch[1]) {
        try {
          existingMeta = JSON.parse(metaMatch[1]);
        } catch (_) {}
      }
      const mergedMeta = { ...existingMeta, ...currentMeta };
      finalClaimNotes = finalClaimNotes.replace(/__METADATA__:([\s\S]*)$/, `__METADATA__:${JSON.stringify(mergedMeta)}`);
    }

    let resultData = null;

    if (existing?.id) {
      // Update existing record
      const updatePayload: any = {
        status: status || existing.status || 'ENROLLED',
        claim_notes: finalClaimNotes,
        custom_target_amount: custom_target_amount || undefined,
        selected_item_qty: selected_item_qty || 1,
        selected_item_id: body.selected_item_id || undefined,
        selected_item_name: body.selected_item_name || undefined,
        photo_before_url: body.photo_before_url || undefined,
        photo_after_url: body.photo_after_url || undefined,
        applicant_name: body.applicant_name || undefined,
        applicant_store_name: body.applicant_store_name || undefined,
        applicant_location: body.applicant_location || undefined,
        applicant_phone: body.applicant_phone || undefined,
      };

      let { data, error } = await supabaseAdmin
        .from('dealer_program_participants')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*')
        .single();

      // If optional column error, fallback to base columns
      if (error && error.message.includes('column')) {
        console.warn('Fallback updating base columns only:', error.message);
        const fallbackUpdate: any = {
          status: status || existing.status || 'ENROLLED',
          claim_notes: finalClaimNotes,
        };
        const retry = await supabaseAdmin
          .from('dealer_program_participants')
          .update(fallbackUpdate)
          .eq('id', existing.id)
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

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
        current_progress_amount: body.current_progress_amount || 0,
        claim_notes: finalClaimNotes,
        custom_target_amount: custom_target_amount || undefined,
        selected_item_qty: selected_item_qty || 1,
        selected_item_id: body.selected_item_id || undefined,
        selected_item_name: body.selected_item_name || undefined,
        photo_before_url: body.photo_before_url || undefined,
        photo_after_url: body.photo_after_url || undefined,
        applicant_name: body.applicant_name || undefined,
        applicant_store_name: body.applicant_store_name || undefined,
        applicant_location: body.applicant_location || undefined,
        applicant_phone: body.applicant_phone || undefined,
      };

      let { data, error } = await supabaseAdmin
        .from('dealer_program_participants')
        .insert([insertPayload])
        .select('*')
        .single();

      // Fallback 1: If column does not exist
      if (error && error.message.includes('column')) {
        console.warn('Fallback inserting with base columns only:', error.message);
        const basePayload: any = {
          program_id,
          dealer_id,
          status: status || 'ENROLLED',
          current_progress_amount: body.current_progress_amount || 0,
          claim_notes: finalClaimNotes,
        };
        const retry = await supabaseAdmin
          .from('dealer_program_participants')
          .insert([basePayload])
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      // Fallback 2: If unique constraint on (program_id, dealer_id) still exists in DB
      if (error && error.message.includes('unique constraint')) {
        console.warn('Unique constraint hit, appending item to existing participant row claim_notes');
        const firstExisting = existingList?.[0];
        if (firstExisting) {
          // Parse existing meta items
          let items: any[] = [];
          const match = (firstExisting.claim_notes || '').match(/__METADATA__:([\s\S]*)$/);
          let prevMeta: any = {};
          if (match && match[1]) {
            try {
              prevMeta = JSON.parse(match[1]);
              if (Array.isArray(prevMeta.items)) items = prevMeta.items;
              else if (prevMeta.selected_item_id) items = [prevMeta];
            } catch (_) {}
          }
          // append new item
          items.push(currentMeta);
          prevMeta.items = items;
          const multiClaimNotes = (firstExisting.claim_notes || '').replace(/__METADATA__:([\s\S]*)$/, '') +
            `\n[PILIHAN ITEM: ${body.selected_item_name || 'Display Support'} | Target: Rp ${(custom_target_amount || 0).toLocaleString('id-ID')}]` +
            `\n__METADATA__:${JSON.stringify(prevMeta)}`;

          const updateExisting = await supabaseAdmin
            .from('dealer_program_participants')
            .update({ claim_notes: multiClaimNotes })
            .eq('id', firstExisting.id)
            .select('*')
            .single();

          data = updateExisting.data;
          error = updateExisting.error;
        }
      }

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

// PATCH: Reject or Update Participant Application
export async function PATCH(req: NextRequest) {
  try {
    const supabaseAdmin = await getAdminClient();
    const body = await req.json();
    const { participant_id, real_id, selected_item_id, status = 'REJECTED', admin_notes = '' } = body;

    const targetId = real_id || participant_id;
    if (!targetId) {
      return NextResponse.json({ error: 'ID peserta wajib disertakan' }, { status: 400, headers: corsHeaders });
    }

    // Fetch participant row
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('dealer_program_participants')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (fetchErr || !row) {
      // Also check fallback search by participant_id if targetId was real_id
      const { data: fallbackRow } = await supabaseAdmin
        .from('dealer_program_participants')
        .select('*')
        .eq('id', participant_id)
        .maybeSingle();

      if (!fallbackRow) {
        return NextResponse.json({ error: 'Data peserta tidak ditemukan' }, { status: 404, headers: corsHeaders });
      }
    }

    const targetRow = row;

    // Handle unpacked multi-item record in claim_notes metadata
    if (targetRow && targetRow.claim_notes && targetRow.claim_notes.includes('__METADATA__:')) {
      const metaMatch = targetRow.claim_notes.match(/__METADATA__:([\s\S]*)$/);
      if (metaMatch && metaMatch[1]) {
        try {
          const meta = JSON.parse(metaMatch[1]);
          if (Array.isArray(meta.items) && meta.items.length > 0 && selected_item_id) {
            let matchedItem = false;
            meta.items = meta.items.map((it: any) => {
              if (it.selected_item_id === selected_item_id || it.id === participant_id) {
                matchedItem = true;
                return { ...it, status: status || 'REJECTED', admin_notes };
              }
              return it;
            });

            if (matchedItem) {
              const allRejected = meta.items.every((it: any) => it.status === 'REJECTED');
              const updatedNotes = targetRow.claim_notes.replace(/__METADATA__:([\s\S]*)$/, '') + `__METADATA__:${JSON.stringify(meta)}`;
              
              await supabaseAdmin
                .from('dealer_program_participants')
                .update({
                  claim_notes: updatedNotes,
                  admin_notes: admin_notes || targetRow.admin_notes,
                  status: allRejected ? 'REJECTED' : targetRow.status,
                })
                .eq('id', targetRow.id);

              return NextResponse.json({
                success: true,
                message: `Status item berhasil diubah menjadi ${status}.`,
              }, { headers: corsHeaders });
            }
          }
        } catch (_) {}
      }
    }

    // Standard database row update
    const { error: updateErr } = await supabaseAdmin
      .from('dealer_program_participants')
      .update({
        status: status || 'REJECTED',
        admin_notes: admin_notes || null,
      })
      .eq('id', targetId);

    if (updateErr) {
      console.error('Error updating participant in PATCH /api/programs:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      message: `Status pengajuan berhasil diubah menjadi ${status}.`,
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/programs:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// DELETE: Delete Participant Application permanently
export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = await getAdminClient();
    const url = new URL(req.url);
    const participantId = url.searchParams.get('id') || url.searchParams.get('participant_id');
    const realId = url.searchParams.get('real_id');
    const selectedItemId = url.searchParams.get('selected_item_id');

    if (!participantId && !realId) {
      return NextResponse.json({ error: 'ID peserta wajib disertakan' }, { status: 400, headers: corsHeaders });
    }

    const targetId = realId || participantId!;

    // 1. Fetch current participant to inspect if multi-item metadata is used
    let { data: row } = await supabaseAdmin
      .from('dealer_program_participants')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (!row && participantId) {
      const fallback = await supabaseAdmin
        .from('dealer_program_participants')
        .select('*')
        .eq('id', participantId)
        .maybeSingle();
      row = fallback.data;
    }

    // If multi-item metadata exists, check if we only delete one specific sub-item
    if (row && row.claim_notes && row.claim_notes.includes('__METADATA__:')) {
      const metaMatch = row.claim_notes.match(/__METADATA__:([\s\S]*)$/);
      if (metaMatch && metaMatch[1]) {
        try {
          const meta = JSON.parse(metaMatch[1]);
          if (Array.isArray(meta.items) && meta.items.length > 1 && selectedItemId) {
            const remainingItems = meta.items.filter(
              (it: any) => it.selected_item_id !== selectedItemId && it.id !== participantId
            );
            if (remainingItems.length > 0) {
              meta.items = remainingItems;
              const updatedNotes = row.claim_notes.replace(/__METADATA__:([\s\S]*)$/, '') + `__METADATA__:${JSON.stringify(meta)}`;
              await supabaseAdmin
                .from('dealer_program_participants')
                .update({ claim_notes: updatedNotes })
                .eq('id', row.id);

              return NextResponse.json({
                success: true,
                message: 'Item pengajuan berhasil dihapus dari data outlet.',
              }, { headers: corsHeaders });
            }
          }
        } catch (_) {}
      }
    }

    // Delete the whole row from Supabase
    const finalIdToDelete = row ? row.id : targetId;
    const { error: delErr } = await supabaseAdmin
      .from('dealer_program_participants')
      .delete()
      .eq('id', finalIdToDelete);

    if (delErr) {
      console.error('Error deleting participant in API:', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengajuan partisipan berhasil dihapus permanen.',
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/programs:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
