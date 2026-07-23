## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` labels. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context domain-document layout. See `docs/agents/domain.md`.

## Cursor Cloud specific instructions

Single web app: a TanStack Start (Vite, React 19, SSR) car-rental site backed by PostgreSQL via Drizzle ORM, Better Auth, iPay88 payments, Postmark email, and S3. Standard scripts live in `package.json` (`dev`, `test`, `lint`, `db:*`); README/README-admin cover usage. The update script only runs `pnpm install`; the items below are the non-obvious startup steps it intentionally does not do.

- Postgres 16 is installed in the snapshot but does not auto-start on boot. Start it each session before running the app or DB scripts: `sudo pg_ctlcluster 16 main start` (idempotent; ignore "already running"). Local DB is `xqcar`, user/password `postgres`/`postgres`.
- `.env.local` (gitignored) holds local config: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xqcar?sslmode=disable`, `DATABASE_SSL=false`, a `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`/`SITE_URL=http://localhost:3000`, and `AUTH_SKIP_EMAIL_VERIFICATION=true`. Regenerate a secret with `pnpm dlx @better-auth/cli secret` if the file is missing. iPay88/Postmark creds are optional — the app runs without them (payment/email steps just won't complete).
- If the DB is empty (fresh snapshot), apply schema and seed: `pnpm db:push` then `pnpm db:seed` (17 demo cars), `pnpm db:seed-season`, `pnpm db:seed-admin`. `pnpm dev:check` verifies env (iPay88 line failing is expected/OK locally).
- `pnpm dev` serves on http://localhost:3000; `/` redirects to `/en`. Register a customer at `/en/register` (email verification skipped) and book from the homepage → checkout.
- `pnpm lint` requires `eslint` as a direct devDependency; it is only a transitive peer of `@tanstack/eslint-config`, so its bin is not linked otherwise. This repo now declares it directly. Lint currently reports many pre-existing errors — that is a repo code-quality state, not a setup problem.
