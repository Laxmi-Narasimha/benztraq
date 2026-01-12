"""
Customer Import Script
Imports 1,634 customers from Party Master Excel into Supabase
"""
import pandas as pd
import re

# Configuration
EXCEL_PATH = r"c:\Users\laxmi\performance\app\data\Commercial Master  dt. 22.08.2025 (1).xls"
SQL_OUTPUT = r"c:\Users\laxmi\performance\app\supabase\migrations\022_import_customers.sql"

def clean_gstin(gstin):
    """Validate and clean GSTIN"""
    if pd.isna(gstin):
        return None
    gstin = str(gstin).strip().upper()
    # GSTIN format: 2 digits + 10 alphanumeric + 1 digit + Z + 1 alphanumeric
    if len(gstin) == 15 and re.match(r'^[0-9]{2}[A-Z0-9]{10}[0-9]{1}Z[A-Z0-9]{1}$', gstin):
        return gstin
    return None

def clean_name(name):
    """Clean customer name for SQL"""
    if pd.isna(name):
        return None
    name = str(name).strip().replace("'", "''")
    return name if name else None

def main():
    print("=" * 60)
    print("BENZ PACKAGING - CUSTOMER IMPORT")
    print("=" * 60)
    
    # Load Excel
    print("\nLoading Party Master from Excel...")
    xl = pd.ExcelFile(EXCEL_PATH)
    df = pd.read_excel(xl, sheet_name='Party Master', header=2)  # Skip first 2 header rows
    
    print(f"Loaded {len(df)} rows")
    print(f"Columns: {list(df.columns)}")
    
    # Find the party name column
    party_col = None
    for col in df.columns:
        if 'party' in str(col).lower() or 'name' in str(col).lower():
            party_col = col
            break
    
    if not party_col:
        party_col = df.columns[0]
    
    print(f"Using column '{party_col}' as party name")
    
    # Generate SQL
    with open(SQL_OUTPUT, 'w', encoding='utf-8') as f:
        f.write("-- Auto-generated customer import from Party Master\n")
        f.write(f"-- Source: {EXCEL_PATH}\n\n")
        
        f.write("INSERT INTO customers (name, customer_code, created_at) VALUES\n")
        
        values = []
        seen_names = set()
        
        for idx, row in df.iterrows():
            name = clean_name(row.get(party_col))
            if not name or name in seen_names:
                continue
            
            seen_names.add(name)
            
            # Generate customer code from name
            code_base = ''.join(c for c in name[:5] if c.isalnum()).upper()
            code = f"{code_base}{len(values)+1:04d}"
            
            values.append(f"('{name}', '{code}', NOW())")
        
        f.write(',\n'.join(values))
        f.write("\nON CONFLICT (name) DO NOTHING;\n")
    
    print(f"\nGenerated SQL: {SQL_OUTPUT}")
    print(f"Unique customers: {len(values)}")
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE - Run SQL in Supabase")
    print("=" * 60)

if __name__ == "__main__":
    main()
