# Garden

A habit tracker where every habit is a plant, and your streak decides how tall it grows.
Next.js 16 (App Router, Server Actions, Cache Components), PostgreSQL, Drizzle ORM.
Mobile-first and installable to your home screen.

## The rules

- **Growth follows the streak.** Sprout at 1 day in a row, seedling at 3, bud at 7, bloom at 14, fully grown at 30.
- **Miss one day:** the plant is thirsty and the streak is at risk. Only a **rain day** saves it.
- **Miss two, or water again without a rain day:** the streak is lost and the plant starts over from a sprout. Your best streak stays on record.
- **Rain days:** earn one for every 7 full days in a row (every habit due that day watered). Hold up to 3. A rain day keeps a streak but never adds a check-in.
- **Days off** (a habit not scheduled that day) never count against you.
- **Unlocks:** Monstera at 50 total check-ins, Moonflower with a 21 day streak. Decorations: lantern (7 day streak), stone path (75 check-ins), bench (30 day streak), wind chime (100 check-ins).

All of it is computed from the log in `src/lib/garden.ts` and unit-tested in `src/lib/garden.test.ts`.

## Run it locally

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run db:migrate          # creates or upgrades the tables
npm run dev                 # http://localhost:3000
```

Signed out, `/` shows the landing page (`public/landing/`); every other page asks for `APP_PASSWORD`.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Today: the garden strip, rain-day rescues, the habits due today |
| `/garden` | The whole garden (sky follows your local time), plants and decorations |
| `/habits/[id]` | One plant: streak, best, month calendar, edit, archive |
| `/new` | Plant a habit (name, plant, days, reminder). Accepts `?habit=&plant=` from the landing page |
| `/stats` | Week, month or all-time record, each habit, by weekday |
| `/seeds` | Every plant, what unlocks it, how plants grow |
| `/rain` | Rain days saved, progress to the next, history |
| `/settings` | Profile and time zone, reminders, sharing, archived habits, CSV export |
| `/g/[slug]` | Your public, read-only garden (only when sharing is on) |

## Reminders

1. `npx web-push generate-vapid-keys` and put the two keys in `.env` (and in Vercel).
2. Set `CRON_SECRET` to a long random string.
3. In the app: You → Notifications on this device → Turn on. On iPhone, add Garden to the home screen first.
4. Something must call `GET /api/cron/reminders` every 15 minutes with the header
   `Authorization: Bearer <CRON_SECRET>`. Vercel Hobby only allows daily cron jobs, so use a free
   scheduler such as cron-job.org (it supports custom headers). On Vercel Pro you can add a
   `vercel.json` cron instead; Vercel sends the same header automatically.

Each habit is reminded at most once a day, only if it is due and not watered yet. If its streak
is at risk and "Thirsty plant nudge" is on, the reminder says so.

## Deploy

Push to GitHub, import on Vercel, add every variable from `.env.example`, then run
`npm run db:migrate` once against the production `DATABASE_URL`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests for the garden rules (Vitest) |
| `npm run db:generate` | New migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |

## Project map

```
src/lib/garden.ts        the rules: streaks, wilting, rain days, unlocks, weather, stats
src/lib/data.ts          loads a user's garden from the database and applies the rules
src/lib/plant-art.js     parametric plant drawings (shared with the landing page)
src/lib/scene.ts         the garden scene SVG
src/components/          server UI (garden-ui.tsx) and client UI (client.tsx)
src/app/(app)/           the signed-in pages
src/app/actions.ts       every write: check-in, rain day, habits, settings, push
src/app/api/cron/        reminder sender
public/landing/          the scroll landing page (static)
PRODUCT.md, DESIGN.md    product truth and the design system
```
