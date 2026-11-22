# Web tests and deploy

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (Jest, `tests/unit`): Hijri calendar and special days, qibla, umrah dates, verse finder, memorization check |
| `npm run test:e2e` | Browser tests (Playwright, `tests/e2e`) on the built site in `dist/`, desktop and mobile Chrome |
| `npm run deploy:dev` | Builds `origin/dev` in a temporary worktree, tests it and uploads it to **https://dev.kuran360.com** |
| `npm run deploy:dev -- <ref>` | Same for any branch or commit, e.g. `npm run deploy:dev -- feature/x` |
| `npm run deploy:web` | Tests the working tree and uploads it to **https://kuran360.com** |

Both deploys stop before uploading if the typecheck, the unit tests or the browser tests fail.
`--skip-tests` (e.g. `scripts/deploy.sh prod --skip-tests`) uploads anyway; keep it for emergencies.

## Flow

1. Work on a branch, merge it into `dev`, push.
2. `npm run deploy:dev`, then try it on dev.kuran360.com (phone and desktop).
3. Merge `dev` into `master` and run `npm run deploy:web` from a clean checkout of master.

`deploy:web` builds the working tree as it is, so uncommitted changes go live too.

## Running the browser tests

- `npm run test:e2e` needs a fresh `dist/` (`npx expo export --platform web`). `tests/e2e/serve.js` serves it
  like nginx does and fetches prayer time and recitation files from kuran360.com, since those are never in `dist/`.
- Against a deployed site: `E2E_BASE_URL=https://dev.kuran360.com npx playwright test`.
- First time on a machine: `npx playwright install chromium`.
- A failed test leaves a trace: `npx playwright show-trace test-results/<test>/trace.zip`.

## Server

- `.env`: `DEPLOY_TARGET` (kuran360.com → `~/quran`) and `DEPLOY_DEV_TARGET` (dev.kuran360.com → `~/quran-dev`).
- nginx: `/etc/nginx/sites-available/quran` and `kuran360-dev`. The dev site serves prayer times, recitations
  and sermons (`2025_ezan`, `*_all_verse`, `audio`, `hutbe`) from `~/quran`, and sends `X-Robots-Tag: noindex`.
- The dev site uses the same Firebase project as the live site, so data written there is real.
