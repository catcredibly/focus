import { describe, expect, it } from "vitest";
import { formatTimerClock, formatTimerDate } from "../dateTime";

describe("supported locale date formatting", () => {
  const date = new Date(2026, 8, 21, 13, 5);

  it.each(["en", "zh-CN", "zh-TW", "ja"] as const)("formats dates and clocks for %s", (locale) => {
    expect(formatTimerDate(date, locale, "standard", true)).not.toHaveLength(0);
    expect(formatTimerClock(date, locale, "24-hour")).toMatch(/13.*05/);
  });
});
