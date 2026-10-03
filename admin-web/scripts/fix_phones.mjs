import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  readyState = 3;
  constructor() {}
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  globalThis.WebSocket = MockWebSocket;
}

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: MockWebSocket },
});

async function fixPhone() {
  console.log('Logging in as Admin...');
  const { data: adminAuth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'ditoapp@atomicmail.io',
    password: 'admin123',
  });
  if (aErr) return console.error('Admin login error:', aErr);
  console.log('Logged in as Admin:', adminAuth.user.id);

  const oldPhone = '+6285123968217';
  const newPhone = '085123968217';

  const { data: prof, error: pErr } = await supabase.from('profiles').select('*').eq('phone_number', oldPhone);
  console.log('Profile found:', prof, pErr);

  if (prof && prof.length > 0) {
    const { error: updErr } = await supabase.from('profiles').update({ phone_number: newPhone }).eq('phone_number', oldPhone);
    console.log('Profile update error:', updErr);
  } else {
    // Just in case, update all profiles with +62
    const { data: allProfs } = await supabase.from('profiles').select('id, phone_number').like('phone_number', '+62%');
    console.log('All +62 profiles:', allProfs);
    for (const p of allProfs) {
      let nPhone = p.phone_number.replace(/\D/g, '');
      if (nPhone.startsWith('62')) nPhone = '0' + nPhone.slice(2);
      await supabase.from('profiles').update({ phone_number: nPhone }).eq('id', p.id);
      console.log('Fixed profile:', p.id, nPhone);
    }
  }

  // Same for dealers
  const { data: allDealers } = await supabase.from('dealers').select('id, phone').like('phone', '+62%');
  if (allDealers) {
    for (const d of allDealers) {
      let nPhone = d.phone.replace(/\D/g, '');
      if (nPhone.startsWith('62')) nPhone = '0' + nPhone.slice(2);
      await supabase.from('dealers').update({ phone: nPhone }).eq('id', d.id);
      console.log('Fixed dealer:', d.id, nPhone);
    }
  }
}

fixPhone();
