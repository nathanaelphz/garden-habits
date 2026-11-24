import { describe, expect, it } from "vitest";
import { currentStreak, growthStage, longestStreak } from "./streak";
import { addDays, lastNDays, todayInTz } from "./dates";

const set = (...d: string[]) => new Set(d);

describe("currentStreak", () => {
  it("is 0 with no logs", () => {
    expect(currentStreak(set(), "2026-11-22")).toBe(0);
  });
  it("counts back from today when today is done", () => {
    expect(currentStreak(set("2026-11-20", "2026-11-21", "2026-11-22"), "2026-11-22")).toBe(3);
  });
  it("stays alive from yesterday when today isn't done yet", () => {
    expect(currentStreak(set("2026-11-20", "2026-11-21"), "2026-11-22")).toBe(2);
  });
  it("breaks after a missed day", () => {
    expect(currentStreak(set("2026-11-19", "2026-11-20"), "2026-11-22")).toBe(0);
  });
  it("crosses month and year boundaries", () => {
    expect(currentStreak(set("2025-12-31", "2026-01-01"), "2026-01-01")).toBe(2);
  });
});

describe("longestStreak", () => {
  it("finds the longest run", () => {
    const d = set("2026-11-01", "2026-11-02", "2026-11-05", "2026-11-06", "2026-11-07");
    expect(longestStreak(d)).toBe(3);
  });
  it("is 0 when empty", () => expect(longestStreak(set())).toBe(0));
});

describe("growthStage", () => {
  it("maps totals to stages", () => {
    expect(growthStage(0).name).toBe("Seed");
    expect(growthStage(7).name).toBe("Bud");
    expect(growthStage(100)).toEqual({ name: "Mature", next: null });
    expect(growthStage(5).next).toEqual({ name: "Bud", needed: 2 });
  });
});

describe("dates", () => {
  it("uses the local date, not UTC", () => {
    // 2026-11-22 17:30 UTC is already 01:30 on the 23rd in Kuala Lumpur.
    const now = new Date("2026-11-22T17:30:00Z");
    expect(todayInTz("Asia/Kuala_Lumpur", now)).toBe("2026-11-23");
    expect(todayInTz("UTC", now)).toBe("2026-11-22");
  });
  it("adds days and lists the last n days", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(lastNDays("2026-11-22", 3)).toEqual(["2026-11-20", "2026-11-21", "2026-11-22"]);
  });
});
