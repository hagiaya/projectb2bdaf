import pandas as pd
import sys

try:
    df = pd.read_excel('Daftar_Produk_DAP_08-08-2026.xlsx')
    print("Columns:", df.columns.tolist())
    print("First 3 rows:")
    print(df.head(3).to_string())
except Exception as e:
    print("Error reading Excel:", e)
