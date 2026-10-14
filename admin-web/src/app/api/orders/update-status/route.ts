import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Mock WebSocket for Node.js environments
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, new_status, new_payment_status, updated_by = 'Admin' } = body;

    if (!order_id || !new_status) {
      return NextResponse.json(
        { error: 'Order ID dan status baru wajib dicantumkan.' },
        { status: 400 }
      );
    }

    // Initialize administrative client
    let supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      const { error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
        email: 'ditoapp@atomicmail.io',
        password: 'admin123'
      });
      if (signInErr) {
        console.warn('Sign-in as fallback admin failed in update-status:', signInErr);
      }
    }

    // 1. Fetch current order
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, dealer_id')
      .eq('id', order_id)
      .single();

    if (fetchErr || !currentOrder) {
      return NextResponse.json(
        { error: `Pesanan dengan ID ${order_id} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const updatePayload: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (new_payment_status) {
      updatePayload.payment_status = new_payment_status;
    }

    // If moved to RECEIVED and payment method is KREDIT, set payment_due_date
    if (new_status === 'RECEIVED' && currentOrder.payment_method === 'KREDIT') {
      const { data: dealerData } = await supabaseAdmin
        .from('dealers')
        .select('credit_term_days')
        .eq('id', currentOrder.dealer_id)
        .single();

      if (dealerData?.credit_term_days) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Number(dealerData.credit_term_days));
        updatePayload.payment_due_date = dueDate.toISOString();
      }
    }

    // 2. Perform Order Update
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', order_id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating order status in API:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Inventory Stock Synchronization
    // If order was cancelled, return items to warehouse
    if (new_status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
      try {
        const { data: cancelItems } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', order_id);

        if (cancelItems) {
          for (const cit of cancelItems) {
            const { data: pData } = await supabaseAdmin
              .from('products')
              .select('id, stock')
              .eq('id', cit.product_id)
              .single();

            if (pData) {
              const pPrev = Number(pData.stock) || 0;
              const pNew = pPrev + Number(cit.quantity);
              await supabaseAdmin.from('products').update({ stock: pNew }).eq('id', cit.product_id);
              await supabaseAdmin.from('stock_logs').insert([{
                product_id: cit.product_id,
                type: 'RETURN',
                quantity: cit.quantity,
                previous_stock: pPrev,
                current_stock: pNew,
                notes: `Pesanan Dibatalkan #${currentOrder.order_number || order_id}`,
                created_by: updated_by,
              }]);
            }
          }
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi stok pembatalan:', err);
      }
    }
    // If order was reactivated from CANCELLED, deduct items again
    else if (currentOrder.status === 'CANCELLED' && new_status !== 'CANCELLED') {
      try {
        const { data: reactivateItems } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', order_id);

        if (reactivateItems) {
          for (const rit of reactivateItems) {
            const { data: pData } = await supabaseAdmin
              .from('products')
              .select('id, stock')
              .eq('id', rit.product_id)
              .single();

            if (pData) {
              const pPrev = Number(pData.stock) || 0;
              const pNew = Math.max(0, pPrev - Number(rit.quantity));
              await supabaseAdmin.from('products').update({ stock: pNew }).eq('id', rit.product_id);
              await supabaseAdmin.from('stock_logs').insert([{
                product_id: rit.product_id,
                type: 'SALE',
                quantity: rit.quantity,
                previous_stock: pPrev,
                current_stock: pNew,
                notes: `Pesanan Diaktifkan Kembali #${currentOrder.order_number || order_id}`,
                created_by: updated_by,
              }]);
            }
          }
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi stok reaktivasi:', err);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Status pesanan #${currentOrder.order_number} berhasil diubah menjadi ${new_status}.`
    });

  } catch (err: any) {
    console.error('API update-status unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan pada server saat memperbarui status pesanan.' },
      { status: 500 }
    );
  }
}
