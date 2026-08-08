const { Client } = require('pg');
const fs = require('fs');

async function runSchema() {
  const connectionString = 'postgresql://postgres:4tPQsvniyOdLKzdD@db.rbezcgrxokzhtslrxuta.supabase.co:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to database");
    
    const sql = fs.readFileSync('add_tables.sql', 'utf8');
    await client.query(sql);
    console.log("add_tables.sql executed successfully.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

runSchema();
