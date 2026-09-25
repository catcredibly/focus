import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { FocusDatabase } from "./db";
import { ACTIVE_TIMER_STORAGE_KEY } from "./timerState";
import { clearAllFocusData, DEFAULT_SETTINGS, formatLastBackup, greeting, hasActiveTimer, loadSettings, normaliseDuration, normalizeGoalSeconds, normalizeGoalPart, goalDurationSeconds, saveSetting, timerDefaultDuration } from "./settings";

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
    expect(DEFAULT_SETTINGS.popoutAutoHideDelaySeconds).toBe(0.4);
    expect(DEFAULT_SETTINGS.popoutAutoHideTabSize).toBe("medium");
    expect(DEFAULT_SETTINGS.popoutAutoHideShowAccent).toBe(true);
  });

  it("persists typed preferences and falls back from invalid enum values", async () => {
    const testDb = database();
    await saveSetting("displayName", "Alex", testDb);
    await saveSetting("accentColour", "miku", testDb);
    await saveSetting("popoutAlwaysOnTop", false, testDb);
    await saveSetting("popoutTransparency", 0, testDb);
    await testDb.settings.put({ key: "uiScale", value: "enormous" });
    await testDb.settings.put({ key: "popoutAutoHideDelaySeconds", value: "-2" });
    const settings = await loadSettings(testDb);
    expect(settings.displayName).toBe("Alex");
    expect(settings.accentColour).toBe("miku");
    expect(settings.popoutAlwaysOnTop).toBe(false);
    expect(settings.popoutTransparency).toBe(0);
    expect(settings.uiScale).toBe("medium");
    expect(settings.allowDirectActiveDeletion).toBe(false);
    expect(settings.popoutAutoHideDelaySeconds).toBe(0);
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


describe("goal duration limits", () => {
  it.each([[23,59,86340],[24,0,86400],[24,1,86400],[25,0,86400],[-1,-1,0],[2,80,10740]])("normalizes %i:%i", (hours,minutes,expected) => {
    expect(goalDurationSeconds(hours,minutes)).toBe(expected);
  });
  it("clamps keyboard increments and malformed values", () => {
    expect(normalizeGoalPart("hours",24+1)).toBe(24);
    expect(normalizeGoalPart("hours",0-1)).toBe(0);
    expect(normalizeGoalPart("minutes",60)).toBe(59);
    expect(normalizeGoalPart("minutes",-1)).toBe(0);
    for (const value of [NaN,Infinity,null,"garbage",""]) expect(normalizeGoalSeconds(value)).toBe(0);
  });
  it("enforces limits at save and legacy decode boundaries", async () => {
    const testDb = database();
    for (const key of ["dailyGoalSeconds", "weeklyGoalSeconds"] as const) {
      await saveSetting(key,999999,testDb);
      expect((await testDb.settings.get(key))?.value).toBe("86400");
      await testDb.settings.put({key,value:"90000"});
      expect((await loadSettings(testDb))[key]).toBe(86400);
      for (const value of ["null","NaN","garbage",""]) {
        await testDb.settings.put({key,value});
        expect((await loadSettings(testDb))[key]).toBe(DEFAULT_SETTINGS[key]);
      }
    }
  });
});
