# 🌱 Garden — a habit tracker that grows a garden

Week 1: habits + daily check-in, streaks and growth stages computed from a log.
Built with Next.js 16 (App Router, Server Actions), PostgreSQL and Drizzle ORM.

## Run it locally

```bash
npm install
cp .env.example .env        # then fill in the values
npm run db:migrate          # creates the tables
npm run dev                 # http://localhost:3000
```

You need a Postgres database. The easiest options are a free [Neon](https://neon.tech) or
[Supabase](https://supabase.com) project (paste its connection string into `DATABASE_URL`),
or local Postgres via Docker:

```bash
docker run -d --name garden-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=garden -p 5432:5432 postgres:16
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests for streak / date logic (Vitest) |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## How it's organised

```
src/
  db/schema.ts        users, habits, habit_logs
  db/index.ts         Drizzle client
  lib/dates.ts        "today" in the user's time zone, date maths
  lib/streak.ts       current/longest streak, growth stage (pure functions)
  lib/streak.test.ts  tests for the above
  lib/plants.ts       plant types (emoji placeholders for now)
  lib/auth.ts         password-gate token helpers
  lib/session.ts      requireAuth(), getCurrentUser()
  proxy.ts            redirects to /login without a session (Next 16's "middleware")
  app/page.tsx        the garden / check-in page
  app/actions.ts      createHabit, toggleToday, archiveHabit
  app/login/page.tsx  password login
```

## Design decisions

- **Event log, not counters.** `habit_logs` has one row per habit per completed day
  (unique on `habit_id, log_date`). Streaks and growth stages are computed from it,
  so undoing a check-in or changing the growth rules never corrupts anything.
- **Local dates.** `log_date` is a `DATE` in the user's time zone (`APP_TIMEZONE`),
  so 11pm in Kuala Lumpur counts for the right day.
- **Streak grace.** If today isn't done yet, the streak still shows yesterday's count
  until the day ends.
- **Growth is by total completions** (1, 3, 7, 14, 30), so a broken streak never
  takes away earned progress.
- **Archive, don't delete.** Archived habits keep their history.
- **Single-user password gate** for now (`APP_PASSWORD`). Server Actions re-check the
  session, not just `proxy.ts`. Swap in Auth.js / Better Auth when you want accounts.

## Deploy (free)

1. Push to GitHub, import the repo on [Vercel](https://vercel.com).
2. Add the env vars from `.env.example` in the Vercel project settings
   (use a strong `APP_PASSWORD` and `openssl rand -hex 32` for `SESSION_SECRET`).
3. Run `npm run db:migrate` once against the production `DATABASE_URL`.

## Next up (Week 2)

- Real plant art per growth stage (SVG / sprites) instead of emoji
- Wilting after a missed day, reviving on the next check-in
- A garden view that lays the plants out together
