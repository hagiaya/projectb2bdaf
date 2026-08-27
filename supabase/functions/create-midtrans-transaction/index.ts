import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()
    
    if (!order_id) {
      throw new Error("order_id is required")
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Fetch Order and Customer Details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        dealers (
          profiles (
            full_name,
            phone_number
          )
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error("Order not found")
    }

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    
    // SIMULATION MODE IF NO KEY
    if (!serverKey || serverKey === 'SIMULATION') {
      console.log("Running in Midtrans SIMULATION mode because MIDTRANS_SERVER_KEY is missing or set to SIMULATION");
      const dummyUrl = `https://simulator.sandbox.midtrans.com/snap/v2/vtweb/dummy-${order_id}`;
      
      // Update order with dummy URL
      await supabase
        .from('orders')
        .update({ payment_url: dummyUrl, midtrans_transaction_id: `dummy-txn-${order_id}` })
        .eq('id', order_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_url: dummyUrl, 
          token: `dummy-${order_id}`,
          message: "Simulation mode active"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // REAL MIDTRANS MODE
    const authString = btoa(`${serverKey}:`)
    
    // Midtrans tampaknya tidak lagi selalu menggunakan prefix SB- untuk kunci Sandbox di akun baru.
    // Jadi kita gunakan Sandbox secara default kecuali diset secara eksplisit.
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
    const midtransUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    
    const payload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(order.total_amount) // Must be integer
      },
      customer_details: {
        first_name: order.dealers?.profiles?.full_name || 'Dealer',
        email: 'dealer@example.com',
        phone: order.dealers?.profiles?.phone_number || ''
      },
      callbacks: {
        finish: "mobileapp://"
      }
    }

    const midtransResponse = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    })

    const midtransData = await midtransResponse.json()

    if (!midtransResponse.ok) {
      throw new Error(midtransData.error_messages?.[0] || 'Gagal membuat transaksi Midtrans')
    }

    // Update order with real payment URL
    await supabase
      .from('orders')
      .update({ payment_url: midtransData.redirect_url, midtrans_transaction_id: midtransData.token })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_url: midtransData.redirect_url,
        token: midtransData.token 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
