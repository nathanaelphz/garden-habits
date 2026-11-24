import { and, eq, inArray, isNull } from "drizzle-orm";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { lastNDays, todayInTz } from "@/lib/dates";
import { PLANTS, isPlantType } from "@/lib/plants";
import { getCurrentUser } from "@/lib/session";
import { currentStreak, growthStage, longestStreak } from "@/lib/streak";
import { archiveHabit, createHabit, toggleToday } from "./actions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <Suspense fallback={<p className="text-stone-500">Loading your garden…</p>}>
        <Garden />
      </Suspense>
    </main>
  );
}

async function Garden() {
  await connection(); // always render per request: data is personal and changes daily
  const user = await getCurrentUser();
  const today = todayInTz(user.timezone);
  const week = lastNDays(today, 7);

  const myHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, user.id), isNull(habits.archivedAt)))
    .orderBy(habits.createdAt);

  const logs = myHabits.length
    ? await db
        .select({ habitId: habitLogs.habitId, logDate: habitLogs.logDate })
        .from(habitLogs)
        .where(inArray(habitLogs.habitId, myHabits.map((h) => h.id)))
    : [];

  const doneByHabit = new Map<number, Set<string>>();
  for (const l of logs) {
    if (!doneByHabit.has(l.habitId)) doneByHabit.set(l.habitId, new Set());
    doneByHabit.get(l.habitId)!.add(l.logDate);
  }

  const doneToday = myHabits.filter((h) => doneByHabit.get(h.id)?.has(today)).length;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">🌱 Hi, {user.name}</h1>
        <p className="mt-1 text-stone-600">
          {myHabits.length === 0
            ? "Plant your first habit below."
            : `${doneToday} of ${myHabits.length} watered today · ${today}`}
        </p>
      </header>

      <ul className="space-y-3">
        {myHabits.map((h) => {
          const done = doneByHabit.get(h.id) ?? new Set<string>();
          const isDone = done.has(today);
          const streak = currentStreak(done, today);
          const stage = growthStage(done.size);
          const plant = PLANTS[isPlantType(h.plantType) ? h.plantType : "fern"];

          return (
            <li key={h.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <form action={toggleToday}>
                <input type="hidden" name="habitId" value={h.id} />
                <button
                  aria-label={isDone ? `Undo ${h.name} today` : `Mark ${h.name} done today`}
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl transition ${
                    isDone ? "bg-green-100 ring-2 ring-green-600" : "bg-stone-100 grayscale hover:grayscale-0"
                  }`}
                >
                  {done.size === 0 ? "🌰" : plant.emoji}
                </button>
              </form>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{h.name}</p>
                <p className="text-sm text-stone-600">
                  {stage.name}
                  {stage.next && ` · ${stage.next.needed} to ${stage.next.name}`}
                  {" · "}🔥 {streak} (best {longestStreak(done)})
                </p>
                <div className="mt-2 flex gap-1" aria-label="Last 7 days">
                  {week.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={`h-2.5 w-2.5 rounded-full ${done.has(d) ? "bg-green-600" : "bg-stone-200"}`}
                    />
                  ))}
                </div>
              </div>

              <form action={archiveHabit}>
                <input type="hidden" name="habitId" value={h.id} />
                <button className="text-sm text-stone-400 hover:text-red-600" aria-label={`Archive ${h.name}`}>
                  ✕
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <form action={createHabit} className="mt-6 flex gap-2">
        <input
          name="name"
          required
          maxLength={60}
          placeholder="New habit, e.g. Read 20 min"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-green-600"
        />
        <select name="plantType" className="rounded-lg border border-stone-300 bg-white px-2" aria-label="Plant">
          {Object.entries(PLANTS).map(([key, p]) => (
            <option key={key} value={key}>
              {p.emoji} {p.label}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-green-700 px-4 font-medium text-white hover:bg-green-800">Plant</button>
      </form>
    </>
  );
}
