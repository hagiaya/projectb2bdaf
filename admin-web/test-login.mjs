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
  const phone = '081375478910';
  
  // Test login with fallback emails
  const emailsToTest = [
    `${phone}@sales.b2b.app`,
    `${phone}@spv.b2b.app`,
    `${phone}@b2b-app.local`
  ];
  
  for (const email of emailsToTest) {
    console.log(`\nTesting login with email: ${email} and password: 'sales123'`);
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'sales123'
    });
    
    if (loginErr) {
      console.log('Login failed:', loginErr.message);
    } else {
      console.log('Login SUCCESS! User ID:', loginData.user.id);
    }
  }
}
check();
