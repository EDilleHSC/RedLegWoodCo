# RedLeg Hardwood Calculator — Vercel + Supabase Deployment Guide

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier works)
- A [Supabase](https://supabase.com) account (free tier works)
- Node.js 18+ installed locally
- Git installed locally

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Choose a region close to your users (e.g., `us-east-1`).
3. Set a strong database password — you'll need it for the connection string.
4. Wait for the project to finish provisioning (~2 minutes).

---

## Step 2 — Run the Database Migration

1. In the Supabase dashboard, go to **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase-migration.sql` into the editor.
3. Click **Run**.
4. Verify: Go to **Table Editor** — you should see 5 tables:
   - `suppliers`
   - `price_sheets`
   - `projects`
   - `project_items`
   - `settings` (with 3 default rows)

---

## Step 3 — Get Your Connection Strings

1. In Supabase dashboard → **Settings** → **Database**.
2. Scroll to **Connection string** section.
3. Copy the **Transaction** (pooler) URI — port `6543`. This is your `DATABASE_URL`.
4. Copy the **Session** (direct) URI — port `5432`. This is your `DIRECT_URL`.
5. Replace `[YOUR-PASSWORD]` in both URIs with your actual database password.
6. For the `DATABASE_URL`, append `?pgbouncer=true` to the end if not already present.

Example:
```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## Step 4 — Prepare the Prisma Schema for Supabase

The schema is already configured for PostgreSQL. Before deploying, update `prisma/schema.prisma`:

1. **Remove** the hardcoded `output` path in the `generator client` block (if present).
2. **Add** `directUrl` to the datasource:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

The `directUrl` lets Prisma use the direct connection for migrations while using the pooled connection at runtime.

---

## Step 5 — Prepare next.config.js for Vercel

The current config is already Vercel-compatible. The key settings:

```js
const nextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};
```

You can **remove** the `distDir`, `output`, and `experimental.outputFileTracingRoot` settings — those are only for the Abacus AI build pipeline. For Vercel, a clean config is best:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};

module.exports = nextConfig;
```

---

## Step 6 — Push to GitHub

1. Create a new GitHub repo (public or private).
2. Initialize git and push:

```bash
cd nextjs_space
git init
git add .
git commit -m "Initial commit — RedLeg Hardwood Calculator"
git branch -M main
git remote add origin https://github.com/YOUR-USER/redleg-hardwood-calc.git
git push -u origin main
```

**Important:** Make sure `.env` is in `.gitignore` — never commit secrets.

---

## Step 7 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Vercel auto-detects Next.js — accept the defaults.
3. **Before deploying**, add these environment variables in the Vercel dashboard:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URI (port 6543) with `?pgbouncer=true` | ✅ Yes |
| `DIRECT_URL` | Supabase Direct URI (port 5432) | ✅ Yes |
| `ABACUSAI_API_KEY` | Your Abacus AI API key (for PDF parsing) | ✅ Yes* |
| `NEXTAUTH_URL` | Your Vercel deployment URL | ✅ Yes |

\* The PDF upload feature requires an LLM API key. See [LLM API Options](#llm-api-options) below.

4. Add a **build command override** (Settings → General → Build Command):

```bash
prisma generate && next build
```

5. Click **Deploy**.

---

## Step 8 — Seed Default Settings

The migration SQL already seeds the 3 default settings rows. If you need to re-seed:

```sql
INSERT INTO "settings" ("key", "value") VALUES
  ('default_tax_rate', '0'),
  ('dark_mode', 'true'),
  ('default_supplier_id', '')
ON CONFLICT ("key") DO NOTHING;
```

---

## Step 9 — Verify

1. Open your Vercel deployment URL.
2. You should see the RedLeg Hardwood Calculator dashboard.
3. Test: Create a supplier, upload a price sheet PDF, run a board-foot calculation.

---

## LLM API Options

The PDF parser sends uploaded price-sheet PDFs to an LLM for extraction. It currently uses the **Abacus AI RouteLLM** endpoint.

### Option A — Keep Abacus AI (recommended, no code changes)
- Sign up at [abacus.ai](https://abacus.ai)
- Get an API key from Settings → API Keys
- Set `ABACUSAI_API_KEY` in Vercel env vars
- Endpoint used: `https://apps.abacus.ai/v1/chat/completions`

### Option B — Switch to OpenAI
- Get an API key from [platform.openai.com](https://platform.openai.com)
- In `app/api/upload/pdf/route.ts`, change:
  - Line 94: `const apiKey = process.env.OPENAI_API_KEY;`
  - Line 99: URL to `https://api.openai.com/v1/chat/completions`
- Set `OPENAI_API_KEY` in Vercel env vars

### Option C — Any OpenAI-compatible API
- The parser uses standard OpenAI chat/completions format
- Change the URL and API key env var name to match your provider

---

## File Storage (Optional)

The current setup uses AWS S3 for storing uploaded PDF files. For Vercel deployment:

### If you need file storage:
- Create an S3 bucket (or use Supabase Storage)
- Set `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_FOLDER_PREFIX`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` in Vercel env vars

### If you don't need file storage:
- The PDF parser reads the file content directly from the upload — it doesn't require S3
- You can skip all AWS env vars

---

## Troubleshooting

### "Database connection failed"
- Verify your `DATABASE_URL` uses port `6543` (pooler) and has `?pgbouncer=true`
- Check that your Supabase project is active (not paused)
- Verify the password is correct

### "API key not configured"
- Set `ABACUSAI_API_KEY` (or your chosen LLM provider key) in Vercel env vars
- Redeploy after adding env vars

### Prisma errors on build
- Make sure `prisma generate` runs before `next build` (build command: `prisma generate && next build`)
- Remove the `output` and `binaryTargets` fields from `prisma/schema.prisma` generator block

### Tables don't exist
- Run `supabase-migration.sql` in the Supabase SQL Editor
- Or run `npx prisma db push` locally with `DIRECT_URL` set

---

## Project Structure

```
nextjs_space/
├── app/
│   ├── api/                    # API routes
│   │   ├── health/             # GET  /api/health
│   │   ├── suppliers/          # CRUD /api/suppliers
│   │   ├── projects/           # CRUD /api/projects
│   │   ├── project-items/      # CRUD /api/project-items
│   │   ├── price-lookup/       # GET  /api/price-lookup
│   │   ├── settings/           # GET/PUT /api/settings
│   │   ├── upload/pdf/         # POST /api/upload/pdf
│   │   └── data/clear/         # POST /api/data/clear
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # React components
│   ├── app-shell.tsx           # Main shell + dashboard
│   ├── calculator/
│   ├── estimator/
│   ├── suppliers/
│   ├── upload/
│   └── settings/
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── aws-config.ts           # S3 config (optional)
│   └── s3.ts                   # S3 helpers (optional)
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/
│   └── seed.ts                 # Seed default settings
├── .env.example                # Template for env vars
├── supabase-migration.sql      # SQL to create all tables
├── DEPLOYMENT.md               # This file
└── next.config.js
```

---

## Version

RedLeg Hardwood Calculator v4.2
