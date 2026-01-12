"""
Deep Analysis of Benz Packaging Product Data
Analyzes both Commercial Master Excel and ITEMACTIVE CSV
"""
import pandas as pd
import json

output_file = open(r'c:\Users\laxmi\performance\app\data\deep_analysis.txt', 'w', encoding='utf-8')

def log(text):
    print(text)
    output_file.write(text + '\n')

log("=" * 100)
log("BENZ PACKAGING - DEEP PRODUCT DATA ANALYSIS")
log("=" * 100)

# =====================================================================
# PART 1: ITEMACTIVE CSV (6,448 items)
# =====================================================================
log("\n" + "=" * 80)
log("PART 1: ITEMACTIVE CSV (6,448 Active Products)")
log("=" * 80)

df_csv = pd.read_csv(r'c:\Users\laxmi\performance\app\data\ITEMACTIVE - Sheet 1.csv', encoding='utf-8', on_bad_lines='skip')
log(f"\nTotal Products: {len(df_csv)}")
log(f"Columns: {list(df_csv.columns)}")

# Sample rows
log("\n--- SAMPLE PRODUCTS (first 30) ---")
for idx, row in df_csv.head(30).iterrows():
    log(f"  {row['IT_PARTNO']:25} | {row['IT_PARTNAME'][:50]:50} | {row['UOM']}")

# Unique UOMs (Units of Measure)
log("\n--- UNIQUE UNITS OF MEASURE (UOM) ---")
uom_counts = df_csv['UOM'].value_counts()
for uom, count in uom_counts.items():
    log(f"  {uom}: {count} products")

# Part Code Patterns (analyze the naming convention)
log("\n--- PART CODE PATTERNS (IT_PARTNO) ---")
# Get first 100 unique part codes
unique_parts = df_csv['IT_PARTNO'].dropna().unique()[:100]
log("Sample Part Codes:")
for pc in unique_parts[:50]:
    log(f"  {pc}")

# Analyze Part Name patterns
log("\n--- PRODUCT TYPE ANALYSIS (from IT_PARTNAME) ---")
product_types = {}
for name in df_csv['IT_PARTNAME'].dropna().unique():
    # Extract first word as product type
    first_word = str(name).split()[0].upper() if pd.notna(name) and str(name).strip() else 'OTHER'
    product_types[first_word] = product_types.get(first_word, 0) + 1

# Sort by count
sorted_types = sorted(product_types.items(), key=lambda x: x[1], reverse=True)[:50]
log("\nTop 50 Product Types (by first word):")
for ptype, count in sorted_types:
    log(f"  {ptype}: {count} products")

# =====================================================================
# PART 2: Commercial Master Excel Deep Dive
# =====================================================================
log("\n" + "=" * 80)
log("PART 2: COMMERCIAL MASTER EXCEL - DEEP DIVE")
log("=" * 80)

xl = pd.ExcelFile(r'c:\Users\laxmi\performance\app\data\Commercial Master  dt. 22.08.2025 (1).xls')

# Item Type-Category Analysis
log("\n--- ITEM CATEGORIES (Full List) ---")
df_cat = pd.read_excel(xl, sheet_name='Item Type-Categort')
# Get the actual category column
if len(df_cat.columns) > 0:
    cat_col = df_cat.columns[0]
    categories = df_cat[cat_col].dropna().unique()
    log(f"Total Unique Categories: {len(categories)}")
    log("\nAll Categories:")
    for i, cat in enumerate(categories[:100], 1):
        log(f"  {i}. {cat}")

# Item Master - Deep analysis
log("\n--- ITEM MASTER DEEP ANALYSIS ---")
df_items = pd.read_excel(xl, sheet_name='Item Master')
log(f"Total Items in Item Master: {len(df_items)}")

# Column analysis
log("\nColumn Analysis:")
for col in df_items.columns:
    non_null = df_items[col].notna().sum()
    unique = df_items[col].nunique()
    log(f"  {col}: {non_null} values, {unique} unique")

# HSN Code distribution
log("\n--- HSN CODE DISTRIBUTION ---")
if 'HSN Code' in df_items.columns:
    hsn_counts = df_items['HSN Code'].value_counts().head(20)
    for hsn, count in hsn_counts.items():
        log(f"  {hsn}: {count} products")

# Item Categories in Item Master
log("\n--- CATEGORIES USED IN ITEM MASTER ---")
if 'Item Cat./Lowest Category ' in df_items.columns:
    cat_counts = df_items['Item Cat./Lowest Category '].value_counts().head(30)
    for cat, count in cat_counts.items():
        log(f"  {cat}: {count} items")

# GST Rate distribution
log("\n--- GST RATE DISTRIBUTION ---")
if 'IGST Rate' in df_items.columns:
    gst_counts = df_items['IGST Rate'].value_counts()
    for rate, count in gst_counts.items():
        log(f"  {rate}%: {count} products")

# Party Master Analysis
log("\n--- PARTY MASTER (CUSTOMERS) ANALYSIS ---")
df_party = pd.read_excel(xl, sheet_name='Party Master', header=1)  # Skip first row as header
log(f"Columns: {list(df_party.columns)[:15]}")  # First 15 columns
log(f"\nSample customers (first 20):")
# Find the party name column
party_col = df_party.columns[0] if len(df_party.columns) > 0 else None
if party_col:
    for i, row in df_party.head(20).iterrows():
        log(f"  {row[party_col]}")

# Zone Master
log("\n--- ZONE MASTER (Sales Territories) ---")
df_zone = pd.read_excel(xl, sheet_name='Zone Master', header=1)
log(f"Columns: {list(df_zone.columns)}")
log("\nZone Details:")
for idx, row in df_zone.head(40).iterrows():
    log(f"  {row.values}")

output_file.close()
print("\n\n=== ANALYSIS COMPLETE ===")
print("Full analysis saved to: data/deep_analysis.txt")
