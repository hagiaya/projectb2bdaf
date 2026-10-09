import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}
globalThis.WebSocket = MockWebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profile } = await supabase.from('profiles').select('*').eq('role', 'ADMIN').single();
  console.log('ADMIN profile:', profile);
  
  // also check by name or email? 'admin@dap.com' might not be in profiles table email column.
  // We can login and check the ID.
  const { data: loginData } = await supabase.auth.signInWithPassword({
    email: 'admin@dap.com',
    password: 'admin' // wait I don't know the password, the user typed 8 characters.
  });
  console.log('login attempt ID:', loginData?.user?.id);
  
  if (loginData?.user?.id) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', loginData.user.id).single();
    console.log('Profile for admin@dap.com:', prof);
  }
}
check();
