# Hintbot

Hintbot gives a student one hint about a broken JavaScript assignment. It points at the line with the bug and explains what's wrong, but it doesn't write the fix.

- `backend/`: Express + TypeScript API. Calls the Claude API (`claude-sonnet-5-5`) with the prompt in `backend/prompts/hint.md` and stores hints and feedback in PostgreSQL.
- `frontend/`: React + Vite page where you paste the assignment, code and error, see the hint with the line highlighted, and say whether it helped.
- `evals/`: 60 buggy submissions and a script that checks the hints against them.

## Running it locally

You need Node 24 or newer and PostgreSQL.

### 1. Database

With Homebrew:

```sh
brew services start postgresql@16
createdb hintbot
```

### 2. Backend

```sh
cd backend
npm install
export DATABASE_URL=postgres://localhost:5432/hintbot
export ANTHROPIC_API_KEY=your-key-here
npm run migrate
npm run dev
```

The API runs on http://localhost:3001 (set `PORT` to change it). Without `ANTHROPIC_API_KEY` the server still starts, but `/api/hint` returns an error.

Migrations are plain SQL files in `backend/migrations/`. `npm run migrate` runs any that haven't been applied yet and records them in a `schema_migrations` table. To add one, create the next numbered file, e.g. `002_add_something.sql`.

### 3. Frontend

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api` requests to the backend.

## API

`POST /api/hint` with `{ "assignment": "...", "code": "...", "error": "..." }` returns `{ "hintId": 1, "hint": "...", "line": 3 }`. Each request and response is saved in the `hints` table.

`POST /api/feedback` with `{ "hintId": 1, "helpful": false, "comment": "optional" }` saves a row in `feedback`. It returns 404 if the hint doesn't exist.

## Tests

```sh
cd backend
npm test
```

The unit tests don't need a database or an API key. The routes are tested with a fake Claude client and an in-memory store passed into `createApp`. There are also tests for the eval check functions and a test that validates `evals/cases.json`.

## Evals

`evals/cases.json` has 60 buggy submissions of the kind you see in an intro web programming course: off-by-one loops, `==` vs `===`, missing `await`, forgotten `return`, bad DOM selectors, mutated React state, lost `this`, and so on. Each case has the line the bug is on (`buggyLine`) and a short piece of the correct code (`fixSnippet`).

`evals/run.ts` sends every case through the same `getHint` function the API uses and checks two things:

1. The line the model names equals `buggyLine` exactly.
2. The hint doesn't contain `fixSnippet` (compared with all whitespace removed), so it isn't giving away the answer.

Run it with:

```sh
cd backend
ANTHROPIC_API_KEY=your-key-here npm run eval
```

It prints the pass rate, line accuracy, leak rate and the ids of failing cases. It exits with code 1 if any hint leaks a fix or if line accuracy is below the threshold in `evals/thresholds.json` (0.8 right now), and with code 2 if `ANTHROPIC_API_KEY` isn't set. Each run makes 60 API calls.

## CI

`.github/workflows/evals.yml` runs the backend type check, unit tests and frontend build on every push and pull request. On pushes that change `backend/prompts/` or `evals/`, it also runs the eval script.

The eval job needs an `ANTHROPIC_API_KEY` secret:

1. On GitHub, open the repo and go to Settings > Secrets and variables > Actions.
2. Click "New repository secret".
3. Name it `ANTHROPIC_API_KEY` and paste your key as the value.
