import pandas as pd
import math

EXCEL_PATH = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/paling final.xlsx"
SQL_OUTPUT_PATH = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/final_sync_db.sql"

def escape_sql_string(s):
    if pd.isna(s):
        return "''"
    return "'" + str(s).replace("'", "''") + "'"

print("Membaca file Excel...")
df = pd.read_excel(EXCEL_PATH)
print(f"Read {len(df)} rows dari Excel.")

categories_list = [
    'Headphone Gaming', 'headset', 'tripod / tongsis', 'CCTV Camera',
    'Flashdisk USB', 'Flashdisk type-c', 'flasdisk micro', 'smartwatch',
    'keyboard komputer', 'headset bluetooth (TWS)', 'Antigores & Back Stiker',
    'Speaker Multimedia', 'Converter / OTG / Card Reader', 'Kabel Data',
    'Aksesoris Komputer', 'charger', 'Power Bank', 'Adaptor Charger',
    'Car Holder', 'Mic Karaoke Bluetooth', 'mouse komputer', 'pengikat kabel',
    'bantal leher', 'phone holder stand', 'kipas desktop/ kipas mini turbo',
    'Car Charger', 'kabe audio', 'audio adapter', 'sarung jari gaming',
    'micro sd', 'speaker bluetooth'
]

sql_statements = [
    "-- SQL Script to FULLY SYNC Categories and Products",
    "BEGIN;",
    ""
]

# 1. Insert missing categories
sql_statements.append("-- 1. Insert Categories if missing")
for cat in categories_list:
    sql = f"""
    INSERT INTO public.categories (name)
    SELECT {escape_sql_string(cat)}
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories WHERE name = {escape_sql_string(cat)}
    );
    """
    sql_statements.append(sql.strip())

sql_statements.append("")

# 2. Upsert products
sql_statements.append("-- 2. Upsert Products from Excel")
valid_skus = []

for index, row in df.iterrows():
    sku = str(row.get("SKU", "")).strip().upper()
    price_val = row.get("HARGA", 0)
    name = str(row.get("DESKRIPSI", "")).strip()
    cat_raw = str(row.get("KATEGORI", "")).strip()
    
    if not sku or sku == 'NAN':
        continue
        
    valid_skus.append(sku)
    
    is_habis = "habis" in name.lower() or "(habis)" in name.lower() or "sold out" in name.lower()
    
    try:
        price = float(price_val)
        if math.isnan(price):
            price = 0
    except:
        price = 0
        
    stock_value = 0 if is_habis else 100
    
    sql = f"""
    INSERT INTO public.products (sku, name, price, stock, category_id)
    VALUES (
        {escape_sql_string(sku)}, 
        {escape_sql_string(name)}, 
        {price}, 
        {stock_value},
        (SELECT id FROM public.categories WHERE name = {escape_sql_string(cat_raw)} LIMIT 1)
    )
    ON CONFLICT (sku) DO UPDATE 
    SET price = EXCLUDED.price, 
        stock = EXCLUDED.stock, 
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id;
    """
    sql_statements.append(sql.strip())

sql_statements.append("")

# 3. Soft-delete (Archive) products not in Excel
sql_statements.append("-- 3. Soft-delete (Archive) Products NOT in Excel (to avoid breaking old orders)")
sku_list_sql = ", ".join([escape_sql_string(s) for s in valid_skus])
if valid_skus:
    sql_statements.append(f"UPDATE public.products SET status = 'INACTIVE' WHERE sku NOT IN ({sku_list_sql});")
    sql_statements.append(f"UPDATE public.products SET status = 'ACTIVE' WHERE sku IN ({sku_list_sql});")

sql_statements.append("")

# 4. Delete categories not in the list safely
sql_statements.append("-- 4. Delete Categories NOT in the final list")
cat_list_sql = ", ".join([escape_sql_string(c) for c in categories_list])

# First, unlink products from the categories we are about to delete to avoid foreign key constraints
sql_statements.append(f"UPDATE public.products SET category_id = NULL WHERE category_id IN (SELECT id FROM public.categories WHERE name NOT IN ({cat_list_sql}));")

# Now delete the categories safely
sql_statements.append(f"DELETE FROM public.categories WHERE name NOT IN ({cat_list_sql});")

sql_statements.append("\nCOMMIT;")

with open(SQL_OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print(f"Berhasil membuat script SQL di: {SQL_OUTPUT_PATH}")
