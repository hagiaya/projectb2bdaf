import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalisasi nomor telepon ke format 08xxxxxxxxx (lokal Indonesia)
// Contoh: "628123456789" → "08123456789", "+628123..." → "08123..."
const normalizePhone = (phone: string): string => {
  // Hapus semua karakter non-digit
  let digits = phone.replace(/\D/g, '')
  // Jika diawali 62, ganti dengan 0
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2)
  }
  // Jika diawali 0, biarkan
  // Jika tidak diawali 0 (misal langsung 8xxx), tambahkan 0
  if (!digits.startsWith('0')) {
    digits = '0' + digits
  }
  return digits
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Normalisasi nomor sebelum disimpan dan dikirim
    const normalizedPhone = normalizePhone(phone)
    console.log(`Phone input: ${phone} → normalized: ${normalizedPhone}`)

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Invalidate OTP lama yang belum digunakan untuk nomor yang sama
    await supabase
      .from('auth_otps')
      .update({ is_used: true })
      .eq('phone_number', normalizedPhone)
      .eq('is_used', false)

    // Store OTP dengan nomor yang sudah dinormalisasi
    const { error: dbError } = await supabase
      .from('auth_otps')
      .insert({
        phone_number: normalizedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      })

    if (dbError) throw dbError

    // Send via Fonnte
    const fonnteToken = Deno.env.get('FLOWKIRIM_TOKEN')
    
    if (fonnteToken) {
      const message = `Halo! Kode OTP Anda untuk masuk ke aplikasi DAP APP adalah: *${otp}*.\n\nKode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
      
      const formData = new FormData();
      formData.append('target', normalizedPhone);
      formData.append('message', message);
      formData.append('countryCode', '62');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken
        },
        body: formData
      })
      
      const fonnteResponse = await response.json()
      console.log("Fonnte response:", JSON.stringify(fonnteResponse))
      
      if (!response.ok || !fonnteResponse.status) {
         console.error("Fonnte Error:", fonnteResponse)
         throw new Error(fonnteResponse.reason || "Gagal mengirim pesan OTP")
      }
    } else {
      console.warn('FLOWKIRIM_TOKEN is not set. OTP was generated but not sent via WhatsApp. OTP is:', otp)
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("send-otp error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
