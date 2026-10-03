import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: dealers, error } = await supabase.from('dealers').select('id, name');
  if (error) {
    console.error('Error fetching dealers:', error);
    return;
  }
  
  const toDelete = dealers.filter(d => 
    d.name.toLowerCase().includes('delaer contoh') || 
    d.name.toLowerCase().includes('admin b2b')
  );
  
  if (toDelete.length === 0) {
    console.log('No demo dealers found.');
    return;
  }
  
  for (const dealer of toDelete) {
    const { error: delError } = await supabase.from('dealers').delete().eq('id', dealer.id);
    if (delError) {
      console.error(`Error deleting ${dealer.name}:`, delError);
    } else {
      console.log(`Deleted demo dealer: ${dealer.name}`);
    }
  }
}

run();
