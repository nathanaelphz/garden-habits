import { addDays } from "./dates";

/**
 * Current streak, in days.
 * If today isn't done yet, the streak is still alive (counted up to yesterday)
 * until the day ends — so you don't see "0" every morning.
 */
export function currentStreak(done: Set<string>, today: string): number {
  let day = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

/** Longest run of consecutive completed days ever. */
export function longestStreak(done: Set<string>): number {
  let best = 0;
  for (const day of done) {
    // Only start counting at the first day of a run.
    if (done.has(addDays(day, -1))) continue;
    let len = 0;
    let d = day;
    while (done.has(d)) {
      len++;
      d = addDays(d, 1);
    }
    best = Math.max(best, len);
  }
  return best;
}

/** Growth stage from total completions. Week 2 will draw these. */
export const STAGES = [
  { min: 0, name: "Seed" },
  { min: 1, name: "Sprout" },
  { min: 3, name: "Seedling" },
  { min: 7, name: "Bud" },
  { min: 14, name: "Bloom" },
  { min: 30, name: "Mature" },
] as const;

export function growthStage(totalCompletions: number) {
  let stage: (typeof STAGES)[number] = STAGES[0];
  for (const s of STAGES) if (totalCompletions >= s.min) stage = s;
  const next = STAGES.find((s) => s.min > totalCompletions);
  return { name: stage.name, next: next ? { name: next.name, needed: next.min - totalCompletions } : null };
}
