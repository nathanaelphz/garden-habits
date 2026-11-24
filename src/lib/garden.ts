// The garden's rules, as pure functions. Every page reads its state from here,
// so the rules live in exactly one place and are unit-tested.
//
// Days are "YYYY-MM-DD" strings in the user's own calendar (see dates.ts).

import { addDays } from "./dates";

export type Day = string;

// ---------------------------------------------------------------- growth
export const STAGES = ["Seed", "Sprout", "Seedling", "Bud", "Bloom", "Mature"] as const;
export type StageName = (typeof STAGES)[number];
/** Total check-ins needed to reach each stage. */
export const THRESHOLDS = [0, 1, 3, 7, 14, 30] as const;

export function stageFor(total: number): number {
  let s = 0;
  THRESHOLDS.forEach((min, i) => {
    if (total >= min) s = i;
  });
  return s;
}

export function nextStage(total: number): { name: StageName; needed: number } | null {
  const s = stageFor(total);
  const next = THRESHOLDS[s + 1];
  return next === undefined ? null : { name: STAGES[s + 1], needed: next - total };
}

// ---------------------------------------------------------------- schedules
/** Monday = 0 … Sunday = 6. */
export function weekday(day: Day): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}
export const EVERY_DAY = 0b1111111;
export const WEEKDAYS = 0b0011111;
export const isScheduled = (mask: number, day: Day) => ((mask >> weekday(day)) & 1) === 1;

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function describeSchedule(mask: number): string {
  if (mask === EVERY_DAY) return "every day";
  if (mask === WEEKDAYS) return "weekdays";
  if (mask === 0b1100000) return "weekends";
  return DAY_NAMES.filter((_, i) => (mask >> i) & 1).map((d) => d.slice(0, 3)).join(", ");
}

// ---------------------------------------------------------------- one habit
export type HabitHistory = {
  id: number;
  startDate: Day; // first day the habit existed
  scheduleMask: number;
  done: Set<Day>; // days checked in
  covered: Set<Day>; // days saved by a rain day
};

export type Wilt = "healthy" | "thirsty" | "dry";

// Streak-driven (PRODUCT.md): a plant's stage follows its CURRENT streak.
// One missed scheduled day puts the streak at risk; only a rain day saves it.
// Checking in again without one, or missing a second day, loses it, and the
// plant starts over from a sprout. Total check-ins are kept for stats and unlocks.
export type HabitState = {
  total: number; // all check-ins ever
  streak: number; // consecutive scheduled days kept (rain days count)
  best: number;
  /** Growth stage, from the streak (or the at-risk streak while thirsty). */
  stage: number;
  /** Consecutive scheduled days missed, counting back from yesterday. */
  missed: number;
  wilt: Wilt;
  /** 0 healthy, 0.55 thirsty, 1 dry: the art's wilt amount. */
  wiltAmount: number;
  doneToday: boolean;
  scheduledToday: boolean;
  /** The streak a rain day can still save (thirsty), else null. */
  atRisk: number | null;
  /** The streak that was lost (dry, or started over today), else null. */
  lost: number | null;
  /** The missed day a rain day can cover: exactly one miss, counting back from yesterday. */
  rainable: Day | null;
  /** Today's check-in moved the plant up a stage. */
  grewToday: boolean;
  /** Today's check-in came after a lost streak: the plant restarted. */
  restartedToday: boolean;
};

export function habitState(h: HabitHistory, today: Day): HabitState {
  let total = 0, streak = 0, best = 0, broken = 0;
  for (let d = h.startDate; d < today; d = addDays(d, 1)) {
    const done = h.done.has(d);
    if (done) total++;
    if (!isScheduled(h.scheduleMask, d)) continue; // days off never break anything
    if (done || h.covered.has(d)) streak++;
    else {
      if (streak > 0) broken = streak; // the run this miss broke
      streak = 0;
    }
    best = Math.max(best, streak);
  }
  const doneToday = h.done.has(today);
  if (doneToday) {
    total++;
    streak++;
    best = Math.max(best, streak);
  }

  // Missed days, counting back from yesterday over scheduled days only.
  let missed = 0;
  let lastMissed: Day | null = null;
  for (let d = addDays(today, -1); d >= h.startDate; d = addDays(d, -1)) {
    if (!isScheduled(h.scheduleMask, d)) continue;
    if (h.done.has(d) || h.covered.has(d)) break;
    if (!lastMissed) lastMissed = d;
    missed++;
    if (missed > 60) break;
  }
  const wilt: Wilt = doneToday || missed === 0 ? "healthy" : missed === 1 ? "thirsty" : "dry";
  const atRisk = wilt === "thirsty" && broken > 0 ? broken : null;
  const restartedToday = doneToday && missed > 0 && broken > 0;
  const lost = wilt === "dry" && broken > 0 ? broken : restartedToday ? broken : null;
  // A thirsty plant keeps its size until the streak is decided; a dry one shows what was lost.
  const stage = atRisk ? stageFor(atRisk) : wilt === "dry" && broken > 0 ? stageFor(broken) : stageFor(streak);

  return {
    total, streak, best, stage, missed, wilt,
    wiltAmount: wilt === "healthy" ? 0 : wilt === "thirsty" ? 0.55 : 1,
    doneToday,
    scheduledToday: isScheduled(h.scheduleMask, today),
    atRisk, lost,
    rainable: missed === 1 ? lastMissed : null,
    grewToday: doneToday && !restartedToday && stageFor(streak - 1) !== stageFor(streak),
    restartedToday,
  };
}

// ---------------------------------------------------------------- rain days
export const RAIN_RUN = 7; // full days in a row to earn one
export const RAIN_MAX = 3; // most you can hold

export type RainUse = { habitId: number; coveredDate: Day; usedOn: Day };
export type RainEvent = { kind: "earned" | "used"; day: Day; habitId?: number };

/** A full day: every habit scheduled that day was done or covered. */
function dayIsFull(habits: HabitHistory[], d: Day): boolean | null {
  const active = habits.filter((h) => h.startDate <= d && isScheduled(h.scheduleMask, d));
  if (active.length === 0) return null; // nothing was due: neutral
  return active.every((h) => h.done.has(d) || h.covered.has(d));
}

export function rainLedger(habits: HabitHistory[], uses: RainUse[], today: Day) {
  const start = habits.reduce<Day | null>((m, h) => (!m || h.startDate < m ? h.startDate : m), null);
  let held = 0, earned = 0, used = 0, run = 0;
  const events: RainEvent[] = [];
  const usesOn = (d: Day) => uses.filter((u) => u.usedOn === d);
  if (start) {
    for (let d = start; d <= today; d = addDays(d, 1)) {
      if (d < today) {
        const full = dayIsFull(habits, d);
        if (full === true) {
          run++;
          if (run === RAIN_RUN) {
            run = 0;
            if (held < RAIN_MAX) { held++; earned++; events.push({ kind: "earned", day: d }); }
          }
        } else if (full === false) run = 0;
      }
      for (const u of usesOn(d)) { held = Math.max(0, held - 1); used++; events.push({ kind: "used", day: d, habitId: u.habitId }); }
    }
  }
  return { held, earned, used, progress: run, events: events.reverse() };
}

// ---------------------------------------------------------------- unlocks
export type SpeciesId = "sunflower" | "fern" | "tulip" | "lavender" | "cactus" | "monstera" | "moonflower";

export type Unlock = { kind: "starter" } | { kind: "total"; n: number } | { kind: "streak"; n: number };

export const SPECIES: Record<SpeciesId, { label: string; unlock: Unlock }> = {
  sunflower: { label: "Sunflower", unlock: { kind: "starter" } },
  fern: { label: "Fern", unlock: { kind: "starter" } },
  tulip: { label: "Tulip", unlock: { kind: "starter" } },
  lavender: { label: "Lavender", unlock: { kind: "starter" } },
  cactus: { label: "Cactus", unlock: { kind: "starter" } },
  monstera: { label: "Monstera", unlock: { kind: "total", n: 50 } },
  moonflower: { label: "Moonflower", unlock: { kind: "streak", n: 21 } },
};
export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];
export const isSpecies = (v: string): v is SpeciesId => v in SPECIES;

export type DecorId = "lantern" | "path" | "bench" | "chime";
export const DECOR: Record<DecorId, { label: string; unlock: Unlock }> = {
  lantern: { label: "Lantern", unlock: { kind: "streak", n: 7 } },
  path: { label: "Stone path", unlock: { kind: "total", n: 75 } },
  bench: { label: "Garden bench", unlock: { kind: "streak", n: 30 } },
  chime: { label: "Wind chime", unlock: { kind: "total", n: 100 } },
};
export const DECOR_IDS = Object.keys(DECOR) as DecorId[];

export function describeUnlock(u: Unlock): string {
  if (u.kind === "starter") return "Starter seed";
  if (u.kind === "total") return `Unlocks at ${u.n} total check-ins`;
  return `Unlocks with a ${u.n} day streak`;
}

export type Progress = { totalAll: number; bestAny: number };

export function isUnlocked(u: Unlock, p: Progress): boolean {
  if (u.kind === "starter") return true;
  if (u.kind === "total") return p.totalAll >= u.n;
  return p.bestAny >= u.n;
}
export function unlockProgress(u: Unlock, p: Progress): { have: number; need: number } | null {
  if (u.kind === "starter") return null;
  return u.kind === "total" ? { have: Math.min(p.totalAll, u.n), need: u.n } : { have: Math.min(p.bestAny, u.n), need: u.n };
}

// ---------------------------------------------------------------- the week's weather
export type Weather = { kind: "sunny" | "bright" | "cloudy" | "rainy" | "new"; label: string; detail: string };

export function weekWeather(habits: HabitHistory[], uses: RainUse[], today: Day): Weather {
  let full = 0, counted = 0;
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, -i);
    const f = dayIsFull(habits, d);
    if (f === null) continue;
    counted++;
    if (f) full++;
  }
  if (counted === 0) return { kind: "new", label: "New garden", detail: "Your first week starts today." };
  const rainy = uses.some((u) => u.usedOn > addDays(today, -7));
  const detail = `${full} of the last ${counted} days fully watered.`;
  if (rainy) return { kind: "rainy", label: "Rainy week", detail: `A rain day kept things green. ${detail}` };
  if (full >= Math.max(1, counted - 1)) return { kind: "sunny", label: "Sunny week", detail };
  if (full >= counted / 2) return { kind: "bright", label: "Bright spells", detail };
  return { kind: "cloudy", label: "Cloudy week", detail };
}

/** Sky for the scene from the local hour. */
export function timeOfDay(hour: number): "dawn" | "day" | "dusk" | "night" {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

// ---------------------------------------------------------------- stats
export function rangeStats(habits: HabitHistory[], from: Day, to: Day) {
  const per = new Map<number, { due: number; kept: number }>();
  const byWeekday = Array.from({ length: 7 }, () => ({ due: 0, kept: 0 }));
  let due = 0, kept = 0;
  for (const h of habits) {
    const s = { due: 0, kept: 0 };
    for (let d = from > h.startDate ? from : h.startDate; d <= to; d = addDays(d, 1)) {
      if (!isScheduled(h.scheduleMask, d)) continue;
      const ok = h.done.has(d) || h.covered.has(d);
      s.due++; if (ok) s.kept++;
      byWeekday[weekday(d)].due++; if (ok) byWeekday[weekday(d)].kept++;
    }
    per.set(h.id, s);
    due += s.due; kept += s.kept;
  }
  return { due, kept, rate: due ? kept / due : 0, per, byWeekday };
}
