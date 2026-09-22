# LLM Conclave

Multi-model AI collaboration platform. Pit multiple LLMs against each other in a structured debate and get an AI-generated research report.

**Two products, one codebase:**
- **Open source** (this repo): BYOK, one-click deploy, no account required
- **[llmconclave.com](https://llmconclave.com)**: Preset models + BYOK + account + credits

---

## Features

- Multi-model debate: models respond in sequence, referencing each other's answers
- Auto-generated meeting minutes / research report (PDF or PNG export)
- i18n: English · 中文 · 日本語
- BYOK: bring your own OpenAI / Anthropic / Gemini / OpenRouter key
- iOS-compatible client-side export (no server Puppeteer dependency)

---

## One-click Deploy

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/llmconclave&env=SAAS_MODE,REDIS_DISABLED&envDescription=Set+SAAS_MODE%3Dfalse+and+REDIS_DISABLED%3Dtrue+for+open-source+mode)

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-org/llmconclave)

---

## Docker Compose (self-hosted)

```bash
git clone https://github.com/your-org/llmconclave.git
cd llmconclave
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). Add your API keys in Settings.

---

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local — set SAAS_MODE=false, REDIS_DISABLED=true
npm run dev
```

---

## Environment Variables

See [`.env.local.example`](.env.local.example) for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `SAAS_MODE` | No | `true` enables auth + billing. Default: `false` |
| `REDIS_DISABLED` | No | `true` uses in-memory store. Default: `true` |
| `OPENROUTER_API_KEY` | No | Preset models via OpenRouter |
| `DOUBAO_API_KEY` | No | 豆包 / Doubao preset models |

---

## SaaS Setup

For the hosted SaaS version with Supabase Auth + Stripe credits:

1. Create a [Supabase](https://supabase.com) project and run the SQL schema (see below)
2. Create a [Stripe](https://stripe.com) account and add three products
3. Set `SAAS_MODE=true` and fill in Supabase + Stripe env vars
4. Deploy to [Railway](https://railway.app) and point your domain via Cloudflare

### Supabase SQL Schema

```sql
create table public.credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('purchase','relay_spend','bonus')),
  description text,
  relay_session_id text,
  stripe_payment_intent_id text,
  estimated_tokens integer,
  created_at timestamptz default now()
);

create table public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz default now()
);

alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;

create policy "users see own credits" on public.credits
  for select using (auth.uid() = user_id);
create policy "users see own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);
```

### Cloudflare SSE Setup

Create a **Cache Rule** in Cloudflare Dashboard:
- Path: `/api/relay*`
- Settings: Response Buffering = **Off**, Cache Status = **Bypass**

This prevents Cloudflare from buffering SSE events.

### Supabase Keepalive on Railway

For a Supabase Free project, create a separate Railway service from this repository and configure it as a Cron Job:

- Start command: `node scripts/supabase-keepalive.mjs`
- Cron schedule: `17 3,15 * * *` (UTC)
- Variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The task performs a read-only request against the existing `credits` table. Do not configure
`SUPABASE_SERVICE_ROLE_KEY` on this service. Keep the existing web service start command as `node server.js`.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, standalone output)
- **UI**: React 19, Tailwind CSS, Zustand
- **Providers**: OpenAI / Anthropic / Google Gemini (+ OpenRouter)
- **Export**: html2canvas + jsPDF (client-side, iOS safe)
- **Job Store**: In-memory (OSS) · Upstash Redis (SaaS multi-instance)
- **Auth**: Supabase (email + Google OAuth)
- **Payments**: Stripe Checkout
- **Deploy**: Railway + Cloudflare

---

## License

MIT
