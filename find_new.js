const { Client } = require('pg');
const connectionString = 'postgresql://postgres:4tPQsvniyOdLKzdD@db.rbezcgrxokzhtslrxuta.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  const res = await client.query("SELECT id, sku, name FROM products WHERE name ILIKE '%new%' OR sku ILIKE '%new%';");
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
