import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const supabaseKey = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('sales').select('id, profile_id, status, profiles(role, full_name)');
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
