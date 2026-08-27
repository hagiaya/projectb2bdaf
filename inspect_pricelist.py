import pandas as pd

try:
    df = pd.read_excel('pricelist.xlsx')
    print("Columns:", df.columns.tolist())
    print("First 5 rows:")
    print(df.head(5).to_string())
except Exception as e:
    print("Error reading Excel:", e)
