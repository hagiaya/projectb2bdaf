import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalisasi nomor telepon ke format 08xxxxxxxxx (lokal Indonesia)
// Harus identik dengan fungsi di send-otp/index.ts
const normalizePhone = (phone: string): string => {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2)
  }
  if (!digits.startsWith('0')) {
    digits = '0' + digits
  }
  return digits
}

// Generate a random strong password
const generateStrongPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
  let pass = ''
  for (let i = 0; i < 20; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, otp } = await req.json()

    if (!phone || !otp) {
      return new Response(JSON.stringify({ success: false, error: 'Phone and OTP are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Normalisasi nomor agar konsisten dengan yang disimpan di send-otp
    const normalizedPhone = normalizePhone(phone)
    console.log(`verify-otp: Phone input: ${phone} → normalized: ${normalizedPhone}, OTP: ${otp}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Validate OTP menggunakan nomor yang sudah dinormalisasi
    const { data: otpData, error: otpError } = await supabase
      .from('auth_otps')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('otp_code', otp)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log(`OTP lookup result: data=${JSON.stringify(otpData)}, error=${JSON.stringify(otpError)}`)

    if (otpError || !otpData) {
      return new Response(JSON.stringify({ success: false, error: 'Kode OTP tidak valid atau salah.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (new Date(otpData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'Kode OTP sudah kadaluarsa.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Mark OTP as used
    await supabase
      .from('auth_otps')
      .update({ is_used: true })
      .eq('id', otpData.id)

    // 3. User Authentication Logic (Shadow Password Trick)
    // Gunakan nomor yang dinormalisasi untuk konsistensi email
    const phoneEmail = `${normalizedPhone.replace(/\D/g, '')}@b2b-app.local`
    console.log(`Using email: ${phoneEmail}`)
    
    // Check if user exists using profiles table (which shares the same ID as auth.users)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', phone) // or use phoneEmail if profiles doesn't have phone
      .maybeSingle();

    // If profile check doesn't work, let's try to query auth.users if possible (usually not allowed via standard client, but we can try to create user)
    let isNewUser = false
    const newPassword = generateStrongPassword()
    let userId = profileData?.id;

    if (!userId) {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: phoneEmail,
        password: newPassword,
        email_confirm: true,
      })
      
      if (createError) {
        // If it fails because user already exists (e.g. deleted from profiles but not auth.users)
        if (createError.message.includes('already exists') || createError.status === 422) {
           // We can't easily get the ID, so let's fallback to listUsers for this edge case
           const { data: { users } } = await supabase.auth.admin.listUsers()
           const existingUser = users?.find(u => u.email === phoneEmail)
           if (existingUser) {
             userId = existingUser.id
             await supabase.auth.admin.updateUserById(userId, { password: newPassword })
           } else {
             throw new Error("Gagal memulihkan akun lama. Hubungi admin.");
           }
        } else {
          throw createError
        }
      } else {
        userId = newUser.user.id
        isNewUser = true
        console.log(`Created new user: ${userId}`)
      }
    } else {
      // Update existing user with new temporary password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })
      if (updateError) throw updateError
      console.log(`Updated existing user: ${userId}`)
    }

    // 4. Sign in to get session tokens
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneEmail,
      password: newPassword
    })

    if (signInError) {
      console.error("Sign in error:", signInError)
      throw signInError
    }

    return new Response(JSON.stringify({ 
      success: true, 
      session: authData.session,
      user: authData.user,
      isNewUser: isNewUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("verify-otp error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
