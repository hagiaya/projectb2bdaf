const { Client } = require('pg');
const fs = require('fs');

async function runSchema() {
  const connectionString = 'postgresql://postgres:4tPQsvniyOdLKzdD@db.rbezcgrxokzhtslrxuta.supabase.co:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to database");
    
    // 1. Run tables creation
    const tablesSql = fs.readFileSync('add_sales_tables.sql', 'utf8');
    await client.query(tablesSql);
    console.log("add_sales_tables.sql executed successfully.");
    
    // 2. Run functions and triggers creation
    const functionsSql = fs.readFileSync('add_sales_functions.sql', 'utf8');
    await client.query(functionsSql);
    console.log("add_sales_functions.sql executed successfully.");
    
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

runSchema();
