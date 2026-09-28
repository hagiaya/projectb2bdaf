const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  if (!res.ok) console.error(data);
  else console.log(Object.keys(data[0] || {}));
}
check();
