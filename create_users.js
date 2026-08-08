const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rbezcgrxokzhtslrxuta.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZXpjZ3J4b2t6aHRzbHJ4dXRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA5OTE4OSwiZXhwIjoyMTAxNjc1MTg5fQ.2nqUteNMr_ex8sfHi14xJ-8Jq30bnv_2UUD2TmaRs2M';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createUsers() {
  console.log("Creating Admin User...");
  const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@b2b.com',
    password: 'admin123',
    email_confirm: true
  });

  if (adminErr) {
    console.error("Admin error:", adminErr.message);
  } else {
    console.log("Admin created:", adminData.user.id);
    // Update profile
    await supabase.from('profiles').insert([
      { id: adminData.user.id, role: 'ADMIN', full_name: 'Administrator' }
    ]);
  }

  console.log("Creating Dealer User...");
  const { data: dealerData, error: dealerErr } = await supabase.auth.admin.createUser({
    email: 'dealer@b2b.com',
    password: 'dealer123',
    email_confirm: true
  });

  if (dealerErr) {
    console.error("Dealer error:", dealerErr.message);
  } else {
    console.log("Dealer created:", dealerData.user.id);
    // Create profile
    await supabase.from('profiles').insert([
      { id: dealerData.user.id, role: 'DEALER', full_name: 'Budi Santoso', phone_number: '0812-3456-7890' }
    ]);

    // Create a dealer record
    const { data: regData } = await supabase.from('regions').select('id').limit(1).single();
    if (regData) {
      await supabase.from('dealers').insert([
        { 
          profile_id: dealerData.user.id, 
          region_id: regData.id, 
          store_name: 'Toko Makmur Jaya', 
          address: 'Jl. Raya Industri No. 45, Surabaya',
          status: 'ACTIVE'
        }
      ]);
      console.log("Dealer record created in 'dealers' table.");
    }
  }
}

createUsers();
