"""
Commercial Master Data Analysis Script
Analyzes the Benz Packaging Commercial Master Excel file
"""
import pandas as pd

# Load Excel file
xl = pd.ExcelFile(r'c:\Users\laxmi\performance\app\data\Commercial Master  dt. 22.08.2025 (1).xls')

print("=" * 80)
print("BENZ PACKAGING - COMMERCIAL MASTER DATA ANALYSIS")
print("=" * 80)

# 1. ITEM TYPE-CATEGORY (Product Categories)
print("\n" + "=" * 60)
print("1. ITEM TYPE-CATEGORY (Product Categories) - 291 rows")
print("=" * 60)
df_cat = pd.read_excel(xl, sheet_name='Item Type-Categort')
print("Columns:", list(df_cat.columns))
print("\nUnique Categories (first 50):")
if 'Item Cat./Lowest Category' in df_cat.columns:
    print(df_cat['Item Cat./Lowest Category'].unique()[:50].tolist())

# 2. ITEM MASTER (Products)
print("\n" + "=" * 60)
print("2. ITEM MASTER (Products) - 2381 rows")
print("=" * 60)
df_items = pd.read_excel(xl, sheet_name='Item Master')
print("Columns:", list(df_items.columns))
print("\nSample product row (first complete row):")
print(df_items.iloc[0])

# 3. HSN MASTER
print("\n" + "=" * 60)
print("3. HSN MASTER - 90 rows")
print("=" * 60)
df_hsn = pd.read_excel(xl, sheet_name='HSN Master')
print("Columns:", list(df_hsn.columns))
print("\nSample HSN codes:")
print(df_hsn.head(10))

# 4. PARTY MASTER (Customers)
print("\n" + "=" * 60)
print("4. PARTY MASTER (Customers) - 1634 rows")
print("=" * 60)
df_party = pd.read_excel(xl, sheet_name='Party Master')
print("Columns:", list(df_party.columns))
print("\nSample customer:")
print(df_party.iloc[0])

# 5. GST MASTER
print("\n" + "=" * 60)
print("5. GST MASTER - 26 rows")
print("=" * 60)
df_gst = pd.read_excel(xl, sheet_name='GST Master')
print("Columns:", list(df_gst.columns))
print(df_gst.head(10))

# 6. ZONE MASTER
print("\n" + "=" * 60)
print("6. ZONE MASTER - 37 rows")
print("=" * 60)
df_zone = pd.read_excel(xl, sheet_name='Zone Master')
print("Columns:", list(df_zone.columns))
print(df_zone.head(15))

# 7. STATE MASTER
print("\n" + "=" * 60)
print("7. STATE MASTER - 36 rows")
print("=" * 60)
df_state = pd.read_excel(xl, sheet_name='State Master')
print("Columns:", list(df_state.columns))
print(df_state.head(10))
