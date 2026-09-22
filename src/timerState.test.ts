import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { FocusDatabase } from "./db";
import { filterSessions } from "./analytics/analytics";
import { createDevelopmentAnalyticsDataset } from "./analytics/developmentDataset";
import { completedSession, currentStreak, extendTimerState, initialTimerState, LAST_TIMER_DURATION_KEY, localDateInputValue, startTimerState, todaySummary } from "./timerState";
import { EXTEND_PRESETS_MINUTES } from "./components/TimerExtendMenu";
import { normaliseDuration } from "./settings";

const opened: Dexie[] = [];
const database = () => { const value = new FocusDatabase(`focus-timer-test-${crypto.randomUUID()}`); opened.push(value); return value; };
const year = { id: "year", name: "University Year 1", archived: false };
const subject = { id: "subject", academicYearId: year.id, name: "Mathematics", color: "#4da3ff", archived: false };

afterEach(async () => { await Promise.all(opened.splice(0).map((value) => value.delete())); });

describe("timer persistence and summaries", () => {
  it("uses persisted non-archived Sessions only for Today", () => {
    const now = new Date(2026, 8, 22, 12).getTime();
    const rows = [21, 2, 1, 2].map((seconds, index) => ({ id:String(index),subjectId:subject.id,subjectName:subject.name,academicYearId:year.id,academicYearName:year.name,startTime:now+index*1000,endTime:now+(index+seconds)*1000,focusedDurationSeconds:seconds,archived:false }));
    rows.push({ ...rows[0], id:"archived", focusedDurationSeconds:999, archived:true });
    expect(todaySummary(rows, now).focusedDurationSeconds).toBe(26);
    expect(todaySummary(rows, now).sessions).toHaveLength(4);
    expect(currentStreak(rows, now)).toBe(1);
  });

  it("retains a note through extension and writes it to the completed Session", () => {
    const started = startTimerState({ ...initialTimerState, note:"Chapter 3 questions" }, 1500, subject, year, 1_000, "session");
    const extended = extendTimerState({ ...started, remainingSeconds: 1400 }, 900, 101_000);
    expect(extended.note).toBe("Chapter 3 questions");
    expect(JSON.parse(JSON.stringify(extended)).note).toBe("Chapter 3 questions");
    expect(completedSession({ ...extended, remainingSeconds: 0 }, 2_401_000)?.note).toBe("Chapter 3 questions");
  });

  it("uses the approved presets and normalizes custom extension overflow", () => {
    expect(EXTEND_PRESETS_MINUTES).toEqual([5,15,30,60]);
    expect(normaliseDuration(2,75,90)).toEqual({total:11790,hours:3,minutes:16,seconds:30});
    const started=startTimerState(initialTimerState,3000,subject,year,1_000,"same-session");
    const paused={...started,paused:true,targetEnd:null,note:"Keep this"};
    const extended=extendTimerState(paused,1200,2_000);
    expect(extended).toMatchObject({sessionId:"same-session",subjectId:"subject",note:"Keep this",paused:true,remainingSeconds:4200});
    expect(extendTimerState(started,0)).toBe(started);
  });

  it("resumes the same expired Session when it is extended", () => {
    const finished={...startTimerState(initialTimerState,300,subject,year,1_000,"session"),remainingSeconds:0,targetEnd:null,finished:true,finishedAt:301_000};
    expect(extendTimerState(finished,300,400_000)).toMatchObject({sessionId:"session",running:true,paused:false,finished:false,remainingSeconds:300,targetEnd:700_000});
  });

  it("persists the last started duration without replacing it on extension", async () => {
    const testDb = database();
    await testDb.settings.put({ key: LAST_TIMER_DURATION_KEY, value: "1500" });
    extendTimerState(startTimerState(initialTimerState, 1500, subject, year, 1_000, "session"), 900);
    expect((await testDb.settings.get(LAST_TIMER_DURATION_KEY))?.value).toBe("1500");
  });

  it("clearing Sessions preserves all other tables", async () => {
    const testDb = database();
    await testDb.academicYears.add(year); await testDb.subjects.add(subject); await testDb.settings.put({key:"preference",value:"kept"});
    await testDb.sessions.add({id:"session",subjectId:subject.id,subjectName:subject.name,academicYearId:year.id,academicYearName:year.name,startTime:1_000,endTime:2_000,focusedDurationSeconds:1,archived:false});
    await testDb.sessions.clear();
    expect(filterSessions(await testDb.sessions.toArray())).toHaveLength(0);
    expect(await testDb.academicYears.count()).toBe(1); expect(await testDb.subjects.count()).toBe(1); expect(await testDb.settings.get("preference")).toBeTruthy();
  });

  it("permanently deletes exactly one Session", async () => {
    const testDb = database();
    const session = (id:string) => ({id,subjectId:subject.id,subjectName:subject.name,academicYearId:year.id,academicYearName:year.name,startTime:1_000,endTime:2_000,focusedDurationSeconds:1,archived:false});
    await testDb.sessions.bulkAdd([session("one"),session("two")]);
    await testDb.sessions.delete("one");
    expect((await testDb.sessions.toArray()).map((row)=>row.id)).toEqual(["two"]);
  });

  it("round-trips the local edit date without UTC conversion", () => {
    const stamp = new Date(2026, 8, 22, 0, 30).getTime();
    expect(localDateInputValue(stamp)).toBe("2026-09-22");
    expect(localDateInputValue(new Date(`${localDateInputValue(stamp)}T00:30`).getTime())).toBe("2026-09-22");
  });

  it("keeps the analytics demo entirely outside IndexedDB", async () => {
    const testDb = database();
    createDevelopmentAnalyticsDataset(100);
    expect(await testDb.sessions.count()).toBe(0);
  });
});
