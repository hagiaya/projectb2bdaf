const { Client } = require('pg');
const fs = require('fs');

async function runSchema() {
  const connectionString = 'postgresql://postgres:4tPQsvniyOdLKzdD@db.rbezcgrxokzhtslrxuta.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to database");
    
    const schemaSql = fs.readFileSync('supabase_schema.sql', 'utf8');
    await client.query(schemaSql);
    console.log("Schema created successfully.");
    
    // Seed initial data
    const seedSql = `
      -- Insert dummy admin profile
      -- (Wait, we can't insert into auth.users directly easily, so we might skip auth.users insertion or just create regions/categories)
      
      INSERT INTO public.regions (code, name, manager_name) VALUES 
      ('REG-001', 'Jawa Timur', 'Ahmad Dani'),
      ('REG-002', 'Jawa Tengah', 'Budi Santoso')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO public.categories (name, description) VALUES
      ('Material', 'Semen, Pasir, dll'),
      ('Besi', 'Besi Beton, Kawat'),
      ('Cat', 'Cat Tembok, Kayu'),
      ('Keramik', 'Lantai, Dinding'),
      ('Pipa', 'PVC, Besi')
      ON CONFLICT DO NOTHING;
      
      -- Insert Products (Assuming categories were just inserted, we can fetch their IDs or just do it in code later, but let's do a subquery)
      INSERT INTO public.products (category_id, name, sku, price, stock, status) VALUES
      ((SELECT id FROM public.categories WHERE name = 'Material' LIMIT 1), 'Semen Gresik 40kg', 'SG-40', 55000, 1250, 'ACTIVE'),
      ((SELECT id FROM public.categories WHERE name = 'Besi' LIMIT 1), 'Besi Beton 10mm', 'BB-10', 78000, 500, 'ACTIVE'),
      ((SELECT id FROM public.categories WHERE name = 'Cat' LIMIT 1), 'Cat Tembok Dulux 5kg', 'CT-D5', 145000, 85, 'ACTIVE'),
      ((SELECT id FROM public.categories WHERE name = 'Keramik' LIMIT 1), 'Keramik Roman 40x40', 'KR-40', 95000, 200, 'ACTIVE'),
      ((SELECT id FROM public.categories WHERE name = 'Pipa' LIMIT 1), 'Pipa PVC Wavin 3/4"', 'PP-W34', 42000, 350, 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `;
    
    await client.query(seedSql);
    console.log("Seed data inserted successfully.");
    
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

runSchema();
