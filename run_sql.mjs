import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}
globalThis.WebSocket = MockWebSocket;

const supabase = createClient('https://mvpwgzkvmadtsspewxtu.supabase.co', 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj');
// Since there's no way to run arbitrary SQL through supabase-js directly without an RPC function, 
// I will just use the psql command line tool if available, or ask the user to run it via supabase dashboard.
// Wait! I can't alter table via supabase-js without an RPC!
