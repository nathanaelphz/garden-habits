import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitLogs, habits, rainDayUses, type Habit, type User } from "@/db/schema";
import { todayInTz } from "./dates";
import { plantSVG } from "./plant-art.js";
import {
  habitState, isSpecies, isUnlocked, rainLedger, timeOfDay, weekWeather, SPECIES, SPECIES_IDS,
  type HabitHistory, type HabitState, type RainUse, type SpeciesId,
} from "./garden";

export type GardenHabit = Habit & { species: SpeciesId; hist: HabitHistory; state: HabitState };

/** Everything a page needs, computed from the log. */
export async function loadGarden(user: User) {
  const today = todayInTz(user.timezone);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: user.timezone, hour: "2-digit", hourCycle: "h23" }).format(new Date()));

  const rows = await db.select().from(habits).where(eq(habits.userId, user.id)).orderBy(habits.createdAt, habits.id);
  const ids = rows.map((h) => h.id);
  const [logs, uses] = ids.length
    ? await Promise.all([
        db.select({ habitId: habitLogs.habitId, logDate: habitLogs.logDate }).from(habitLogs).where(inArray(habitLogs.habitId, ids)),
        db.select().from(rainDayUses).where(inArray(rainDayUses.habitId, ids)),
      ])
    : [[], []];

  const all: GardenHabit[] = rows.map((h) => {
    const done = new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.logDate));
    const covered = new Set(uses.filter((u) => u.habitId === h.id).map((u) => u.coveredDate));
    let startDate = todayInTz(user.timezone, h.createdAt);
    for (const d of done) if (d < startDate) startDate = d;
    const hist: HabitHistory = { id: h.id, startDate, scheduleMask: h.scheduleMask, done, covered };
    return { ...h, species: isSpecies(h.plantType) ? h.plantType : "fern", hist, state: habitState(hist, today) };
  });

  const active = all.filter((h) => !h.archivedAt);
  const archived = all.filter((h) => h.archivedAt);
  const activeIds = new Set(active.map((h) => h.id));
  const rainUses: RainUse[] = uses.map((u) => ({ habitId: u.habitId, coveredDate: u.coveredDate, usedOn: u.usedOn }));
  const ledger = rainLedger(active.map((h) => h.hist), rainUses.filter((u) => activeIds.has(u.habitId)), today);
  const progress = {
    totalAll: all.reduce((n, h) => n + h.state.total, 0),
    bestAny: all.reduce((n, h) => Math.max(n, h.state.best), 0),
  };

  return {
    user, today, hour,
    sky: timeOfDay(hour),
    habits: active,
    archived,
    ledger,
    progress,
    rainUses,
    weather: weekWeather(active.map((h) => h.hist), rainUses, today),
  };
}

export type Garden = Awaited<ReturnType<typeof loadGarden>>;

/** Plant choices for the habit form: art at bloom, and why a plant is locked. */
export function speciesOptions(progress: { totalAll: number; bestAny: number }) {
  return SPECIES_IDS.map((id) => {
    const u = SPECIES[id].unlock;
    return {
      id,
      label: SPECIES[id].label,
      svg: plantSVG(id, 4, 0, { className: "plant-pick" }).replace("<svg ", '<svg width="48" height="64" '),
      locked: isUnlocked(u, progress) ? null : u.kind === "total" ? `${u.n} check-ins` : u.kind === "streak" ? `${u.n} day streak` : null,
    };
  });
}

export function greeting(hour: number, name: string) {
  const part = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

export function longDate(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
