# BenzTraq — User Credentials & Password Reset Guide

> **Last Updated:** 2 March 2026

---

## Default Password for All Users

```
Benz@2024
```

Unless a user has changed their password, they can log in with the above.

Directors (Manan, Chaitanya, Prashansa) may have a separate password: `Hound@1102`

---

## All Users

### Directors (can access both Benz & Ergopack)

| Name | Email | Password | Organization | Companies |
|------|-------|----------|-------------|-----------|
| Manan Chopra | manan@benz-packaging.com | `Hound@1102` | benz_packaging | benz, ergopack |
| Chaitanya Chopra | chaitanya@benz-packaging.com | `Hound@1102` | benz_packaging | benz, ergopack |
| Prashansa Madan | prashansa@benz-packaging.com | `Hound@1102` | benz_packaging | benz, ergopack |

### Developer

| Name | Email | Password | Organization | Companies |
|------|-------|----------|-------------|-----------|
| Laxmi | laxmi@benz-packaging.com | `Benz@2024` | benz_packaging | benz, ergopack |

### Head of Sales / Manager

| Name | Email | Password | Organization | Companies |
|------|-------|----------|-------------|-----------|
| Isha Mahajan | isha@benz-packaging.com | `Benz@2024` | ergopack_india | ergopack |
| Pulak Biswas | pulak@benz-packaging.com | `Benz@2024` | benz_packaging | benz |

### Area Sales Managers (ASMs)

| Name | Email | Password | Organization | Companies |
|------|-------|----------|-------------|-----------|
| Maharashtra | rfq@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Noida | it@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| West Zone | west@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Pune | pune@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Karnataka | bangalore@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Chennai | chennai@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Madhya Pradesh | abhishek@benz-packaging.com | `Benz@2024` | benz_packaging | benz |
| Rajasthan | wh.jaipur@benz-packaging.com | `Benz@2024` | benz_packaging | benz |

### Store Manager

| Name | Email | Password | Organization | Companies |
|------|-------|----------|-------------|-----------|
| Store Manager | store@benz-packaging.com | `Benz@2024` | benz_packaging | benz |

### Employees (all Benz, all `Benz@2024`)

| Name | Email |
|------|-------|
| Abhishek Kori | abhishek@benz-packaging.com |
| Accounts Chennai | accounts.chennai@benz-packaging.com |
| Accounts | accounts@benz-packaging.com |
| Ajay | ajay@benz-packaging.com |
| Aman Roy | dispatch1@benz-packaging.com |
| Anirudh Nama | anirudh@benz-packaging.com |
| Babita | sales3@benz-packaging.com |
| BENZ Sales | sales4@benz-packaging.com |
| Credit Control | credit@benz-packaging.com |
| Deepak Bhardwaj | deepak@benz-packaging.com |
| Dinesh | dinesh@benz-packaging.com |
| ERP Team | erp@benz-packaging.com |
| Gate Entry | gate@benz-packaging.com |
| HR Support | hr.support@benz-packaging.com |
| HR | hr@benz-packaging.com |
| Jayashree N | chennai@benz-packaging.com |
| Karan Batra | karan@benz-packaging.com |
| Karthick | karthick@benz-packaging.com |
| Lokesh | lokesh@benz-packaging.com |
| Mahesh Gupta | hr.manager@benz-packaging.com |
| Marketing | marketing@benz-packaging.com |
| Narender | warehouse@benz-packaging.com |
| Neeraj Singh | neeraj@benz-packaging.com |
| Neveta | neveta@benz-packaging.com |
| Paramveer Yadav | supplychain@benz-packaging.com |
| Pavan Kumar | pavan.kr@benz-packaging.com |
| Pawan (QA) | qa@benz-packaging.com |
| PO | po@benz-packaging.com |
| Pradeep Kumar | ccare2@benz-packaging.com |
| Preeti R | ccare6@benz-packaging.com |
| Rahul | rahul@benz-packaging.com |
| Rekha C | rekha@benz-packaging.com |
| Samish Thakur | samish@benz-packaging.com |
| Sandeep | sandeep@benz-packaging.com |
| Satender Singh | satender@benz-packaging.com |
| Sathees Waran | satheeswaran@benz-packaging.com |
| Saurav Kumar | saurav@benz-packaging.com |
| Shikha Sharma (CRM) | ccare@benz-packaging.com |
| Tanuj | sales7@benz-packaging.com |
| Tarun Bhardwaj | sales5@benz-packaging.com |
| Tomy Yamada | yamada@benz-packaging.com |
| TS Bhandari | bhandari@benz-packaging.com |
| Udit Suri | it@benz-packaging.com |
| Vijay Danieal | bangalore@benz-packaging.com |
| Vikky Dhanka | vikky@benz-packaging.com |
| Warehouse AP | warehouse.ap@benz-packaging.com |
| Ergopack India (Sales) | sales@ergopack-india.com |
| A.A. Paulraj | paulraj@benz-packaging.com |

---

## How to Reset a User's Password (Step-by-Step)

> This app does **NOT** use Supabase Auth for login. It uses its own `bcryptjs` password check against the `password_hash` column in the `profiles` table. So you only need to update that one column.

### Method: Run a Node Script (fastest, ~10 seconds)

**1. Open a terminal in `d:\performance\app`**

**2. Run this command** (replace the email and password as needed):

```bash
node -e "
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local','utf-8').split('\n').reduce((a,l)=>{const m=l.match(/^([^=]+)=(.*)$/);if(m)a[m[1]]=m[2].replace(/^\"|\"$/g,'').replace(/\\\\r|\\\\n/g,'');return a},{});
const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const EMAIL = 'isha@benz-packaging.com';   // <-- CHANGE THIS
const PASSWORD = 'Benz@2024';               // <-- CHANGE THIS

const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(PASSWORD, salt);
sb.from('profiles').update({password_hash:hash}).eq('email',EMAIL).select('email').then(({data,error})=>{
  if(error) console.log('ERROR:',error.message);
  else console.log('Password reset for',data[0].email,'to',PASSWORD);
});
"
```

**⚠️ If the above command fails due to PowerShell quoting issues**, use the pre-made script instead:

**3. Alternative: Use the reset script file**

Edit `d:\performance\app\scripts\fix_isha_password.mjs` — change the `email` and `password` variables at the top, then run:

```bash
node scripts/fix_isha_password.mjs
```

### Method: Run SQL in Supabase Dashboard

If you prefer doing it from the Supabase SQL editor, you need to generate a bcrypt hash first. Go to https://bcrypt-generator.com, enter the password with 12 rounds, then:

```sql
UPDATE public.profiles
SET password_hash = '<paste the generated hash here>'
WHERE email = 'isha@benz-packaging.com';
```

---

## Important Notes

- **The app login does NOT use Supabase Auth** — it only checks `profiles.password_hash` using bcryptjs
- **Supabase Auth** is used separately for session management after login
- If a user's `auth.users` record gets deleted, you need to recreate it (see `reset_isha_sql.md` for the full procedure — involves disabling the `on_auth_user_created` trigger)
- **Organization** field controls Ergopack access: must be `ergopack_india` to access `/ergopack` routes
- **Companies** array controls which company the user can select at login
- After changing organization/companies, the user must **log out and log back in** for changes to take effect (stored in JWT token)
