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

### Model Pipeline Health Check (daily + post-deploy)

Preset models depend on a single provider key (e.g. `OPENROUTER_API_KEY`). If that key is revoked,
expires, or the account runs out of credits, every debate fails with a raw provider error — and
nothing in the app notices until a user reports it. The built-in health check closes that gap.

**What it does** (no external cron needed — it runs inside the web service):

- On every server start (i.e. after each deploy): self-check ~90s after boot, then daily.
- Validates each unique provider key via the gateway's free `GET /auth/key` endpoint.
- Sends one tiny real completion per preset model (`max_tokens: 16`, ≈ $0.01/month total for 8 models),
  classifying failures: `key-invalid` (401) · `credits-out` (402) · `model-missing` (404) · upstream/network errors.
- Also verifies `INTERNAL_RELAY_SECRET` is set in SaaS mode (agent debates 500 without it).
- On failure it alerts via webhook and email (re-alerting daily while unresolved, throttled
  to 1/30min). The recovery ✅ notice and the healthy post-deploy canary ping go to the
  webhook only — email is reserved for failures so the inbox stays quiet when all is well.

**Setup** — add to the web service:

```
HEALTH_CHECK_SECRET=<random string>          # protects the manual probe endpoint
PIPELINE_ALERT_WEBHOOK=<webhook URL>         # webhook channel; leave empty to skip
RESEND_API_KEY=re_...                        # email channel; leave empty to skip
PIPELINE_ALERT_EMAIL=you@example.com         # receives failure alerts only
PIPELINE_ALERT_EMAIL_FROM=LLM Conclave <ops@your-domain.com>   # optional; resend.dev sender by default
```

Both channels are optional and independent — configure whichever you use. Supported webhook targets
(auto-detected from the URL): Feishu / Lark, DingTalk, WeCom (企业微信), Slack, Telegram
(append `?chat_id=<id>` to the URL), Bark (`https://api.day.app/<key>`), or any endpoint accepting
`{"text": "..."}`. The email channel uses [Resend](https://resend.com) (free tier is plenty for
failure alerts) — verify your domain in Resend and set `PIPELINE_ALERT_EMAIL_FROM` to an address
on it; without that, Resend only delivers to your own Resend account email.

**Manual / external probe** (also handy right after rotating the provider key):

```bash
curl "https://your-domain/api/health/pipeline?secret=<HEALTH_CHECK_SECRET>"
# 200 {ok:true} = every preset model reachable; 503 = details per model
```

For full dead-man coverage, point a free uptime monitor (UptimeRobot etc.) at both
`/api/health` (server up) and `/api/health/pipeline?secret=...` (pipeline healthy).

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
