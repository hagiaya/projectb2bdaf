const { Client } = require('pg');
const connectionString = 'postgresql://postgres:4tPQsvniyOdLKzdD@db.rbezcgrxokzhtslrxuta.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log(res.rows.map(r => r.table_name));
  await client.end();
}
run();
