import fetch from 'node-fetch';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

async function run() {
  const query = 'delaer%20contoh';
  const query2 = 'admin%20b2b';
  
  // delete delaer contoh
  let res = await fetch(`${SUPABASE_URL}/rest/v1/dealers?name=ilike.*${query}*`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  console.log('delaer contoh delete status:', res.status);
  
  // delete admin b2b
  res = await fetch(`${SUPABASE_URL}/rest/v1/dealers?name=ilike.*${query2}*`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  console.log('admin b2b delete status:', res.status);
}

run();
