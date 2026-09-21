import { describe, expect, it } from "vitest";
import { filterSessions, heatmapScale, subjectTotals, timeOfDayMatrix } from "./analytics";
import { createDevelopmentAnalyticsDataset } from "./developmentDataset";

describe("development analytics dataset", () => {
  it("covers realistic large-data cases without persistence", () => {
    const data = createDevelopmentAnalyticsDataset(20_000);
    expect(data.academicYears).toHaveLength(4);
    expect(data.subjects.length).toBeGreaterThanOrEqual(20);
    expect(data.sessions.length).toBeGreaterThan(10_000);
    expect(data.sessions.some((session) => session.archived)).toBe(true);
    expect(new Set(data.sessions.map((session) => new Date(session.startTime).getFullYear())).size).toBe(5);
  });

  it("aggregates the large fixture within an interactive budget", () => {
    const data = createDevelopmentAnalyticsDataset(20_000);
    const started = performance.now();
    const sessions = filterSessions(data.sessions);
    subjectTotals(sessions, data.subjects);
    heatmapScale(sessions);
    timeOfDayMatrix(sessions);
    expect(performance.now() - started).toBeLessThan(1_500);
  });
});
