import { createClient } from '@supabase/supabase-js';
class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}

globalThis.WebSocket = MockWebSocket;

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkLogin() {
  const phone = '082111277520';
  const password = 'ajisales123'; // or dapnabire123
  const email = `${phone}@sales.b2b.app`;

  console.log(`Trying to login with: ${email} / ${password}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.log('Error:', error.message);
    
    // Try the fallback format
    const fallbackEmail = `${phone}@b2b-app.local`;
    console.log(`Trying fallback: ${fallbackEmail} / ${password}`);
    const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password: password
    });
    console.log('Result:', e2?.message || 'Success');

    // Try dapnabire123
    console.log(`Trying dapnabire123 with ${email}`);
    const { error: e3 } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dapnabire123'
    });
    console.log('Result:', e3?.message || 'Success');

    console.log(`Trying dapnabire123 with ${fallbackEmail}`);
    const { error: e4 } = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password: 'dapnabire123'
    });
    console.log('Result:', e4?.message || 'Success');

  } else {
    console.log('Success:', data.user.id);
  }

  // check if profile exists
  const { data: profile } = await supabase.from('profiles').select('*').eq('phone_number', phone).maybeSingle();
  console.log('Profile:', profile);
}
checkLogin();
