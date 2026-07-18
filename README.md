# RayGumo API

A lightweight, scalable **Game Content API** built with **Next.js 16 (App Router) + TypeScript**, designed to serve game content to WhatsApp bots (Baileys-based) and future websites from a single deployment.

This is an **MVP (Minimum Viable Product)**. Right now it serves exactly one game — **Quiz** — but the architecture is deliberately built so that adding more games later (anime guess, riddles, true/false, character guess...) requires no changes to the API route structure, only new self-contained game modules.

RayGumo API is a **content provider only** — it does **not** manage player accounts, XP, levels, rankings, or seasons. That logic belongs in each bot.

No database is required. All content lives in a JSON file inside the repo.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Standard Response Format](#standard-response-format)
- [API Reference](#api-reference)
- [Quiz Data](#quiz-data)
- [Adding a New Game](#adding-a-new-game)
- [Error Handling](#error-handling)
- [Deploying to Vercel](#deploying-to-vercel)

---

## Tech Stack

- Next.js 16+ (App Router, Route Handlers)
- TypeScript (strict mode)
- ESLint (`next/core-web-vitals`, `next/typescript`)
- Zero external database — flat JSON file storage
- Zero required environment variables — works out of the box

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx                  # Simple landing/info page
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── api/
│       ├── [...notfound]/        # Catch-all -> JSON 404 for unknown API routes
│       └── games/[game]/
│           ├── random/route.ts          # GET a random item
│           ├── random-exclude/route.ts  # GET a random item, excluding given ids (anti-repeat)
│           ├── all/route.ts             # GET all items
│           ├── count/route.ts           # GET total item count
│           └── [id]/route.ts            # GET one item by id
│
├── modules/
│   └── games/
│       ├── registry.ts           # Maps a game slug -> its module (dispatcher)
│       └── quiz/                 # The Quiz game module (self-contained)
│           ├── quiz.service.ts   # getRandomQuestion / getRandomQuestionExcluding / getQuestionById / getAllQuestions / getQuestionCount
│           ├── quiz.types.ts     # QuizQuestion type (answers: string[])
│           ├── quiz.validation.ts# isValidQuizQuestion / validateQuizQuestion
│           └── index.ts          # Public entry point for the module
│
├── data/
│   └── quiz/
│       └── questions.json        # The actual quiz content
│
├── lib/
│   ├── json-db.ts                # Generic JSON storage layer (used by any game module)
│   ├── response.ts                # ok() / notFound() / badRequest() / serverError()
│   └── validation.ts              # parseId() / parseIdsList()
│
├── types/
│   ├── api.ts                     # ApiResponse<T> envelope types
│   └── games.ts                   # GAME_REGISTRY (list of registered game slugs)
│
└── config/
    └── app.ts                     # APP_CONFIG from env vars
```

---

## Installation

Requires Node.js 20.9+ (Next.js 16 requirement).

```bash
git clone <your-repo-url> raygumo-api
cd raygumo-api
npm install
```

No environment variables are required to run the project — see [Environment Variables](#environment-variables) below.

---

## Local Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000`. Try:

```bash
curl http://localhost:3000/api/games/quiz/random
```

Other useful scripts:

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # run ESLint
```

---

## Environment Variables

| Variable                | Required | Description                                                   |
|--------------------------|----------|-----------------------------------------------------------------|
| `NEXT_PUBLIC_API_NAME`   | No       | Display name shown on the landing page. Defaults to `RayGumo API`. |
| `API_VERSION`            | No       | Version string, currently informational only. Defaults to `1.0.0`. |

That's it — this MVP has no authentication, no third-party API keys, and no required configuration. Copy `.env.example` to `.env.local` only if you want to override the defaults above.

---

## Standard Response Format

Every endpoint returns one of two shapes.

**Success:**

```json
{
  "success": true,
  "data": { }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Human readable error message",
  "code": "NOT_FOUND"
}
```

`code` is optional but present on all errors raised through the shared `lib/response.ts` helpers (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`).

---

## API Reference

All current endpoints use the `[game]` slug. Only `quiz` is registered right now (see `src/types/games.ts`).

| Endpoint | Method | Description |
|---|---|---|
| `/api/games/:game/random` | GET | Returns one random item from the given game |
| `/api/games/:game/random-exclude?ids=1,2,3` | GET | Returns one random item, excluding the given ids (anti-repeat helper) |
| `/api/games/:game/all` | GET | Returns every item for the given game |
| `/api/games/:game/count` | GET | Returns the total item count for the given game |
| `/api/games/:game/:id` | GET | Returns a single item by numeric id |

### `GET /api/games/quiz/random`

```bash
curl http://localhost:3000/api/games/quiz/random
```

```json
{
  "success": true,
  "data": {
    "id": 3,
    "question": "ما عاصمة اليابان؟",
    "answers": ["طوكيو"],
    "category": "جغرافيا"
  }
}
```

### `GET /api/games/quiz/random-exclude`

Returns one random question, excluding any ids passed in the `ids` query parameter (comma-separated). The API itself is stateless and does **not** remember which questions were served before — the WhatsApp bot is responsible for tracking used question ids per group/session and passing them on every call.

```bash
curl "http://localhost:3000/api/games/quiz/random-exclude?ids=1,2,3,4,5"
```

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question": "من هو مخترع المصباح الكهربائي؟",
    "answers": ["توماس إديسون", "إديسون"],
    "category": "علوم"
  }
}
```

If `ids` is omitted or empty, this behaves exactly like `/random`. If every available question is excluded (the bot has used them all), the endpoint returns a `404 NOT_FOUND` error instead of silently repeating a question — the bot should reset its used-question list for that group when it sees this and try again.

```json
{
  "success": false,
  "message": "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة المُمرَّرة (كل الأسئلة استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}
```

### `GET /api/games/quiz/all`

```bash
curl http://localhost:3000/api/games/quiz/all
```

Returns the full `questions.json` array (260 questions) wrapped in the standard envelope.

### `GET /api/games/quiz/count`

```bash
curl http://localhost:3000/api/games/quiz/count
```

```json
{
  "success": true,
  "data": { "count": 260 }
}
```

### `GET /api/games/quiz/:id`

```bash
curl http://localhost:3000/api/games/quiz/2
```

```json
{
  "success": true,
  "data": {
    "id": 2,
    "question": "في أي قارة تقع البرازيل؟",
    "answers": ["أمريكا الجنوبية"],
    "category": "جغرافيا"
  }
}
```

Unknown `:game` slugs and missing/invalid `:id`s both return an error in the standard envelope (`404` and `400` respectively).

---

## Quiz Data

Quiz content lives in a single file:

```
src/data/quiz/questions.json
```

It's a JSON array of 260 real Arabic quiz questions across 10 categories (جغرافيا، تاريخ، علوم، فضاء، رياضة، أنمي، ألعاب فيديو، أفلام ومسلسلات، تكنولوجيا، ثقافة عامة). Each question matches this schema:

```json
{
  "id": 1,
  "question": "ما عاصمة اليابان؟",
  "answers": ["طوكيو"],
  "category": "جغرافيا"
}
```

- `id` — unique positive integer. **Auto-generated at load time** based on each question's position in the file (1st question → `id: 1`, 2nd → `id: 2`, etc). You never need to add or maintain ids by hand in the JSON source — just add new questions to the file and ids are assigned automatically and consistently on every load.
- `question` — the question text. Full UTF-8 / Arabic support.
- `answers` — **an array of strings**, not a single string. A question can have more than one accepted correct answer (e.g. two valid spellings of the same name). Always treat this as an array in the bot, even for questions with only one answer.
- `category` — a free-form topic label (e.g. `"جغرافيا"`, `"علوم"`).

Any record missing `question`, `answers` (as a non-empty array of non-empty strings), or `category` is skipped automatically at load time and will not appear in any endpoint — it will not crash the API.

The dataset is the sole source of truth: no sample/demo/placeholder questions ship with this project anymore. To update the content, edit `src/data/quiz/questions.json`, commit, and redeploy — no code changes needed.

### Recommended bot integration (anti-repeat)

Since the API is stateless, use this pattern in the WhatsApp bot to avoid repeating questions within a group:

1. Keep a per-group list of used question ids (in the bot's own database/memory).
2. Call `GET /api/games/quiz/random-exclude?ids=<comma-separated used ids>` instead of plain `/random`.
3. Add the returned question's `id` to the group's used-ids list.
4. If the endpoint returns `404 NOT_FOUND` (all questions exhausted), clear the group's used-ids list and call again.

---

## Adding a New Game

The route structure (`/api/games/[game]/...`) and storage layer (`lib/json-db.ts`) are already generic. To add a new game (e.g. `riddles`):

1. Create a new self-contained module folder: `src/modules/games/riddles/`, following the same pattern as `src/modules/games/quiz/` (a `*.types.ts`, a `*.service.ts`, optionally a `*.validation.ts`, and an `index.ts`).
2. Add a `src/data/riddles/questions.json` file with your content.
3. Register the slug in `src/types/games.ts`:
   ```ts
   export const GAME_REGISTRY = ["quiz", "riddles"] as const;
   ```
4. Wire the new module into `src/modules/games/registry.ts` — add a `"riddles"` case to each of the five dispatch functions (`getRandomItem`, `getRandomItemExcluding`, `getAllItems`, `getItemById`, `getItemCount`), calling into your new module's service functions.

No route files need to change — `/api/games/riddles/random`, `/random-exclude`, `/all`, `/count`, and `/:id` all work automatically once the registry knows about `"riddles"`.

---

## Error Handling

The API handles these cases cleanly, always returning the standard JSON error envelope:

- **Missing file** — if `questions.json` doesn't exist, `lib/json-db.ts` raises a `NOT_FOUND` error.
- **Invalid JSON** — if the file's content isn't valid JSON or isn't an array, an `INVALID_JSON`-coded error is raised.
- **Invalid ID** — non-numeric or non-positive `:id` values are rejected with `400 BAD_REQUEST` before ever touching the data layer.
- **Empty dataset** — `random` on an empty collection returns `404 NOT_FOUND` instead of crashing.
- **All questions excluded** — `random-exclude` returns `404 NOT_FOUND` if every available question was excluded via `ids`, instead of silently repeating one.
- **Unknown game slug** — any `[game]` not present in `GAME_REGISTRY` returns `404 NOT_FOUND`.
- **Unknown route** — any request under `/api/*` that doesn't match a defined route returns `404` via the catch-all handler, as JSON (not Next.js's default HTML 404 page).

---

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the repo in the [Vercel dashboard](https://vercel.com/new) — it will auto-detect the Next.js framework.
3. No environment variables are required for this MVP. Optionally set `NEXT_PUBLIC_API_NAME` / `API_VERSION` in **Project Settings → Environment Variables** if you want custom values.
4. Deploy. Vercel runs `npm install` then `npm run build` automatically (see `vercel.json`).
5. Verify with:
   ```bash
   curl https://<your-deployment>.vercel.app/api/games/quiz/random
   ```

### Important production note on JSON storage

Vercel's serverless function filesystem is **read-only** at runtime (except `/tmp`, which is ephemeral and not shared across invocations). This project only *reads* `questions.json` at request time, which works perfectly on Vercel.

To update quiz content in production: edit `src/data/quiz/questions.json`, commit, and redeploy. There is no runtime write/CRUD support by design — this keeps the project simple and fully compatible with Vercel's read-only production filesystem.
