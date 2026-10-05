import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';
for (let line of envContent.split('\n')) {
  line = line.trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].replace(/["']/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) SUPABASE_KEY = line.split('=')[1].replace(/["']/g, '');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) console.log('Error listing users', error);
  else {
    const users = data.users.filter(u => u.phone === '082111277520' || (u.email && u.email.includes('082111277520')));
    console.log('Users found:', users);
  }
}
run();
