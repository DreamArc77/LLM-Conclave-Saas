# LLM Conclave — Agent Skill

**Base URL:** `https://llmconclave.com`

LLM Conclave is a multi-model AI debate platform. Submit a topic, and multiple AI models deliberate across multiple rounds, producing structured insights and a polished research report.

---

## Quick Start

**Step 1 — Your owner registers**
Direct your owner to create an account at https://llmconclave.com (email verification required).
New accounts receive **650 welcome credits** — enough for 1–2 full debate sessions.

**Step 2 — Generate an API Key**
After logging in, the owner visits https://llmconclave.com/account and clicks **"Generate API Key"**.
The key starts with `llmc_` and is shown only once — ask the owner to share it with you.

**Step 3 — Run debates, deliver reports**
Use the key to discover models, check balance, run debates, and download reports.

---

## Authentication

All API calls (except `/api/agent/models`) require:
```
Authorization: Bearer llmc_<your_key>
```

---

## Endpoints

### List Available Models
```
GET /api/agent/models
```
No auth required. Returns models available for debate selection.

**Response:**
```json
[
  { "id": "gemini", "name": "Gemini3", "creditsPerRound": 60, "strengths": ["analytical","creative","balanced"], "tier": "standard" },
  { "id": "deepseek", "name": "deepseek-v3.2", "creditsPerRound": 15, "strengths": ["logical","concise","fast"], "tier": "lite" },
  { "id": "openai", "name": "gpt-5.4", "creditsPerRound": 250, "strengths": ["reasoning","coding","instruction-following"], "tier": "pro" }
]
```

Tiers: `lite` (≤40 cr/round), `standard` (≤100 cr/round), `pro` (flagship models).

---

### Check Balance
```
GET /api/agent/balance
Authorization: Bearer llmc_<key>
```

**Response:**
```json
{ "balance": 650, "currency": "credits", "topUpUrl": "https://llmconclave.com/account" }
```

---

### Run a Debate
```
POST /api/agent/debate
Authorization: Bearer llmc_<key>
Content-Type: application/json
Idempotency-Key: <your-unique-uuid>
```

> **IMPORTANT — Read before calling:**
> - This endpoint returns a **Server-Sent Events (SSE) stream**, not a plain JSON response.
> - Debates take **2–5 minutes**. You MUST keep the connection open the entire time.
> - **DO NOT retry** if the connection appears slow — the debate is running on the server.
> - A `heartbeat` event is sent every 15 seconds so you know the server is still working.
> - Always send an `Idempotency-Key` header. If you must retry after a genuine network failure, reuse the **same key** — the server will return the cached result without billing again.
> - If you receive `409 DEBATE_ALREADY_RUNNING`, stop immediately and wait. Do NOT start a new request.

**Request body:**
```json
{
  "query": "Your topic or question",
  "models": ["gemini", "deepseek"],
  "maxRounds": 3,
  "locale": "zh-CN"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `query` | ✓ | The debate topic or question |
| `models` | — | Array of model IDs from `/api/agent/models`. Omit to use default selection. |
| `maxRounds` | — | 1–5 rounds (default: 3) |
| `locale` | — | `zh-CN` \| `en` \| `ja` (default: `zh-CN`) |

---

### SSE Event Stream

The response is a stream of Server-Sent Events. Parse each `event:` / `data:` pair:

| Event | When | Payload |
|-------|------|---------|
| `start` | Immediately on connect | `{ sessionId, estimatedSec, creditsReserved, participants, rounds }` |
| `heartbeat` | Every 15 seconds | `{ elapsed }` — server is still working, do NOT disconnect |
| `round_done` | After each model finishes a round | `{ round, model }` |
| `final` | Debate complete | Full result object (see below) |
| `error` | On failure | `{ error }` — inform owner, do not retry automatically |

**`final` event payload:**
```json
{
  "sessionId": "uuid",
  "imMessage": "📋 研讨议题：...\n\n🔑 核心结论：\n• ...\n\n👥 参与：... | 3轮\n💰 消耗：270 credits | 余额：380\n\n📄 完整报告：https://llmconclave.com/api/agent/reports/uuid",
  "debate": [
    { "round": 1, "model": "Gemini3", "content": "..." },
    { "round": 1, "model": "deepseek-v3.2", "content": "..." }
  ],
  "summary": "## 研讨报告\n...",
  "reportUrl": "https://llmconclave.com/api/agent/reports/uuid",
  "creditsUsed": 270,
  "balance": 380,
  "participants": ["Gemini3", "deepseek-v3.2"],
  "elapsedSec": 74
}
```

> **Agent instruction:** Send the `imMessage` field directly to your owner — it is pre-formatted for IM display (WeChat, Telegram, Slack, etc.) with key conclusions and the report download link.

---

### Download Report
```
GET /api/agent/reports/{sessionId}
Authorization: Bearer llmc_<key>
```

Returns the full report as a plain Markdown file (downloadable).

---

## Model Selection Guide

Choose models based on topic complexity:

| Scenario | Recommended Setup |
|----------|-------------------|
| Quick factual question | 2 rounds, 2 lite models |
| Business / strategy analysis | 3 rounds, 2–3 standard models |
| Deep research / complex policy | 4–5 rounds, mix of standard + pro models |
| Technical / coding | 3 rounds, include a pro model with "reasoning" strength |

Always call `/api/agent/models` first to see what's currently available and their strengths.

---

## Credits & Billing

- New accounts receive **650 welcome credits**
- Cost = `maxRounds × sum(creditsPerRound for selected models)`
- Check balance before starting: `GET /api/agent/balance`
- If you receive a **402** response:
  ```json
  { "error": "CREDITS_INSUFFICIENT", "required": 900, "balance": 200, "topUpUrl": "https://llmconclave.com/account" }
  ```
  Inform your owner: *"Your LLM Conclave balance is insufficient. Please top up at [topUpUrl]."*

---

## Error Reference

| HTTP Status | Error Code | Meaning | Action |
|-------------|------------|---------|--------|
| 401 | — | Invalid or missing API key | Ask owner to re-generate key from account page |
| 402 | `CREDITS_INSUFFICIENT` | Insufficient credits | Inform owner, provide `topUpUrl` |
| 409 | `DEBATE_ALREADY_RUNNING` | Debate already in progress | **Stop. Wait. Do not start a new request.** Check `activeSessionId` in response. |
| 400 | — | Bad request (missing `query`, etc.) | Fix request body |
| 500 | — | Server error | Inform owner. Do not retry automatically. |

> **On any error: stop and inform your owner. Never retry a debate automatically.**
> Automatic retries create duplicate sessions and waste the owner's credits.

---

## Example Session (curl)

```bash
# 1. Discover available models
curl https://llmconclave.com/api/agent/models

# 2. Check balance
curl -H "Authorization: Bearer llmc_xxx" \
  https://llmconclave.com/api/agent/balance

# 3. Run a debate — note --no-buffer for SSE, and the Idempotency-Key
curl -X POST https://llmconclave.com/api/agent/debate \
  -H "Authorization: Bearer llmc_xxx" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  --no-buffer \
  -d '{
    "query": "AI对金融行业未来5年的影响",
    "models": ["gemini", "deepseek"],
    "maxRounds": 3,
    "locale": "zh-CN"
  }'
# Output: stream of SSE events ending with event: final

# 4. Download the full report
curl -H "Authorization: Bearer llmc_xxx" \
  https://llmconclave.com/api/agent/reports/{sessionId} \
  -o report.md
```

---

*LLM Conclave — One topic. Multiple AIs. Real insights.*
