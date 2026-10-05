import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { phone: '081234567890', otp: '123456' },
  });
  console.log('Result:', data, error);
}

test();
