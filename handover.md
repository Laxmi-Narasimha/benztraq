# BENZTRAQ - Complete Project Handover Document

**For: Incoming AI Agent**  
**Version: 1.0**  
**Date: January 2026**  
**Previous AI: Antigravity (Google DeepMind)**

---

## TABLE OF CONTENTS
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [The Two Companies](#4-the-two-companies)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Database Schema](#6-database-schema)
7. [API Routes](#7-api-routes)
8. [Frontend Pages](#8-frontend-pages)
9. [Authentication System](#9-authentication-system)
10. [Odoo Integration](#10-odoo-integration)
11. [Current Shortcomings](#11-current-shortcomings)
12. [Planned Features](#12-planned-features)
13. [Environment Setup](#13-environment-setup)
14. [Critical Files Reference](#14-critical-files-reference)

---

## 1. PROJECT OVERVIEW

BENZTRAQ is a **Sales Performance Tracking & CRM System** for **Benz Packaging Solutions Pvt Ltd**, a B2B industrial packaging company based in India.

### Business Context
- **Industry**: Industrial VCI (Volatile Corrosion Inhibitor) packaging
- **Products**: VCI films, VCI papers, VCI bags, wooden packaging, desiccants, strapping machines
- **Customers**: OEMs, automotive, aerospace, pharmaceutical, manufacturing companies
- **Sales Model**: B2B with Area Sales Managers (ASMs) covering different regions

### What the App Does
1. **Dashboard**: Sales performance metrics, charts, KPIs per ASM
2. **CRM**: Lead management, pipeline tracking
3. **Quotations**: Create Odoo-style quotations with line items, taxes, discounts
4. **Customer Management**: Full customer master with addresses, contacts
5. **Product Management**: Product catalog with HSN codes, GST rates
6. **Targets**: Set and track annual sales targets per ASM
7. **Document Management**: Upload, extract, and process PDFs (invoices, quotations)
8. **ERGOPACK**: Separate contact tracking module for Ergopack India division

---

## 2. TECH STACK

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Custom JWT + Supabase Auth |
| **Styling** | Tailwind CSS + Radix UI primitives |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Deployment** | Vercel (recommended) |
| **Reference System** | Odoo 17 (bpspl.odoo.com, bpspl.odoo.sh) |

### Key Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "tailwindcss": "3.x",
  "@supabase/supabase-js": "2.x",
  "recharts": "2.x",
  "lucide-react": "latest",
  "bcryptjs": "2.x",
  "jose": "5.x"
}
```

---

## 3. PROJECT STRUCTURE

```
c:\Users\laxmi\performance\app\
├── src\
│   ├── app\                        # Next.js App Router
│   │   ├── (dashboard)\            # Main dashboard pages (protected)
│   │   │   ├── analytics\          # Analytics & reports
│   │   │   ├── crm\                # CRM/Leads management
│   │   │   ├── customers\          # Customer master
│   │   │   ├── dashboard\          # Main dashboard
│   │   │   ├── documents\          # Quotations, invoices, SOs
│   │   │   ├── products\           # Product catalog
│   │   │   ├── targets\            # Sales targets
│   │   │   └── layout.jsx          # Dashboard layout with sidebar
│   │   ├── api\                    # API Routes
│   │   │   ├── admin\              # Admin APIs (seed, user management)
│   │   │   ├── auth\               # Login, logout, session
│   │   │   ├── crm\                # CRM/Leads CRUD
│   │   │   ├── customers\          # Customer CRUD
│   │   │   ├── documents\          # Documents CRUD
│   │   │   ├── ergopack\           # Ergopack-specific APIs
│   │   │   ├── products\           # Products CRUD
│   │   │   └── targets\            # Targets CRUD
│   │   ├── ergopack\               # ERGOPACK standalone module
│   │   ├── login\                  # Login page
│   │   └── auth\                   # Auth UI pages
│   ├── components\                 # Reusable components
│   ├── lib\                        # Utilities
│   │   ├── supabase\               # Supabase client config
│   │   └── utils\                  # Helpers
│   │       ├── rbac.js             # ⭐ CRITICAL: Role-based access control
│   │       └── session.js          # ⭐ CRITICAL: JWT session management
│   └── services\                   # Business logic services
│       └── partnerService.js       # Odoo partner validation
├── supabase\
│   └── migrations\                 # SQL migration files (001-033)
├── .env.local                      # Environment variables
└── package.json
```

---

## 4. THE TWO COMPANIES

The system manages TWO separate business units under Benz Packaging:

### 4.1 BENZ (Main Company)
- **URL Path**: `/dashboard`, `/documents`, `/customers`, `/crm`, etc.
- **Focus**: VCI packaging products, B2B sales
- **Users**: Developer, Directors, Head of Sales (Pulak), 6 ASMs
- **Data**: Customers table, Products table, Documents table, CRM leads

### 4.2 ERGOPACK
- **URL Path**: `/ergopack`, `/ergopack/contacts`
- **Focus**: Ergopack India - strapping machines and tools
- **Users**: Developer, Directors, Head of Sales (Isha)
- **Data**: Separate `ergopack_contacts` table, `ergopack_activities` table
- **Note**: Completely separate contact tracking, NOT shared with BENZ

### Access Control by Company
| User | BENZ Access | ERGOPACK Access |
|------|-------------|-----------------|
| Laxmi (Developer) | ✅ | ✅ |
| Manan Chopra (Director) | ✅ | ✅ |
| Chaitanya Chopra (Director) | ✅ | ✅ |
| Prashansa Madan (Director) | ✅ | ✅ |
| Pulak Biswas (Head of Sales) | ✅ | ❌ |
| Isha (Head of Sales) | ❌ | ✅ |
| All ASMs | ✅ | ❌ |

---

## 5. USER ROLES & PERMISSIONS

### 5.1 Role Hierarchy (Highest to Lowest)

```
DEVELOPER (Level 10)
    └── Full system access, can manage users, see all data
    └── User: Laxmi

DIRECTOR (Level 5)
    └── Full access to both companies, can set targets
    └── Users: Manan Chopra, Chaitanya Chopra, Prashansa Madan

HEAD_OF_SALES (Level 5)
    └── Company-specific access, can see team data
    └── Users: Pulak Biswas (Benz), Isha (Ergopack)

ASM (Level 1)
    └── Region-specific access, can only see own data
    └── Users: 6 regional ASMs (see below)
```

### 5.2 ASM Regions (BENZ only)
| ASM Name | Email | Region |
|----------|-------|--------|
| Madhya Pradesh | abhishek@benz-packaging.com | Madhya Pradesh |
| Rajasthan | wh.jaipur@benz-packaging.com | Rajasthan |
| Karnataka | banglore@benz-packaging.com | Karnataka |
| Maharashtra | rfq@benz-packaging.com | Maharashtra |
| Noida | it@benz-packaging.com | Noida |
| West Zone | west@benz-packaging.com | West Zone |

### 5.3 RBAC Source of Truth
**File**: `src/lib/utils/rbac.js`

This file is the **SINGLE SOURCE OF TRUTH** for:
- All user definitions (`SYSTEM_USERS` object)
- Role checking functions (`isDeveloper()`, `isManager()`, `isASM()`)
- Permission functions (`canSetTargets()`, `canViewAllData()`, `hasCompanyAccess()`)
- Data filtering (`getDataAccessFilter()`)

---

## 6. DATABASE SCHEMA

### 6.1 Core Tables

#### `profiles` - User profiles (linked to Supabase auth.users)
```sql
user_id UUID PRIMARY KEY  -- References auth.users(id)
full_name TEXT
email VARCHAR(255)
role_id UUID              -- FK to roles table
role user_role            -- Enum: 'vp', 'director', 'asm'
region_id UUID            -- FK to regions
companies TEXT[]          -- Array: ['benz', 'ergopack']
is_active BOOLEAN
password_hash TEXT        -- bcrypt hashed
```

#### `roles` - RBAC roles
```sql
id UUID PRIMARY KEY
name VARCHAR(50)          -- 'developer', 'head_of_sales', 'asm'
display_name VARCHAR(100)
level INTEGER             -- 10=dev, 5=head, 1=asm
```

#### `permissions` - Resource-level permissions
```sql
role_id UUID
resource VARCHAR(100)     -- 'users', 'documents', 'leads', etc.
can_read, can_write, can_create, can_delete BOOLEAN
scope VARCHAR(20)         -- 'own', 'team', 'all'
```

#### `regions` - Geographic regions
```sql
id UUID PRIMARY KEY
name TEXT UNIQUE          -- 'Gurgaon', 'Jaipur', 'Maharashtra', etc.
```

---

### 6.2 Customer Tables (Odoo-aligned)

#### `customers` - Customer/Partner master
```sql
-- Identification
id UUID PRIMARY KEY
customer_code VARCHAR(20) UNIQUE  -- 'CUST-00001'
name TEXT NOT NULL

-- Odoo Partner Type
company_type VARCHAR(20)  -- 'person' or 'company'
is_company BOOLEAN
parent_id UUID            -- Self-reference for child contacts
type VARCHAR(20)          -- 'contact', 'invoice', 'delivery', 'other'
function VARCHAR(100)     -- Job position (for individuals)

-- Address (flat on partner)
street, street2, city, zip VARCHAR
state_code VARCHAR(10)
country_id VARCHAR(10) DEFAULT 'IN'

-- Contact
email, phone, mobile, website VARCHAR

-- Indian Tax (Odoo l10n_in)
vat VARCHAR(20)                    -- GSTIN
l10n_in_pan VARCHAR(10)            -- PAN
l10n_in_gst_treatment VARCHAR(50)  -- 'regular', 'composition', 'consumer', etc.

-- Business
customer_group_id UUID    -- FK to customer_groups
industry_id UUID          -- FK to industries
region_id UUID            -- FK to regions
account_manager_id UUID   -- FK to profiles

-- Metrics
credit_limit DECIMAL
credit_days INTEGER
total_orders INTEGER
total_revenue DECIMAL
outstanding_amount DECIMAL
```

#### `customer_addresses` - Multiple addresses per customer
```sql
customer_id UUID NOT NULL  -- FK to customers (CASCADE DELETE)
address_title VARCHAR(100)
address_type VARCHAR(50)   -- 'Billing', 'Shipping'
address_line1, address_line2, city, state, pincode VARCHAR
is_primary_address BOOLEAN
is_shipping_address BOOLEAN
gstin VARCHAR(15)          -- State-specific GSTIN
```

#### `customer_contacts` - Multiple contacts per customer
```sql
customer_id UUID NOT NULL  -- FK to customers (CASCADE DELETE)
first_name, last_name VARCHAR
designation, department VARCHAR
email_id, phone, mobile_no VARCHAR
is_primary_contact BOOLEAN
is_billing_contact BOOLEAN
```

---

### 6.3 Product Tables

#### `products` - Product master (Odoo-style)
```sql
item_code VARCHAR(50) UNIQUE  -- 'VCI-FILM-100'
item_name VARCHAR(255)

-- Classification
item_group_id UUID        -- FK to item_groups
brand_id UUID             -- FK to brands

-- Flags
is_stock_item, is_sales_item, is_purchase_item BOOLEAN
disabled BOOLEAN

-- UOM
stock_uom VARCHAR(20)     -- 'Nos', 'Kg', 'Mtr'

-- Pricing
standard_rate DECIMAL(15,2)
max_discount DECIMAL(5,2)

-- India GST
hsn_sac_code VARCHAR(10)  -- '39201019'
gst_rate DECIMAL(5,2)     -- 18.00

-- Packaging-specific
length, width, height DECIMAL
thickness_micron DECIMAL
gsm DECIMAL               -- Grams per square meter
ply_count INTEGER
```

#### `item_groups` - Product categories (hierarchical)
```sql
name VARCHAR(100)
parent_id UUID            -- Self-reference for tree structure
is_group BOOLEAN
level INTEGER
path TEXT                 -- 'All/Packaging/VCI Films'
```

#### `price_lists` & `item_prices` - Multi-price list support
```sql
-- price_lists
name VARCHAR(100)         -- 'Standard Selling', 'Standard Buying'
is_buying, is_selling BOOLEAN
currency VARCHAR(3)       -- 'INR'

-- item_prices
product_id UUID
price_list_id UUID
price_list_rate DECIMAL
min_qty DECIMAL
valid_from, valid_to DATE
```

---

### 6.4 Document Tables

#### `documents` - Quotations, Sales Orders, Invoices
```sql
doc_type doc_type         -- Enum: 'quotation', 'sales_order', 'invoice'
doc_number TEXT           -- 'QTN-2026-00001'
doc_date DATE
customer_id UUID          -- FK to customers
salesperson_user_id UUID  -- FK to auth.users
status TEXT               -- 'draft', 'sent', 'won', 'lost'

-- Totals
subtotal DECIMAL(15,2)
discount_total DECIMAL(15,2)
tax_total DECIMAL(15,2)
grand_total DECIMAL(15,2)
```

#### `document_lines` - Line items
```sql
document_id UUID
product_id UUID
product_name_raw TEXT
qty DECIMAL
uom TEXT
unit_price DECIMAL
discount_amount DECIMAL
tax_amount DECIMAL
line_total DECIMAL
```

---

### 6.5 CRM Tables

#### `crm_lead` - Leads/Opportunities (Odoo-style)
```sql
name VARCHAR(255)         -- Lead title
partner_id UUID           -- FK to customers
type VARCHAR(20)          -- 'lead' or 'opportunity'
stage_id UUID             -- FK to crm_stage
expected_revenue DECIMAL
probability INTEGER       -- 0-100%
user_id UUID              -- Salesperson
date_deadline DATE
priority VARCHAR(10)      -- '0' to '3'
```

#### `crm_stage` - Pipeline stages
```sql
name VARCHAR(100)         -- 'New', 'Qualified', 'Proposition', 'Won', 'Lost'
sequence INTEGER
is_won, is_lost BOOLEAN
```

---

### 6.6 ERGOPACK Tables (Separate from Benz)

#### `ergopack_contacts` - Ergopack lead tracking
```sql
company_name VARCHAR(255)
contact_person VARCHAR(255)
email, phone, website VARCHAR
city, state, country VARCHAR
industry VARCHAR(100)
status VARCHAR(50)        -- 'new', 'contacted', 'interested', 'won', 'lost'
source VARCHAR(100)       -- 'linkedin', 'exhibition', 'referral'
priority VARCHAR(20)      -- 'low', 'medium', 'high', 'urgent'
notes TEXT
created_by UUID           -- FK to profiles
```

#### `ergopack_activities` - Activity log per contact
```sql
contact_id UUID           -- FK to ergopack_contacts
activity_type VARCHAR(50) -- 'call', 'email', 'meeting', 'note'
title VARCHAR(255)
description TEXT
scheduled_date DATE
completed BOOLEAN
```

---

### 6.7 Other Tables

| Table | Purpose |
|-------|---------|
| `annual_targets` | Sales targets per ASM per year |
| `sales_teams` | Team organization |
| `activity_log` | Audit trail |
| `gst_state_codes` | Indian state codes for GST |
| `hsn_codes` | HSN/SAC codes with GST rates |
| `brands` | Product brands |
| `res_partner_bank` | Bank accounts per customer |

---

## 7. API ROUTES

### 7.1 Authentication
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/session` | GET | Get current user |
| `/api/auth/me` | GET | Get user profile |

### 7.2 Customers
| Route | Method | Description |
|-------|--------|-------------|
| `/api/customers` | GET | List customers (paginated, filtered) |
| `/api/customers` | POST | Create new customer |
| `/api/customers/[id]` | GET | Get customer by ID |
| `/api/customers/[id]` | PUT | Update customer |
| `/api/customers/[id]` | DELETE | Delete customer |

### 7.3 Products
| Route | Method | Description |
|-------|--------|-------------|
| `/api/products` | GET | List products |
| `/api/products/search` | GET | Search products for autocomplete |
| `/api/products/[id]` | GET/PUT/DELETE | Single product CRUD |

### 7.4 Documents
| Route | Method | Description |
|-------|--------|-------------|
| `/api/documents` | GET | List documents |
| `/api/documents` | POST | Create quotation/SO/invoice |
| `/api/documents/[id]` | GET/PUT/DELETE | Single document CRUD |

### 7.5 CRM
| Route | Method | Description |
|-------|--------|-------------|
| `/api/crm/leads` | GET/POST | List/create leads |
| `/api/crm/leads/[id]` | GET/PUT/DELETE | Single lead CRUD |
| `/api/crm/stages` | GET | Get pipeline stages |

### 7.6 Targets
| Route | Method | Description |
|-------|--------|-------------|
| `/api/targets` | GET | Get targets for ASMs |
| `/api/targets` | POST | Set target (managers only) |

### 7.7 Ergopack
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ergopack/contacts` | GET/POST | List/create contacts |
| `/api/ergopack/contacts/[id]` | GET/PUT/DELETE | Single contact CRUD |
| `/api/ergopack/contacts/[id]/activities` | GET/POST | Contact activities |
| `/api/ergopack/presentations` | GET/POST | Presentation PDFs |

### 7.8 Admin
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/seed-users` | POST | Seed default users |
| `/api/admin/update-laxmi` | POST | Update developer user |

---

## 8. FRONTEND PAGES

### 8.1 Dashboard Layout (`/src/app/(dashboard)/layout.jsx`)
- Sidebar navigation
- User menu with company switcher
- Role-based menu visibility

### 8.2 Main Pages

| Path | Component | Description |
|------|-----------|-------------|
| `/dashboard` | Dashboard | KPIs, charts, sales metrics |
| `/documents` | Documents List | Quotations, SOs, invoices |
| `/documents/new` | New Quotation | Odoo-style quotation form |
| `/customers` | Customers List | Customer master |
| `/customers/new` | `OdooPartnerForm` | Odoo-style customer form |
| `/products` | Products List | Product catalog |
| `/crm` | CRM Pipeline | Kanban board for leads |
| `/targets` | Targets | Set/view sales targets |
| `/analytics` | Analytics | Charts and reports |

### 8.3 Ergopack Module

| Path | Component | Description |
|------|-----------|-------------|
| `/ergopack` | Ergopack Dashboard | Overview with recent leads |
| `/ergopack/contacts` | Contacts List | Full contact management |
| `/ergopack/contacts/new` | New Contact | Add new Ergopack lead |

---

## 9. AUTHENTICATION SYSTEM

### 9.1 How It Works
1. User submits email/password to `/api/auth/login`
2. Server validates credentials against `profiles.password_hash` (bcrypt)
3. If valid, creates JWT token with user info
4. JWT stored in HTTP-only cookie (`auth-token`)
5. Subsequent requests include cookie, verified by `getCurrentUser()`

### 9.2 Key Files
- **`src/lib/utils/session.js`**: JWT creation/verification, cookie handling
- **`src/app/api/auth/login/route.js`**: Login endpoint
- **`src/lib/supabase/server.js`**: Supabase admin client

### 9.3 Session Retrieval
```javascript
import { getCurrentUser } from '@/lib/utils/session';

export async function GET(request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // currentUser contains: id, email, full_name, role, region, companies
}
```

### 9.4 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://qyovguexmivhvefgbmkg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=benztraq-jwt-secret-2026-production-key
SEED_DEFAULT_PASSWORD=Benz@2024
SEED_DIRECTOR_PASSWORD=Hound@1102
```

---

## 10. ODOO INTEGRATION

### 10.1 Odoo Access
- **Production**: https://bpspl.odoo.com
- **Development Shell**: https://bpspl.odoo.sh
- **JupyterLab**: https://bpspl.odoo.com/odoo-sh/editor/lab

### 10.2 Schema Alignment
The database schema is designed to mirror Odoo's `res.partner` model:

| Odoo Field | Our Field | Table |
|------------|-----------|-------|
| `name` | `name` | customers |
| `company_type` | `company_type` | customers |
| `is_company` | `is_company` | customers |
| `parent_id` | `parent_id` | customers |
| `type` | `type` | customers |
| `function` | `function` | customers |
| `street`, `street2`, `city`, `zip` | Same | customers |
| `vat` | `vat` | customers |
| `l10n_in_gst_treatment` | `l10n_in_gst_treatment` | customers |
| `l10n_in_pan` | `l10n_in_pan` | customers |
| `property_payment_term_id` | `property_payment_term_id` | customers |

### 10.3 GST Treatment Values (India)
```sql
'regular'               -- Registered Business - Regular
'composition'           -- Registered Business - Composition
'unregistered'          -- Unregistered Business
'consumer'              -- Consumer
'overseas'              -- Overseas
'special_economic_zone' -- SEZ
'deemed_export'         -- Deemed Export
'uin_holders'           -- UIN Holders
```

### 10.4 Key Reference Files in Odoo
To study Odoo's implementation:
```
/src/odoo/odoo/addons/base/models/res_partner.py
/src/odoo/addons/l10n_in/models/res_partner.py
/src/odoo/addons/sale/models/sale_order.py
/src/odoo/addons/account/models/partner.py
```

---

## 11. CURRENT SHORTCOMINGS

### 11.1 Critical Issues
1. **Data Isolation in GET /api/customers**: Currently relaxed for testing. Need to re-enable strict region-based filtering for ASMs.
2. **Foreign Keys**: Some FK columns (`property_payment_term_id`, etc.) reference tables that don't exist yet.
3. **RLS Policies**: Some Row-Level Security policies may need adjustment.

### 11.2 UI Issues
1. **Auto-selection after customer creation**: When creating a new customer from the quotation page, the customer doesn't auto-populate in the dropdown after saving.
2. **Mobile responsiveness**: Some pages need mobile optimization.

### 11.3 Missing Features
1. **PDF generation**: Quotations can't be exported to PDF yet.
2. **Email sending**: No email integration.
3. **Stock/Inventory**: Not implemented.
4. **Invoicing**: Basic structure exists but not complete.
5. **Reports**: Analytics dashboard needs more polish.

---

## 12. PLANNED FEATURES

### 12.1 High Priority
- [ ] Complete quotation → sales order → invoice workflow
- [ ] PDF export for quotations and invoices
- [ ] Email notifications
- [ ] Re-enable data isolation for ASMs

### 12.2 Medium Priority
- [ ] Customer duplicate detection
- [ ] Product image upload
- [ ] Bulk import for customers/products
- [ ] Dashboard customization per role

### 12.3 Low Priority
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Advanced reporting
- [ ] Approval workflows

---

## 13. ENVIRONMENT SETUP

### 13.1 Local Development
```bash
cd c:\Users\laxmi\performance\app
npm install
npm run dev
# Opens at http://localhost:3000
```

### 13.2 Database Migrations
Migrations are in `supabase/migrations/`. They're numbered and should be run in order.

**To apply a new migration:**
1. Go to https://supabase.com/dashboard/project/qyovguexmivhvefgbmkg/sql/new
2. Paste the SQL content
3. Run

### 13.3 Seeding Users
After migrations, seed users:
```
POST /api/admin/seed-users
Headers: Content-Type: application/json
Body: { "password": "Benz@2024", "directorPassword": "Hound@1102" }
```

---

## 14. CRITICAL FILES REFERENCE

| Purpose | File Path |
|---------|-----------|
| RBAC (Users, Roles, Permissions) | `src/lib/utils/rbac.js` |
| Session/JWT Management | `src/lib/utils/session.js` |
| Supabase Client | `src/lib/supabase/server.js`, `client.js` |
| Customer API | `src/app/api/customers/route.js` |
| Auth API | `src/app/api/auth/login/route.js` |
| Dashboard Layout | `src/app/(dashboard)/layout.jsx` |
| Odoo Partner Form | `src/app/(dashboard)/documents/new/OdooPartnerForm.jsx` |
| Ergopack Layout | `src/app/ergopack/layout.jsx` |
| Migrations (Schema) | `supabase/migrations/*.sql` |
| Environment Variables | `.env.local` |

---

## FINAL NOTES FOR INCOMING AI

1. **Start by reading `rbac.js`** - It's the brain of the permission system.
2. **Check the latest migration** (`033_fix_customers_schema.sql`) for the most current schema.
3. **The two companies are SEPARATE** - BENZ data and ERGOPACK data never mix.
4. **Test on production** - User prefers testing directly on production Supabase, not localhost.
5. **Odoo is your reference** - When in doubt, check how Odoo does it at bpspl.odoo.sh.
6. **No placeholders** - User wants industry-grade, complete implementations.

Good luck! 🚀
