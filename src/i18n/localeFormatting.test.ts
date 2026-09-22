import { describe, expect, it } from "vitest";
import { formatTimerClock, formatTimerDate } from "../dateTime";
import { formatDurationForLocale } from "../data";

describe("supported locale date formatting", () => {
  const date = new Date(2026, 8, 21, 13, 5);

  it.each(["en", "zh-CN", "zh-TW", "ja"] as const)("formats dates and clocks for %s", (locale) => {
    expect(formatTimerDate(date, locale, "standard", true)).not.toHaveLength(0);
    expect(formatTimerClock(date, locale, "24-hour")).toMatch(/13.*05/);
  });

  it("uses localized duration units", () => {
    expect(formatDurationForLocale(4 * 3600 + 20 * 60, "zh-CN")).toBe("4 小时 20 分钟");
    expect(formatDurationForLocale(4 * 3600 + 20 * 60, "zh-TW")).toBe("4 小時 20 分鐘");
    expect(formatDurationForLocale(4 * 3600 + 20 * 60, "ja")).toBe("4 時間 20 分");
  });
});
