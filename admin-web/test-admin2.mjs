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
  // Let's find any profile where email might be matching or role is null
  const { data: profiles } = await supabase.from('profiles').select('*').is('role', null);
  console.log('Profiles with null role:', profiles);
  
  const { data: profilesAdmin } = await supabase.from('profiles').select('*').eq('role', 'ADMIN');
  console.log('Profiles with ADMIN role:', profilesAdmin);
  
  const { data: profilesDealer } = await supabase.from('profiles').select('*').eq('role', 'DEALER');
  console.log('Profiles with DEALER role count:', profilesDealer?.length);
}
check();
