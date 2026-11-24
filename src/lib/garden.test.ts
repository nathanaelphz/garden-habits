import { describe, expect, it } from "vitest";
import {
  EVERY_DAY, WEEKDAYS, habitState, rainLedger, stageFor, nextStage, weekday, isUnlocked, SPECIES,
  rangeStats, weekWeather, type HabitHistory, type RainUse,
} from "./garden";
import { addDays, lastNDays, todayInTz } from "./dates";

const days = (from: string, n: number, skip: string[] = []) =>
  new Set(Array.from({ length: n }, (_, i) => addDays(from, i)).filter((d) => !skip.includes(d)));

const habit = (over: Partial<HabitHistory> = {}): HabitHistory => ({
  id: 1, startDate: "2026-11-01", scheduleMask: EVERY_DAY, done: new Set(), covered: new Set(), ...over,
});

describe("dates", () => {
  it("uses the local date, not UTC", () => {
    const now = new Date("2026-11-22T17:30:00Z"); // 01:30 on the 23rd in Kuala Lumpur
    expect(todayInTz("Asia/Kuala_Lumpur", now)).toBe("2026-11-23");
    expect(todayInTz("UTC", now)).toBe("2026-11-22");
  });
  it("adds days across months and lists the last n days", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(lastNDays("2026-11-22", 3)).toEqual(["2026-11-20", "2026-11-21", "2026-11-22"]);
  });
});

describe("growth", () => {
  it("maps totals to stages with the real thresholds", () => {
    expect([0, 1, 2, 3, 7, 13, 14, 29, 30].map(stageFor)).toEqual([0, 1, 1, 2, 3, 3, 4, 4, 5]);
    expect(nextStage(5)).toEqual({ name: "Bud", needed: 2 });
    expect(nextStage(40)).toBeNull();
  });
});

describe("habitState", () => {
  it("counts streak and total, today included once done", () => {
    const s = habitState(habit({ done: days("2026-11-01", 5) }), "2026-11-05");
    expect(s).toMatchObject({ total: 5, streak: 5, best: 5, stage: 2, wilt: "healthy", doneToday: true });
  });

  it("keeps yesterday's streak alive before today's check-in", () => {
    const s = habitState(habit({ done: days("2026-11-01", 4) }), "2026-11-05");
    expect(s).toMatchObject({ streak: 4, wilt: "healthy", missed: 0, doneToday: false });
  });

  it("grows with the streak: stage follows days in a row", () => {
    const s = habitState(habit({ done: days("2026-11-01", 14) }), "2026-11-14");
    expect(s).toMatchObject({ streak: 14, stage: 4 }); // bloom
  });

  it("one missed day: thirsty, the streak at risk, the plant keeps its size", () => {
    const s = habitState(habit({ done: days("2026-11-01", 7) }), "2026-11-09");
    expect(s).toMatchObject({ missed: 1, wilt: "thirsty", wiltAmount: 0.55, streak: 0, atRisk: 7, stage: 3, rainable: "2026-11-08", lost: null });
  });

  it("two missed days: dry, the streak lost", () => {
    const s = habitState(habit({ done: days("2026-11-01", 7) }), "2026-11-10");
    expect(s).toMatchObject({ missed: 2, wilt: "dry", atRisk: null, lost: 7, rainable: null });
  });

  it("checking in after a miss without a rain day starts over from a sprout", () => {
    const s = habitState(habit({ done: new Set([...days("2026-11-01", 7), "2026-11-09"]) }), "2026-11-09");
    expect(s).toMatchObject({ wilt: "healthy", streak: 1, stage: 1, best: 7, total: 8, restartedToday: true, lost: 7, grewToday: false });
    expect(s.rainable).toBe("2026-11-08"); // still rescuable today
  });

  it("a rain day saves the streak but adds no check-in", () => {
    const s = habitState(habit({ done: new Set([...days("2026-11-01", 7), "2026-11-09"]), covered: new Set(["2026-11-08"]) }), "2026-11-09");
    expect(s).toMatchObject({ total: 8, streak: 9, stage: 3, wilt: "healthy", restartedToday: false, lost: null });
  });

  it("days off never make a plant thirsty or break a streak", () => {
    // 2026-11-02 is a Monday. Weekdays only; the weekend of 7-8 Nov is off.
    expect(weekday("2026-11-02")).toBe(0);
    const done = new Set(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
    const s = habitState(habit({ startDate: "2026-11-02", scheduleMask: WEEKDAYS, done }), "2026-11-09");
    expect(s).toMatchObject({ streak: 5, missed: 0, wilt: "healthy", scheduledToday: true });
  });

  it("flags growing a stage today", () => {
    const s = habitState(habit({ done: days("2026-11-01", 3) }), "2026-11-03");
    expect(s.grewToday).toBe(true); // 2 -> 3 check-ins: sprout -> seedling
  });
});

describe("rain days", () => {
  it("earns one per 7 full days and holds at most 3", () => {
    const r = rainLedger([habit({ done: days("2026-11-01", 30) })], [], "2026-12-01");
    expect(r.earned).toBe(3); // 30 full days = 4 runs of 7, capped at 3 held
    expect(r.held).toBe(3);
  });

  it("spends one when used, and the covered day still counts as full", () => {
    const h = habit({ done: days("2026-11-01", 30, ["2026-11-10"]), covered: new Set(["2026-11-10"]) });
    const used: RainUse[] = [{ habitId: 1, coveredDate: "2026-11-10", usedOn: "2026-11-11" }];
    const r = rainLedger([h], used, "2026-12-01");
    expect(r.used).toBe(1);
    expect(r.earned).toBe(4); // run never broke, so a 4th could be earned after spending one
    expect(r.held).toBe(3);
  });

  it("a missed day breaks the run", () => {
    const r = rainLedger([habit({ done: days("2026-11-01", 10, ["2026-11-05"]) })], [], "2026-11-11");
    expect(r.earned).toBe(0);
    expect(r.progress).toBe(5);
  });
});

describe("unlocks, weather, stats", () => {
  it("unlocks by total or streak", () => {
    expect(isUnlocked(SPECIES.monstera.unlock, { totalAll: 49, bestAny: 0 })).toBe(false);
    expect(isUnlocked(SPECIES.monstera.unlock, { totalAll: 50, bestAny: 0 })).toBe(true);
    expect(isUnlocked(SPECIES.moonflower.unlock, { totalAll: 0, bestAny: 21 })).toBe(true);
  });
  it("reads the week as weather", () => {
    expect(weekWeather([habit({ done: days("2026-11-01", 10) })], [], "2026-11-11").kind).toBe("sunny");
    expect(weekWeather([habit({ startDate: "2026-11-11" })], [], "2026-11-11").kind).toBe("new");
  });
  it("computes completion over a range", () => {
    const s = rangeStats([habit({ done: days("2026-11-01", 5, ["2026-11-03"]) })], "2026-11-01", "2026-11-05");
    expect(s).toMatchObject({ due: 5, kept: 4 });
    expect(s.rate).toBeCloseTo(0.8);
  });
});
