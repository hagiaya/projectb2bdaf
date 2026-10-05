import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}
globalThis.WebSocket = MockWebSocket;

const supabase = createClient('https://mvpwgzkvmadtsspewxtu.supabase.co', 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj');
async function run() {
  const { data, error } = await supabase.from('dealers').update({ status: 'ACTIVE' }).eq('status', 'INACTIVE');
  console.log('Update result:', data, error);
}
run();
