# Sales Performance Tracker

A premium internal web application for tracking sales performance, quotations, and sales orders for manufacturing operations. Built with Next.js, Supabase, and OpenAI.

## Features

### Core Functionality
- **Document Management**: Upload PDFs or manually enter quotations, sales orders, and invoices
- **AI-Powered Extraction**: OpenAI extracts structured data from PDFs with review workflow
- **Premium Dashboards**: Interactive charts, KPIs, and tables with global filtering
- **Target Management**: Annual targets with monthly carryover logic
- **Quote vs Sales Order Comparison**: Price variance analysis with detailed breakdowns
- **Role-Based Access**: VP/Director see all data, ASM see only their own

### Key Metrics Tracked
- Total Sales (MTD/QTD/YTD)
- Target Achievement %
- Quote → Sales Order Conversion Rate
- Price Variance Analysis
- Regional & Product Performance

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, JavaScript, TailwindCSS |
| UI Components | shadcn/ui (23+ components) |
| Data Fetching | TanStack Query |
| Tables | TanStack Table |
| Charts | Recharts |
| Backend | Supabase (Auth + Postgres + Storage + Realtime) |
| AI | OpenAI GPT-4o with Structured Outputs |
| Validation | Zod |

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key

## Local Setup

### 1. Clone and Install

```bash
cd performance/app
npm install
```

### 2. Environment Variables

Create a `.env.local` file based on `env.example`:

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your keys
3. Open SQL Editor and run the migrations:

```sql
-- Run migrations/001_initial_schema.sql first
-- Then run migrations/002_rls_policies.sql
```

4. Create a storage bucket named `documents` (private)

### 4. Create Test Users

In Supabase Dashboard → Authentication → Users:

1. Create users with email/password
2. Add profiles via SQL Editor:

```sql
INSERT INTO profiles (user_id, full_name, role, region_id) VALUES
  ('user-uuid-here', 'Admin User', 'vp', NULL);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Netlify (Recommended for Commercial Use)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod
```

Add environment variables in Netlify Dashboard → Site Settings → Environment Variables.

### Vercel

> **Note**: Vercel Hobby tier is for non-commercial use only. For commercial/internal use, upgrade to Pro or use Netlify.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, TopBar, AppLayout
│   ├── dashboard/         # KPICard, charts
│   └── common/            # Loading, empty states
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── utils/             # Calculations, formatting, dates
│   └── schemas.js         # Zod validation schemas
└── providers/             # React context providers
```

## Database Schema

| Table | Description |
|-------|-------------|
| profiles | User profiles with roles (vp, director, asm) |
| regions | Pre-seeded regions (6 Indian regions) |
| customers | Customer master data |
| products | Product catalog with categories |
| documents | Document headers (quotation, sales_order, invoice) |
| document_lines | Line items with pricing |
| document_files | PDF storage metadata |
| extraction_runs | AI extraction history |
| quote_sales_links | Quote to Sales Order linking |
| annual_targets | Salesperson annual targets |
| ai_reports | Cached AI report narratives |

## Supabase Free Tier Limits

- Database: 500 MB
- File Storage: 1 GB
- Max Upload: 50 MB
- Projects pause after 7 days of inactivity

**Tip**: Use the Settings page to monitor storage usage.

## Key Files

- `supabase/migrations/001_initial_schema.sql` - Complete database schema
- `supabase/migrations/002_rls_policies.sql` - Row Level Security policies
- `src/lib/utils/calculations.js` - Target carryover and variance calculations
- `src/app/api/extract/route.js` - OpenAI PDF extraction

## License

Internal use only.
