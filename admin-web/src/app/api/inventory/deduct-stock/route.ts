import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, order_number, items, action = 'DEDUCT', created_by = 'Sistem Order' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Daftar item order wajib diisi.' }, { status: 400 });
    }

    // Initialize Supabase Client
    let supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    // If service role key is not configured, sign in with administrative account
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      await supabaseClient.auth.signInWithPassword({
        email: 'ditoapp@atomicmail.io',
        password: 'admin123'
      });
    }

    const updatedResults = [];

    for (const it of items) {
      const productId = it.product_id;
      const quantity = Math.max(1, Math.round(Number(it.quantity) || 1));

      if (!productId) continue;

      // 1. Fetch current stock
      const { data: prod, error: prodErr } = await supabaseClient
        .from('products')
        .select('id, name, sku, stock')
        .eq('id', productId)
        .single();

      if (prodErr || !prod) {
        console.warn(`Product not found for stock update: ${productId}`, prodErr);
        continue;
      }

      const prevStock = Number(prod.stock) || 0;
      let newStock = prevStock;

      if (action === 'DEDUCT') {
        newStock = Math.max(0, prevStock - quantity);
      } else if (action === 'RESTORE') {
        newStock = prevStock + quantity;
      }

      // 2. Update products table
      const { error: updErr } = await supabaseClient
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (updErr) {
        console.error(`Failed to update stock for product ${productId}:`, updErr);
        continue;
      }

      // 3. Insert stock_logs entry
      try {
        await supabaseClient.from('stock_logs').insert([{
          product_id: productId,
          type: action === 'DEDUCT' ? 'SALE' : 'RESTOCK',
          quantity: quantity,
          previous_stock: prevStock,
          current_stock: newStock,
          notes: action === 'DEDUCT' 
            ? `Pengurangan Stok Pesanan #${order_number || order_id || '-'}` 
            : `Pengembalian Stok Pesanan #${order_number || order_id || '-'}`,
          created_by: created_by,
        }]);
      } catch (logErr) {
        console.warn('Failed to insert stock log:', logErr);
      }

      updatedResults.push({
        product_id: productId,
        name: prod.name,
        prevStock,
        newStock,
      });
    }

    return NextResponse.json({
      success: true,
      action,
      updatedCount: updatedResults.length,
      data: updatedResults,
    });
  } catch (err: any) {
    console.error('API deduct-stock error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat memproses pengurangan stok.' },
      { status: 500 }
    );
  }
}
