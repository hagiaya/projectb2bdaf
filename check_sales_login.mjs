import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './admin-web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const phone = '082111277520';
  console.log(`Checking profile for phone: ${phone}`);
  const { data: profile } = await supabase.from('profiles').select('*').eq('phone_number', phone).single();
  console.log('Profile:', profile);

  if (profile) {
    const { data: user, error } = await supabase.auth.admin.getUserById(profile.id);
    console.log('Auth User:', user?.user?.email, user?.user?.phone, error);
    
    // Let's also check sales table
    const { data: sales } = await supabase.from('sales').select('*').eq('profile_id', profile.id).single();
    console.log('Sales Record:', sales);
  } else {
    // Check if it exists with '62' prefix
    const { data: profile62 } = await supabase.from('profiles').select('*').eq('phone_number', '6282111277520').single();
    console.log('Profile with 62:', profile62);
  }
}
check();
