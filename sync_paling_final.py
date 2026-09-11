import os
import pandas as pd
import math

EXCEL_PATH = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/paling final.xlsx"
SQL_OUTPUT_PATH = "/Users/rezalatandrang/Documents/Kantor/Pribadi/project/projectb2b/sync_paling_final.sql"

def escape_sql_string(s):
    if pd.isna(s):
        return "''"
    return "'" + str(s).replace("'", "''") + "'"

print("Membaca file Excel...")
df = pd.read_excel(EXCEL_PATH)
print(f"Read {len(df)} rows dari Excel.")

sql_statements = [
    "-- SQL Script to Sync Products from paling final.xlsx",
    "BEGIN;",
    ""
]

for index, row in df.iterrows():
    sku = str(row.get("SKU", "")).strip().upper()
    price_val = row.get("HARGA", 0)
    name = str(row.get("DESKRIPSI", "")).strip()
    cat_raw = str(row.get("KATEGORI", "")).strip()
    
    if not sku or sku == 'NAN':
        continue
        
    is_habis = "habis" in name.lower() or "(habis)" in name.lower()
    
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

sql_statements.append("\nCOMMIT;")

with open(SQL_OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print(f"Berhasil membuat script SQL di: {SQL_OUTPUT_PATH}")
print("Silakan copy isi file tersebut dan jalankan di SQL Editor Supabase.")
