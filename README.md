# AI Interview Coach

A serverless, Gemini-powered interview practice platform that runs entirely on Cloudflare's edge. Practice technical and behavioral interviews with an AI coach that **remembers the conversation across sessions**, **progressively adjusts difficulty**, and **tracks action items** between chats.

> Live: [ai-interview-coach.<your-subdomain>.workers.dev](https://ai-interview-coach.<your-subdomain>.workers.dev) · API docs at `/docs` (OpenAPI 3.1 / Swagger UI)

---

## What it does

- **Conversational interview practice** — talk to a coach that asks questions, then gives feedback on technical accuracy, communication, and structure.
- **Session memory** — your conversation history persists per session via a Cloudflare Durable Object, so the coach remembers prior answers and tracks strengths/weaknesses across visits.
- **Progressive difficulty** — starts easier and ramps up based on how you answer (see the system prompt in `src/context.ts`).
- **Task tracking** — every session has a CRUD task list (`/api/tasks`) for action items, follow-ups, and prep work the coach assigns.
- **Auto-generated OpenAPI 3.1 docs** at `/docs` via Chanfana + Zod schemas — try the API in-browser.

## Architecture

```
                    ┌────────────────────────────┐
   browser  ────►   │  Cloudflare Worker (Hono)  │  ◄── static frontend from /public
                    │  /api/chat   /api/tasks/*  │
                    └──────────┬─────────────────┘
                               │  per-sessionId
                               ▼
                    ┌────────────────────────────┐
                    │   ChatSession DO instance  │  ── stores full message history
                    │   (Durable Object)         │     calls Gemini with system prompt
                    └──────────┬─────────────────┘
                               │  HTTPS
                               ▼
                       Google Gemini API
```

- **Cloudflare Workers** — runs the Hono app at the edge; no server to manage.
- **Durable Objects (`ChatSession`)** — one per `sessionId`, owns the conversation history and Gemini calls so memory is consistent and low-latency.
- **Chanfana + Zod** — request/response schemas double as runtime validation and OpenAPI docs.
- **Workers Static Assets** — serves the frontend from `/public`.

## Tech stack

- **Runtime:** Cloudflare Workers (TypeScript, `wrangler` v4)
- **API framework:** [Hono](https://hono.dev/) v4
- **Validation + OpenAPI:** [Zod](https://zod.dev/) v3 + [Chanfana](https://github.com/cloudflare/chanfana) v2
- **State:** Cloudflare Durable Objects
- **LLM:** Google Gemini (key passed as the `GEMINI_API_KEY` Workers secret)
- **Frontend:** vanilla HTML/CSS/JS — no build step

## API

All endpoints are documented at `/docs` once the dev server is running.

### `POST /api/chat`

Send a message to the coach and receive a response plus the full conversation history.

**Request**
```json
{ "sessionId": "demo-1", "userInput": "Walk me through how a hash map handles collisions." }
```

**Response**
```json
{
  "aiResponse": "Solid opening. Before we go deeper — when you say 'open addressing'...",
  "history": [
    { "role": "user",      "content": "Walk me through how a hash map handles collisions." },
    { "role": "assistant", "content": "Solid opening. Before we go deeper — ..." }
  ]
}
```

### Tasks (`/api/tasks`)

A per-session task list for action items the coach assigns. Full CRUD:

- `POST   /api/tasks`       — create
- `GET    /api/tasks`       — list
- `GET    /api/tasks/:slug` — fetch one
- `DELETE /api/tasks/:slug` — delete

Task shape:
```ts
{
  name: string;
  slug: string;
  description?: string;
  completed: boolean;   // default false
  due_date: string;     // ISO datetime
}
```

## Project layout

```
ai-interview-coach/
├── src/
│   ├── index.ts                 # Hono app + OpenAPI registry + static-asset fallback
│   ├── chatSession.ts           # Durable Object: per-session memory + Gemini call
│   ├── context.ts               # System prompt (coach role, behavior, feedback rules)
│   ├── types.ts                 # Shared Zod schemas (Task, AppContext)
│   └── endpoints/
│       ├── chat.ts              # POST /api/chat
│       ├── taskCreate.ts
│       ├── taskFetch.ts
│       ├── taskList.ts
│       └── taskDelete.ts
├── public/                      # Static frontend (served by the Worker)
├── frontend/                    # Local dev frontend
├── wrangler.jsonc               # Worker config: Durable Object binding, assets, observability
├── package.json
└── tsconfig.json
```

## Local development

Prereqs: Node 18+, a Cloudflare account, and the Gemini API key.

```bash
git clone https://github.com/agarwalaashrut/ai-interview-coach.git
cd ai-interview-coach

npm install
npx wrangler login

# Set the Gemini key as a Workers secret
npx wrangler secret put GEMINI_API_KEY

npm run dev      # → http://localhost:8787
                 #   /       frontend
                 #   /docs   OpenAPI / Swagger UI
```

## Deploy

```bash
npm run deploy
```

You'll get a `https://ai-interview-coach.<your-subdomain>.workers.dev` URL. Don't forget to set the `GEMINI_API_KEY` secret in the deployed environment.

## Why I built it

Interview prep usually means: a friend who has free time, a paid coach, or talking to yourself. The first two don't scale, the third doesn't push back. This is a self-contained alternative — the system prompt makes the model act like a coach (asks one question at a time, escalates difficulty, gives specific feedback), and the Durable Object gives it the memory to actually track progress over multiple sessions instead of resetting every page load.

## License

MIT
