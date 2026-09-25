import { describe, expect, it } from "vitest";
import { formatTimerClock, formatTimerDate, formatTimerDateTime } from "./dateTime";

const date = new Date(2026, 8, 22, 16, 42);

describe("localized timer date and clock", () => {
  it("formats every supported locale without changing the timestamp", () => {
    const stamp = date.getTime();
    expect(formatTimerDate(date, "en", "standard", true)).toContain("2026");
    expect(formatTimerDate(date, "zh-CN", "standard", true)).toContain("2026");
    expect(formatTimerDate(date, "zh-TW", "standard", true)).toContain("2026");
    expect(formatTimerDate(date, "ja", "standard", true)).toContain("2026");
    expect(date.getTime()).toBe(stamp);
  });

  it("supports 12-hour, 24-hour, and independently hidden values", () => {
    expect(formatTimerClock(date, "en", "12-hour")).toMatch(/PM/i);
    expect(formatTimerClock(date, "en", "24-hour")).toContain("16");
    expect(formatTimerDateTime(date, "en", { showDate: false, dateFormat: "standard", showWeekday: true, showClock: false, clockFormat: "system" })).toBe("");
    expect(formatTimerDateTime(date, "en", { showDate: true, dateFormat: "compact", showWeekday: false, showClock: true, clockFormat: "24-hour" })).toContain("·");
  });
});

it("keeps weekday style independent of date format and date-only previews", () => {
  for (const format of ["full","standard","compact","numeric"] as const) {
    expect(formatTimerDate(date,"en",format,true,"full")).toContain("Tuesday");
    expect(formatTimerDate(date,"en",format,true,"short")).toContain("Tue");
    expect(formatTimerDate(date,"en",format,true,"short")).not.toContain("Tuesday");
    expect(formatTimerDate(date,"en",format,false,"full")).not.toContain("Tue");
  }
});
