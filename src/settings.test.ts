import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { FocusDatabase } from "./db";
import { ACTIVE_TIMER_STORAGE_KEY } from "./timerState";
import { clearAllFocusData, DEFAULT_SETTINGS, formatLastBackup, greeting, hasActiveTimer, loadSettings, normaliseDuration, saveSetting, timerDefaultDuration } from "./settings";

const opened: Dexie[] = [];
const database = () => { const value = new FocusDatabase(`focus-settings-test-${crypto.randomUUID()}`); opened.push(value); return value; };
const storage = (timer: unknown = null) => {
  const values = new Map<string, string>();
  if (timer) values.set(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(timer));
  return { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => void values.delete(key) };
};

afterEach(async () => { await Promise.all(opened.splice(0).map((value) => value.delete())); });

describe("application settings", () => {
  it("provides one complete set of defaults when keys are absent", async () => {
    expect(await loadSettings(database())).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.accentColour).toBe("orange");
    expect(DEFAULT_SETTINGS.popoutDockingEnabled).toBe(false);
    expect(DEFAULT_SETTINGS.popoutDocked).toBe(false);
  });

  it("persists typed preferences and falls back from invalid enum values", async () => {
    const testDb = database();
    await saveSetting("displayName", "Alex", testDb);
    await saveSetting("accentColour", "miku", testDb);
    await saveSetting("popoutAlwaysOnTop", false, testDb);
    await testDb.settings.put({ key: "uiScale", value: "enormous" });
    const settings = await loadSettings(testDb);
    expect(settings.displayName).toBe("Alex");
    expect(settings.accentColour).toBe("miku");
    expect(settings.popoutAlwaysOnTop).toBe(false);
    expect(settings.uiScale).toBe("medium");
    expect(settings.allowDirectActiveDeletion).toBe(false);
    await saveSetting("allowDirectActiveDeletion", true, testDb);
    expect((await loadSettings(testDb)).allowDirectActiveDeletion).toBe(true);
  });

  it("formats contextual greetings without dangling punctuation", () => {
    expect(greeting("Alex", 8)).toBe("Good morning, Alex");
    expect(greeting("  ", 14)).toBe("Good afternoon");
    expect(greeting("Daniel", 20)).toBe("Good evening, Daniel");
  });

  it("selects remembered or fixed defaults without changing the remembered base", () => {
    const remembered = { ...DEFAULT_SETTINGS, lastTimerDurationSeconds: 45 * 60 };
    expect(timerDefaultDuration(remembered)).toBe(45 * 60);
    expect(timerDefaultDuration({ ...remembered, timerDurationMode: "fixed", fixedTimerDurationSeconds: 25 * 60 })).toBe(25 * 60);
    expect(normaliseDuration(0, 75, 90)).toEqual({ total: 4590, hours: 1, minutes: 16, seconds: 30 });
  });

  it("detects active and expired unfinished timers", () => {
    expect(hasActiveTimer(storage())).toBe(false);
    expect(hasActiveTimer(storage({ running: true }))).toBe(true);
    expect(hasActiveTimer(storage({ running: false, paused: false, sessionId: "session", startedAt: 1 }))).toBe(true);
  });

  it("blocks clear-all during a timer and otherwise removes every persistent table", async () => {
    const testDb = database();
    await testDb.academicYears.add({ id: "year", name: "IB", archived: false });
    await testDb.subjects.add({ id: "subject", academicYearId: "year", name: "Physics", color: "#ff922b", archived: false });
    await testDb.sessions.add({ id: "session", subjectId: "subject", subjectName: "Physics", academicYearId: "year", academicYearName: "IB", startTime: 1, endTime: 2, focusedDurationSeconds: 1, archived: false });
    await saveSetting("displayName", "Alex", testDb);
    await expect(clearAllFocusData(testDb, storage({ paused: true }))).rejects.toThrow("Finish or stop");
    expect(await testDb.sessions.count()).toBe(1);
    await clearAllFocusData(testDb, storage());
    expect(await Promise.all([testDb.academicYears.count(), testDb.subjects.count(), testDb.sessions.count(), testDb.settings.count()])).toEqual([0, 0, 0, 0]);
  });

  it("formats the last backup setting defensively", () => {
    expect(formatLastBackup(null)).toBe("Never");
    expect(formatLastBackup("not-a-date")).toBe("Never");
    expect(formatLastBackup("2026-09-22T07:45:00.000Z", "en-NZ")).toContain("2026");
  });
});
