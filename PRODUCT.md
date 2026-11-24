# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first: used mainly in a phone browser, installable to the home screen (PWA). Desktop must still work.

## Users
One person for now: the owner, Nathanael, tracking his own daily habits. The app is single-user behind one password (`APP_PASSWORD`). Other people only ever see a read-only public garden page if he turns sharing on.

## Product Purpose
A habit tracker where every habit is a plant. Keeping a habit waters its plant; the garden is the record of how consistent you have been. Success is opening it every day, checking in quickly, and caring enough about the streak not to break it.

## Positioning
Streak-driven. The streak is the main motivator and breaking it should feel costly:
- A plant's growth stage follows its **current streak** (Sprout 1, Seedling 3, Bud 7, Bloom 14, Mature 30 days in a row).
- Miss one scheduled day: the plant is **thirsty** and the streak is **at risk**. Only a **rain day** saves it.
- Miss two, or check in again without using a rain day: the streak is **lost** and the plant starts over from a sprout. The best streak stays on record.
- Rain days are earned: one per 7 full days in a row (every scheduled habit kept), hold up to 3.
- Days a habit is not scheduled for never count against it.

## Operating Context
Quick daily check-ins on a phone, often morning and night. Reminders by web push at a time set per habit. A cron endpoint sends reminders; on Vercel Hobby it must be triggered by an external scheduler.

## Capabilities and Constraints
- Next.js 16 (App Router, Cache Components on), PostgreSQL via Drizzle, deployed on Vercel. Single-user password auth.
- Data is an event log (one row per habit per day checked in, plus rain-day uses); every streak, stage, wilt, unlock and stat is computed from it in `src/lib/garden.ts`.
- "Today" is the user's local date (`APP_TIMEZONE`).
- Features: habits with weekday schedules, check-in, plant stages, thirsty/dry states, rain days, unlockable plants and decorations, garden view, stats, reminders (web push), public share page, CSV export.
- Plants: Sunflower, Fern, Tulip, Lavender, Cactus (starters); Monstera (50 total check-ins); Moonflower (21-day streak).

## Brand Commitments
- Name: Garden.
- Approved visual direction (design canvas, 22 Nov 2026): dark forest ground, bone text, amber for growth and streaks, sky blue for water and rain days, Bricolage Grotesque + Geist, and the parametric plant illustrations in `src/lib/plant-art.js`.
- The owner asked that UI design work also use the awesome-design-md picker and the taste skill.

## Evidence on Hand
No users, reviews, or usage numbers exist. Never invent testimonials, counts, or store badges. The landing page (`public/landing/`) runs on a clearly labelled sample month.

## Product Principles
1. The streak is the hero: always visible, always honest about what is at risk.
2. Checking in is one tap, and the plant answers immediately.
3. Losses are real but recoverable: a lost streak replants, the best streak is remembered.
4. Every number is computed from the log, never stored or faked.

## Accessibility & Inclusion
Touch targets at least 44px, text contrast at least 4.5:1, state never shown by colour alone (icons and words accompany wilt and done states), reduced motion respected.
