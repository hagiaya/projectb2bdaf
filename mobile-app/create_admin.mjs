import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const supabaseKey = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin.ops@dap.com',
    password: 'admin123',
  });
  
  if (error) {
    console.error('Error signing up:', error.message);
    return;
  }
  
  const user = data.user;
  if (!user) {
    console.log('User created but requires email confirmation.');
    return;
  }

  // Update profile role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
        role: 'ADMIN', 
        full_name: 'Admin Operasional',
        phone_number: '08111222333'
    })
    .eq('id', user.id);
    
  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('Successfully created admin user!');
    console.log('Email:', user.email);
    console.log('ID:', user.id);
  }
}
run();
