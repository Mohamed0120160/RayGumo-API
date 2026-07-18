# CHANGES.md — Quiz Real-Dataset Integration

Modified/created files only. Copy each file into the existing project at the
exact same relative path, overwriting the old version.

## Files changed

| Path | Type |
|---|---|
| `src/modules/games/quiz/quiz.types.ts` | Modified — `QuizQuestion.answers: string[]`, removed `difficulty` |
| `src/modules/games/quiz/quiz.validation.ts` | Modified — validates `answers` as non-empty string array; added `validateQuizQuestion` (detailed errors) alongside `isValidQuizQuestion` |
| `src/modules/games/quiz/quiz.service.ts` | Modified — loads raw data, auto-generates sequential `id`, filters invalid records, in-memory cache, crypto-based random selection, new `getRandomQuestionExcluding()` |
| `src/modules/games/quiz/index.ts` | Modified — exports `getRandomQuestionExcluding` |
| `src/modules/games/registry.ts` | Modified — new `getRandomItemExcluding(slug, excludeIds)` dispatcher |
| `src/lib/json-db.ts` | Modified — added `readRawCollection()` (no `WithId` assumption); old `readCollection`/`getRandomItem`/`getItemById`/`getAllItems` kept for future games that already have ids |
| `src/lib/validation.ts` | Modified — added `parseIdsList()` for `?ids=1,2,3` query parsing |
| `src/app/api/games/[game]/random-exclude/route.ts` | **New** — `GET /api/games/quiz/random-exclude?ids=1,2,3` |
| `src/data/quiz/questions.json` | **Replaced** — real dataset, 260 questions, sample/demo data fully removed |
| `README.md` | Modified — new schema, new endpoint, new dataset numbers |
| `ARCHITECTURE_AR.md` | Modified — updated data-flow trace, schema example, added anti-repeat FAQ |
| `PROJECT_GUIDE_AR.md` | Modified — updated module descriptions, schema, examples, add-new-game guide |

No other files were touched. Route structure, games registry pattern, and
overall architecture are unchanged as instructed.

---

## Dataset import report

- **Source file**: `data.json` (your upload)
- **Raw parse issue found**: one missing comma between two question objects
  (between the "ما اللغة الرسمية في ألمانيا؟" and "ما عاصمة اليابان؟"
  entries). Fixed automatically — this was a syntax error in the source file
  itself, not a validation rejection.
- **Total records after JSON fix**: 260
- **Invalid records found**: 0 (every record had valid `question`, non-empty
  `answers` array, and `category`)
- **Records skipped**: 0
- **Duplicate questions**: 0
- **Final question count shipped**: 260
- **Categories** (10 total): جغرافيا (20), تاريخ (20), علوم (20), فضاء (20),
  رياضة (20), أنمي (80), ألعاب فيديو (20), أفلام ومسلسلات (20), تكنولوجيا (20),
  ثقافة عامة (20)
- **IDs**: not present in source data — auto-generated sequentially (1–260)
  based on each question's position in the file, at load time in
  `quiz.service.ts`. You never need to add `id` by hand.

All 5 old sample/demo English questions (Tokyo/Mars/Shakespeare/gold/Berlin
Wall) have been fully removed. `questions.json` now contains only your real
dataset — no fallback, mock, or placeholder content remains anywhere in the
project.

---

## New endpoint

### `GET /api/games/quiz/random-exclude?ids=1,2,3`

- Stateless, same as every other endpoint — the API does not remember used
  questions between requests.
- Pass previously-served question ids via the `ids` query param
  (comma-separated). Returns a random question that is not among them.
- If `ids` is omitted/empty, behaves exactly like `/random`.
- If every question is excluded, returns `404 NOT_FOUND` with a clear Arabic
  message instead of silently repeating a question — the bot should reset its
  per-group used-ids list when it sees this.

Recommended bot integration pattern is documented in `README.md` under
"Recommended bot integration (anti-repeat)".

---

## Validation improvements

- `quiz.validation.ts` now validates `answers` is a non-empty array of
  non-empty strings (previously validated a single `answer` string).
- Added `validateQuizQuestion()` which returns itemized Arabic error messages
  per failed field, in addition to the existing boolean `isValidQuizQuestion()`
  type guard.
- Invalid records are skipped silently at load time (logged nowhere currently,
  simply excluded) rather than crashing the API — per your requirement to
  "ignore malformed entries safely." In this real dataset, 0 records were
  invalid, so nothing was actually skipped.

## Random selection improvement

- Replaced `Math.random()`-based index selection with a
  `crypto.getRandomValues()`-based implementation (`pickRandomIndex` in
  `quiz.service.ts`) for a more robust, less predictable random source. Uses
  Node's built-in `crypto` global — no new dependency added.

## Cleanup performed

- Removed the old single-answer schema (`answer: string`) and the
  `difficulty` field entirely — the real dataset doesn't have difficulty
  levels, so no fabricated default was introduced.
- Removed all 5 sample/demo questions from `questions.json`.
- No other dead code, unused validation, or unused helpers were found tied to
  the old schema — the codebase was already clean going in.

---

## What was NOT changed (per your instructions)

- Did not rebuild the project or change the overall architecture.
- Did not remove or alter the generic `games/[game]/...` route structure —
  it already matches your required endpoint list
  (`/api/games/quiz/random`, `/all`, `/count`, `/[id]`) plus the new
  `/random-exclude`.
- Did not touch `src/app/page.tsx`, `layout.tsx`, `not-found.tsx`,
  `src/config/app.ts`, `src/types/api.ts`, `src/types/games.ts`,
  `eslint.config.mjs`, `next.config.ts`, `package.json`, `tsconfig.json`,
  `vercel.json`, or `.env.example` — none required changes for this task.
- Kept the generic (`WithId`-based) helpers in `lib/json-db.ts`
  (`readCollection`, `getRandomItem`, `getItemById`, `getAllItems`) intact and
  unused-but-available for a future game whose data source already includes
  ids — only quiz was switched to the new id-less `readRawCollection` path,
  since only quiz's real dataset lacks ids.

---

## Testing note (important — please verify on your machine)

This sandbox has **no network egress**, so `npm install` / `npm run build`
could not be executed here. Instead, all changed TypeScript files were
type-checked in isolation against the project's real `tsconfig.json`
(strict mode, `noUncheckedIndexedAccess`, etc.) using a local `tsc`, with
stub ambient types standing in for `next`/`react`/`@types/node` (which
couldn't be installed). No type errors were found in any of the changed
files after fixes for `noUncheckedIndexedAccess` on array-index access in
`quiz.service.ts`.

Before deploying, please run locally to be fully sure:

```bash
npm install
npm run build
curl http://localhost:3000/api/games/quiz/count            # expect 260
curl http://localhost:3000/api/games/quiz/random
curl "http://localhost:3000/api/games/quiz/random-exclude?ids=1,2,3"
curl http://localhost:3000/api/games/quiz/1
```
