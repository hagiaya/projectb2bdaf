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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('check_user_role', { p_phone: '081375478910' });
  console.log('check_user_role:', data, error);
}
check();
