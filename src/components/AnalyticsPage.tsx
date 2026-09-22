import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CalendarDays, Clock3, Flame, Layers3 } from "lucide-react";
import { db } from "../db";
import { formatDuration, formatDurationAxis } from "../data";
import type { AcademicYear, FocusSession, Subject } from "../types";
import { createDevelopmentAnalyticsDataset } from "../analytics/developmentDataset";
import { academicYearTotals, activeDayCount, averageActiveDaySeconds, calendarDailySeries, calendarMonthlySeries, cumulativeTotals, dailyTotals, filterSessions, heatmapLevel, heatmapScale, localDayKey, longestStreak, medianSessionSeconds, monthlyTotals, rollingAverage, sessionLengthBuckets, subjectTotals, timeOfDayMatrix, totalFocusedSeconds, weekdayTotals, weeklyTotals } from "../analytics/analytics";
import { useTranslation } from "react-i18next";
import { goalProgress } from "../goals";
import { useSettings } from "../hooks/useSettings";
import { localeCode } from "../i18n";

const YEAR_COLORS = ["#4da3ff", "#a879ff", "#4dd39a", "#ffad3b", "#ff7eb6", "#8da2b5"];
const ACCENT_COLORS = {
  coral: { primary: "#f06464", tint: "#f6a1a1" },
  orange: { primary: "#ff922b", tint: "#ffc078" },
  pink: { primary: "#e98aaa", tint: "#f3b4ca" },
  miku: { primary: "#58aeb8", tint: "#92d0d7" },
  cappuccino: { primary: "#ad8466", tint: "#d0ae95" },
} as const;
const ranges = ["7D", "30D", "3M", "1Y", "All"] as const;
type Range = (typeof ranges)[number];
const tabs = ["Overview", "Subjects", "Academic Years", "Time Trends", "Study Patterns"] as const;
type Tab = (typeof tabs)[number];
const rangeStart = (range: Range) => {
  if (range === "All") return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (range === "7D" ? 6 : range === "30D" ? 29 : range === "3M" ? 89 : 364));
  return d.getTime();
};
const durationTick = formatDurationAxis;

export function AnalyticsPage() {
  const { t } = useTranslation();
  const storedYears = useLiveQuery(() => db.academicYears.toArray(), []),
    storedSubjects = useLiveQuery(() => db.subjects.toArray(), []),
    storedSessions = useLiveQuery(() => db.sessions.orderBy("startTime").toArray(), []);
  const demoEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get("analyticsDemo") === "1";
  const demo = useMemo(() => (demoEnabled ? createDevelopmentAnalyticsDataset(20_000) : undefined), [demoEnabled]);
  const years = demo?.academicYears ?? storedYears,
    subjects = demo?.subjects ?? storedSubjects,
    sessions = demo?.sessions ?? storedSessions;
  const [tab, setTab] = useState<Tab>("Overview"),
    [yearId, setYearId] = useState(""),
    [subjectId, setSubjectId] = useState(""),
    [range, setRange] = useState<Range>("All");
  const effectiveSessions = useMemo(() => (sessions ?? []).filter((session) => {
    const subject = subjects?.find((item) => item.id === session.subjectId);
    const year = years?.find((item) => item.id === session.academicYearId);
    return subject && year && !subject.archived && !year.archived;
  }), [sessions, subjects, years]);
  const scopedSessions = useMemo(() => filterSessions(effectiveSessions, {
    academicYearId: yearId || undefined,
    subjectId: subjectId || undefined,
  }), [effectiveSessions, subjectId, yearId]);
  const filtered = useMemo(
    () =>
      filterSessions(scopedSessions, {
        start: rangeStart(range),
      }),
    [range, scopedSessions],
  );
  if (!years || !subjects || !sessions)
    return (
      <main className="page analytics-page">
        <div className="analytics-loading">
          <span />
          <span />
          <span />
        </div>
      </main>
    );
  return (
    <main className="page analytics-page">
      {demoEnabled && <div className="analytics-demo-banner">Development dataset · {sessions.length.toLocaleString()} generated Sessions · in memory only</div>}
      <header className="analytics-header">
        <div>
          <h1>{t("Analytics")}</h1>
          <p>{t("Explore your study habits across subjects, Academic Years, and self-study.")}</p>
        </div>
        <div className="analytics-filters">
          <select aria-label={t("Academic Year")} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">{t("All Years")}</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          <select aria-label={t("Subject")} value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">{t("All Subjects")}</option>
            {subjects.filter((subject) => !subject.archived && (!yearId || subject.academicYearId === yearId)).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <div className="range-control" aria-label={t("Date range")}>
            {ranges.map((r) => (
              <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
                {t(r)}
              </button>
            ))}
          </div>
        </div>
      </header>
      <nav className="analytics-tabs" aria-label={t("Analytics views")}>
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {t(item)}
          </button>
        ))}
      </nav>
      {!filtered.length ? (
        <div className="analytics-empty">
          <BarChart3 />
          <h2>{t("No Sessions in this range")}</h2>
          <p>{t("Try another date range or Academic Year.")}</p>
        </div>
      ) : tab === "Overview" ? (
        <Overview sessions={filtered} comparisonSessions={scopedSessions} years={years} subjects={subjects} range={range} />
      ) : tab === "Subjects" ? (
        <SubjectsAnalytics sessions={filtered} subjects={subjects} years={years} />
      ) : tab === "Academic Years" ? (
        <YearsAnalytics sessions={filtered} years={years} subjects={subjects} />
      ) : tab === "Time Trends" ? (
        <TimeTrends sessions={filtered} subjects={subjects} />
      ) : (
        <StudyPatterns sessions={filtered} />
      )}
    </main>
  );
}

function GoalSummary({ label, current, target }: { label: string; current: number; target: number }) {
  const { t } = useTranslation();
  const reached = target > 0 && current >= target;
  return <section><div><strong>{label}</strong><span>{reached ? t("Goal reached") : t("{{duration}} left", { duration: formatDuration(Math.max(0, target - current)) })}</span></div><progress max={Math.max(1, target)} value={Math.min(current, target)}/><small>{formatDuration(current)} / {formatDuration(target)}</small></section>;
}

function Overview({ sessions, comparisonSessions, years, subjects, range }: { sessions: FocusSession[]; comparisonSessions: FocusSession[]; years: AcademicYear[]; subjects: Subject[]; range: Range }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const goals = goalProgress(sessions);
  const accent = ACCENT_COLORS[settings.accentColour];
  const subjectsData = subjectTotals(sessions, subjects),
    yearData = academicYearTotals(sessions, years, subjects),
    top = subjectsData.slice(0, 6),
    other = subjectsData.slice(6).reduce((n, s) => n + s.seconds, 0),
    pie = [...top.map((s) => ({ name: s.name, value: s.seconds, color: s.color })), ...(other ? [{ name: t("Other"), value: other, color: "#71879d" }] : [])];
  const start = Math.min(...sessions.map((session) => session.startTime));
  const daily = calendarDailySeries(sessions, start, Date.now() + 86_400_000);
  const averages = [7, 30, 90, 365].map((days) => rollingAverage(daily, days));
  const focusTimeline = daily.map((point, index) => ({
    ...point,
    avg7: averages[0][index].averageSeconds,
    avg30: averages[1][index].averageSeconds,
    avg90: averages[2][index].averageSeconds,
    avg365: averages[3][index].averageSeconds,
  }));
  const monthSubjects = new Map<string, Map<string, number>>();
  for (const session of sessions) {
    const date = new Date(session.startTime), key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const values = monthSubjects.get(key) ?? new Map<string, number>();
    values.set(session.subjectId, (values.get(session.subjectId) ?? 0) + session.focusedDurationSeconds);
    monthSubjects.set(key, values);
  }
  const subjectShare = [...monthSubjects].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
    const total = [...values.values()].reduce((sum, value) => sum + value, 0);
    return { label: new Date(`${key}-01T12:00:00`).toLocaleDateString(localeCode(), { month: "short", year: "2-digit" }), ...Object.fromEntries(top.map((subject) => [subject.subjectId, (values.get(subject.subjectId) ?? 0) / Math.max(1, total) * 100])) };
  });
  const currentSeconds = totalFocusedSeconds(sessions);
  const currentStart = rangeStart(range);
  const periodLength = currentStart ? Date.now() - currentStart : 0;
  const previousSessions = currentStart ? comparisonSessions.filter((session) => session.startTime >= currentStart - periodLength && session.startTime < currentStart) : [];
  const previousSeconds = totalFocusedSeconds(previousSessions);
  const comparisonPercent = previousSeconds ? Math.round((currentSeconds - previousSeconds) / previousSeconds * 100) : undefined;
  const days = dailyTotals(sessions);
  const bestDay = days.reduce((best, day) => day.seconds > (best?.seconds ?? 0) ? day : best, days[0]);
  const longestSession = sessions.reduce((best, session) => session.focusedDurationSeconds > (best?.focusedDurationSeconds ?? 0) ? session : best, sessions[0]);
  return (
    <div className="analytics-content">
      <div className="metric-strip metric-strip--five">
        <Metric icon={<Clock3 />} label={t("Total focus time")} value={formatDuration(totalFocusedSeconds(sessions))} />
        <Metric icon={<Layers3 />} label={t("Total Sessions")} value={sessions.length.toLocaleString()} />
        <Metric icon={<BarChart3 />} label={t("Average Session")} value={formatDuration(Math.round(totalFocusedSeconds(sessions) / Math.max(1, sessions.length)))} />
        <Metric icon={<Flame />} label={t("Longest streak")} value={t("{{count}} days", { count: longestStreak(sessions) })} />
        <Metric icon={<CalendarDays />} label={t("Active study days")} value={String(activeDayCount(sessions))} />
      </div>
      {(settings.dailyGoalEnabled || settings.weeklyGoalEnabled) && <div className="analytics-goals">
        {settings.dailyGoalEnabled && <GoalSummary label={t("Daily goal")} current={goals.dailySeconds} target={settings.dailyGoalSeconds}/>}
        {settings.weeklyGoalEnabled && <GoalSummary label={t("Weekly goal")} current={goals.weeklySeconds} target={settings.weeklyGoalSeconds}/>}
      </div>}
      <div className="analytics-insights-row">
        <Panel title={t("Period comparison")}>
          <div className="analytics-highlight"><strong>{formatDuration(currentSeconds)}</strong><span>{comparisonPercent === undefined ? t("No previous period") : t("{{percent}}% vs previous period", { percent: comparisonPercent > 0 ? `+${comparisonPercent}` : comparisonPercent })}</span></div>
        </Panel>
        <Panel title={t("Personal bests")}>
          <div className="analytics-best-list"><span>{t("Longest Session")}<strong>{formatDuration(longestSession.focusedDurationSeconds)}</strong></span><span>{t("Best day")}<strong>{bestDay ? formatDuration(bestDay.seconds) : "-"}</strong></span></div>
        </Panel>
      </div>
      <div className="overview-grid">
        <Panel className="wide" title={t("Focus time over time")} subtitle={t("Daily totals and rolling calendar-day averages.")}>
          <ScrollChart width={Math.max(760, focusTimeline.length * 13)}>
            <ComposedChart data={focusTimeline} accessibilityLayer>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={11} />
              <YAxis tickFormatter={durationTick} stroke="#7890a4" fontSize={11} />
              <Tooltip content={<DurationTooltip />} />
              <Bar dataKey="seconds" name={t("Daily total")} fill={accent.primary} opacity={0.72} />
              <Line dataKey="avg7" name={t("7-day average")} stroke={accent.tint} dot={false} strokeWidth={2} />
              <Line dataKey="avg30" name={t("30-day average")} stroke="#4da3ff" dot={false} strokeWidth={2} />
              <Line dataKey="avg90" name={t("3-month average")} stroke="#4dd39a" dot={false} strokeWidth={2} />
              <Line dataKey="avg365" name={t("1-year average")} stroke="#a879ff" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ScrollChart>
        </Panel>
        <Panel title={t("Focus time by Academic Year")}>
          {yearData.map((year, index) => (
            <div className="breakdown-row" key={year.academicYearId}>
              <span title={year.name}>{year.name}</span>
              <strong>{formatDuration(year.seconds)}</strong>
              <i
                style={{
                  width: `${(year.seconds / (yearData[0]?.seconds || 1)) * 100}%`,
                  background: YEAR_COLORS[index % YEAR_COLORS.length],
                }}
              />
            </div>
          ))}
        </Panel>
        <Panel className="wide" title={t("Subject share over time")}>
          <ScrollChart width={Math.max(760, subjectShare.length * 58)}>
            <LineChart data={subjectShare} accessibilityLayer>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={11} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#7890a4" fontSize={11} />
              <Tooltip formatter={(value) => `${Math.round(Number(value))}%`} />
              {top.map((subject) => <Line key={subject.subjectId} dataKey={subject.subjectId} name={subject.name} stroke={subject.color} dot={false} strokeWidth={2}/>) }
            </LineChart>
          </ScrollChart>
        </Panel>
        <Panel title={t("Focus time by Subject")}>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart accessibilityLayer>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78}>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip content={<DurationTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {pie.map((p) => (
                <span key={p.name} title={p.name}>
                  <i style={{ background: p.color }} />
                  <em>{p.name}</em>
                  <strong>{formatDuration(p.value)}</strong>
                </span>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title={t("Session length distribution")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sessionLengthBuckets(sessions)} accessibilityLayer>
              <CartesianGrid stroke="#173044" vertical={false} />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={10} />
              <YAxis stroke="#7890a4" fontSize={11} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" fill={accent.primary} />
            </BarChart>
          </ResponsiveContainer>
          <p className="panel-foot">{t("Median Session")}: {formatDuration(medianSessionSeconds(sessions))}</p>
        </Panel>
        <Panel title={t("Study time by day of week")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekdayTotals(sessions)} accessibilityLayer>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="label" stroke="#7890a4" fontSize={10}/>
              <YAxis tickFormatter={durationTick} stroke="#7890a4" fontSize={11}/>
              <Tooltip content={<DurationTooltip/>}/>
              <Bar dataKey="seconds" name={t("Focus time")} fill={accent.primary}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function SubjectsAnalytics({ sessions, subjects, years }: { sessions: FocusSession[]; subjects: Subject[]; years: AcademicYear[] }) {
  const { t } = useTranslation();
  const rows = subjectTotals(sessions, subjects),
    [selected, setSelected] = useState("");
  const detail = rows.find((r) => r.subjectId === (selected || rows[0]?.subjectId));
  return (
    <div className="analytics-content subjects-layout">
      <Panel title={t("Subjects")} subtitle={t("Each Subject remains distinct within its Academic Year.")}>
        <div className="analytics-table">
          <div className="analytics-table-head">
            <span>{t("Subject")}</span>
            <span>{t("Academic Year")}</span>
            <span>{t("Focus time")}</span>
            <span>{t("Sessions")}</span>
            <span>{t("Average")}</span>
            <span>{t("Active days")}</span>
          </div>
          {rows.map((row) => (
            <button key={row.subjectId} className={detail?.subjectId === row.subjectId ? "selected" : ""} onClick={() => setSelected(row.subjectId)}>
              <span title={row.name}>
                <i style={{ background: row.color }} />
                {row.name}
              </span>
              <span title={years.find((y) => y.id === row.academicYearId)?.name}>{years.find((y) => y.id === row.academicYearId)?.name ?? row.academicYearId}</span>
              <strong>{formatDuration(row.seconds)}</strong>
              <span>{row.sessions}</span>
              <span>{formatDuration(row.averageSessionSeconds)}</span>
              <span>{row.activeDayCount}</span>
            </button>
          ))}
        </div>
      </Panel>
      {detail && (
        <Panel title={detail.name} subtitle={years.find((y) => y.id === detail.academicYearId)?.name}>
          <div className="detail-metrics">
            <span>
              {t("Total focus time")}<strong>{formatDuration(detail.seconds)}</strong>
            </span>
            <span>
              {t("Sessions")}<strong>{detail.sessions}</strong>
            </span>
            <span>
              {t("Average Session")}
              <strong>{formatDuration(detail.averageSessionSeconds)}</strong>
            </span>
            <span>
              {t("Active days")}<strong>{detail.activeDayCount}</strong>
            </span>
          </div>
          <SimpleTrend sessions={sessions.filter((s) => s.subjectId === detail.subjectId)} />
          <ActivityHeatmap sessions={sessions.filter((s) => s.subjectId === detail.subjectId)} />
        </Panel>
      )}
    </div>
  );
}

function YearsAnalytics({ sessions, years, subjects }: { sessions: FocusSession[]; years: AcademicYear[]; subjects: Subject[] }) {
  const { t } = useTranslation();
  const rows = academicYearTotals(sessions, years, subjects),
    [selected, setSelected] = useState("");
  const detail = rows.find((r) => r.academicYearId === (selected || rows[0]?.academicYearId));
  const detailSessions = sessions.filter((s) => s.academicYearId === detail?.academicYearId),
    detailSubjects = subjectTotals(detailSessions, subjects);
  return (
    <div className="analytics-content years-layout">
      <Panel title={t("Academic Years")}>
        {rows.map((row) => (
          <button className={`year-summary ${detail?.academicYearId === row.academicYearId ? "selected" : ""}`} key={row.academicYearId} onClick={() => setSelected(row.academicYearId)}>
            <strong>{row.name}</strong>
            <span>
              {formatDuration(row.seconds)} · {t("{{count}} Sessions", { count: row.sessions })} · {t("{{count}} active days", { count: row.activeDays })}
            </span>
          </button>
        ))}
      </Panel>
      {detail && (
        <Panel title={detail.name} subtitle={t("Activity and Subject detail")}>
          <div className="detail-metrics">
            <span>
              {t("Focus time")}<strong>{formatDuration(detail.seconds)}</strong>
            </span>
            <span>
              {t("Sessions")}<strong>{detail.sessions}</strong>
            </span>
            <span>
              {t("Active days")}<strong>{detail.activeDays}</strong>
            </span>
            <span>
              {t("Average active day")}
              <strong>{formatDuration(detail.averageActiveDaySeconds)}</strong>
            </span>
            <span>
              {t("90th percentile")}<strong>{formatDuration(detail.p90)}</strong>
            </span>
            <span>
              {t("Heatmap interval")}<strong>{formatDuration(detail.step)}</strong>
            </span>
          </div>
          <div className="compact-subjects" aria-label={t("Subject breakdown")}>
            {detailSubjects.slice(0, 6).map((subject) => (
              <span key={subject.subjectId}>
                <i style={{ background: subject.color }} />
                {subject.name}
                <strong>{formatDuration(subject.seconds)}</strong>
              </span>
            ))}
          </div>
          <SimpleTrend sessions={detailSessions} />
          <ActivityHeatmap sessions={detailSessions} explainScale />
        </Panel>
      )}
    </div>
  );
}

function TimeTrends({ sessions, subjects }: { sessions: FocusSession[]; subjects: any[] }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const accent = ACCENT_COLORS[settings.accentColour];
  const [aggregation, setAggregation] = useState<"daily" | "weekly" | "monthly">("monthly"),
    [subjectId, setSubjectId] = useState("");
  const rows = sessions.filter((s) => !subjectId || s.subjectId === subjectId),
    points = aggregation === "daily" ? dailyTotals(rows) : aggregation === "weekly" ? weeklyTotals(rows) : monthlyTotals(rows),
    cumulative = cumulativeTotals(points);
  const start = rows.length ? Math.min(...rows.map((s) => s.startTime)) : Date.now(),
    series = calendarDailySeries(rows, start, Date.now() + 86_400_000),
    avg7 = rollingAverage(series, 7),
    avg30 = rollingAverage(series, 30),
    avg90 = rollingAverage(series, 90),
    avg365 = rollingAverage(series, 365),
    rolling = series.map((p, i) => ({
      ...p,
      avg7: avg7[i].averageSeconds,
      avg30: avg30[i].averageSeconds,
      avg90: avg90[i].averageSeconds,
      avg365: avg365[i].averageSeconds,
    }));
  return (
    <div className="analytics-content">
      <div className="trend-controls">
        <div className="range-control">
          {(["daily", "weekly", "monthly"] as const).map((a) => (
            <button className={aggregation === a ? "active" : ""} onClick={() => setAggregation(a)} key={a}>
              {t(a[0].toUpperCase() + a.slice(1))}
            </button>
          ))}
        </div>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">{t("All Subjects")}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="trend-grid">
        <Panel title={t("Focus trend")}>
          <ScrollChart width={Math.max(760, points.length * 44)}>
            <AreaChart data={points}>
              <CartesianGrid stroke="#173044" />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={10} />
              <YAxis tickFormatter={durationTick} stroke="#7890a4" />
              <Tooltip content={<DurationTooltip />} />
              <Area dataKey="seconds" name={t("Focus time")} stroke={accent.primary} fill={accent.primary} fillOpacity={0.28} />
            </AreaChart>
          </ScrollChart>
        </Panel>
        <Panel title={t("Cumulative Focus Time")}>
          <ScrollChart width={Math.max(760, cumulative.length * 44)}>
            <LineChart data={cumulative}>
              <CartesianGrid stroke="#173044" />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={10} />
              <YAxis tickFormatter={durationTick} stroke="#7890a4" />
              <Tooltip content={<DurationTooltip />} />
              <Line type="monotone" dataKey="cumulativeSeconds" stroke="#a879ff" dot={false} />
            </LineChart>
          </ScrollChart>
        </Panel>
        <Panel title={t("Rolling calendar-day averages")} subtitle={t("Zero-study calendar days are included.")}>
          <ScrollChart width={Math.max(760, rolling.length * 12)}>
            <LineChart data={rolling}>
              <CartesianGrid stroke="#173044" />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={10} />
              <YAxis tickFormatter={durationTick} stroke="#7890a4" />
              <Tooltip content={<DurationTooltip />} />
              <Line dataKey="seconds" name={t("Daily total")} stroke={accent.primary} dot={false} strokeWidth={1} />
              <Line dataKey="avg7" name={t("7-day average")} stroke={accent.tint} dot={false} strokeWidth={2} />
              <Line dataKey="avg30" name={t("30-day average")} stroke="#4da3ff" dot={false} strokeWidth={2} />
              <Line dataKey="avg90" name={t("3-month average")} stroke="#4dd39a" dot={false} strokeWidth={2} />
              <Line dataKey="avg365" name={t("1-year average")} stroke="#a879ff" dot={false} strokeWidth={2} />
            </LineChart>
          </ScrollChart>
        </Panel>
      </div>
    </div>
  );
}

function StudyPatterns({ sessions }: { sessions: FocusSession[] }) {
  const { t } = useTranslation();
  const weekdays = weekdayTotals(sessions),
    matrix = timeOfDayMatrix(sessions),
    max = Math.max(1, ...matrix.flat()),
    labels = ["00-03", "03-06", "06-09", "09-12", "12-15", "15-18", "18-21", "21-24"],
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="analytics-content study-patterns-content">
      <div className="metric-strip metric-strip--five">
        <Metric icon={<CalendarDays />} label={t("Active days")} value={String(activeDayCount(sessions))} />
        <Metric icon={<Layers3 />} label={t("Weeks with Sessions")} value={String(new Set(weeklyTotals(sessions).map((p) => p.key)).size)} />
        <Metric icon={<Clock3 />} label={t("Average active day")} value={formatDuration(averageActiveDaySeconds(sessions))} />
        <Metric icon={<BarChart3 />} label={t("Median Session")} value={formatDuration(medianSessionSeconds(sessions))} />
        <Metric icon={<Flame />} label={t("Longest streak")} value={t("{{count}} days", { count: longestStreak(sessions) })} />
      </div>
      <div className="patterns-grid">
        <Panel title={t("Focus time by weekday")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekdays} accessibilityLayer>
              <CartesianGrid stroke="#173044" vertical={false} />
              <XAxis dataKey="label" stroke="#7890a4" />
              <YAxis tickFormatter={durationTick} stroke="#7890a4" />
              <Tooltip content={<DurationTooltip />} />
              <Bar dataKey="seconds" fill="#4da3ff" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={t("Study time by weekday and time")} subtitle={t("Focused time is distributed across each three-hour period a Session crosses.")}>
          <div className="time-heatmap">
            <div className="time-heatmap-head">
              <span />
              {labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            {matrix.map((row, i) => (
              <div className="time-heatmap-row" key={days[i]}>
                <b>{t(days[i])}</b>
                {row.map((seconds, j) => (
                  <i
                    key={j}
                    tabIndex={0}
                    aria-label={`${t(days[i])} ${labels[j]}, ${formatDuration(seconds)}`}
                    title={`${t(days[i])} ${labels[j]}: ${formatDuration(seconds)}`}
                    style={{
                      opacity: seconds ? Math.max(0.2, seconds / max) : 0.06,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={t("Session length distribution")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sessionLengthBuckets(sessions)} accessibilityLayer>
              <CartesianGrid stroke="#173044" vertical={false} />
              <XAxis dataKey="label" stroke="#7890a4" fontSize={11} />
              <YAxis stroke="#7890a4" />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" fill="#a879ff" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="analytics-metric">
      {icon}
      <span>
        {label}
        <strong>{value}</strong>
      </span>
    </article>
  );
}
function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`analytics-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
function ScrollChart({ width, children }: { width: number; children: React.ReactElement }) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [width]);
  return (
    <div className="scroll-region">
      <div className="chart-scroll" ref={scrollRef}>
        <div style={{ width, height: 270 }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
      <button
        className="latest-button"
        onClick={() =>
          scrollRef.current?.scrollTo({
            left: scrollRef.current.scrollWidth,
            behavior: "smooth",
          })
        }
      >
        {t("Jump to latest")}
      </button>
    </div>
  );
}
function DurationTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload
        .filter((p: any) => Number(p.value) > 0)
        .map((p: any) => (
          <span key={p.name}>
            <i style={{ background: p.color ?? p.payload?.color }} />
            <em>{p.name}</em>
            <b>{formatDuration(Number(p.value))}</b>
          </span>
        ))}
    </div>
  );
}
function CountTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>
        <i style={{ background: payload[0].color }} />
        <em>{t("Sessions")}</em>
        <b>{Number(payload[0].value).toLocaleString()}</b>
      </span>
    </div>
  );
}
function SimpleTrend({ sessions }: { sessions: FocusSession[] }) {
  const { settings } = useSettings();
  const accent = ACCENT_COLORS[settings.accentColour];
  const points = calendarMonthlySeries(sessions);
  return (
    <div className="mini-trend">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={points} accessibilityLayer>
          <CartesianGrid stroke="#173044" />
          <XAxis dataKey="label" stroke="#7890a4" fontSize={10} />
          <YAxis tickFormatter={durationTick} stroke="#7890a4" fontSize={10} />
          <Tooltip content={<DurationTooltip />} />
          <Area dataKey="seconds" stroke={accent.primary} fill={accent.primary} fillOpacity={0.28} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
type HeatmapDay = { key: string; date: Date; seconds: number; count: number };
function ActivityHeatmap({ sessions, explainScale = false }: { sessions: FocusSession[]; explainScale?: boolean }) {
  const { t } = useTranslation();
  const points = dailyTotals(sessions),
    scale = heatmapScale(sessions),
    scrollRef = useRef<HTMLDivElement>(null),
    [selected, setSelected] = useState<HeatmapDay>();
  if (!points.length) return null;
  const start = new Date(points[0].start),
    end = new Date(points.at(-1)!.start);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  const totals = new Map(points.map((point) => [point.key, point])),
    weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = localDayKey(d.getTime()),
      point = totals.get(key);
    week.push({
      key,
      date: new Date(d),
      seconds: point?.seconds ?? 0,
      count: point?.sessionCount ?? 0,
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [weeks.length]);
  const markers = weeks
    .map((days, index) => {
      const date = days[0].date,
        previous = index ? weeks[index - 1][0].date : undefined;
      return !previous || date.getMonth() !== previous.getMonth()
        ? {
            index,
            label:
              date.getMonth() === 0 || !previous
                ? date.toLocaleDateString(localeCode(), {
                    month: "short",
                    year: "numeric",
                  })
                : date.toLocaleDateString(localeCode(), { month: "short" }),
          }
        : undefined;
    })
    .filter(Boolean) as { index: number; label: string }[];
  const selectedSessions = selected ? sessions.filter((session) => localDayKey(session.startTime) === selected.key) : [],
    breakdown = [...selectedSessions.reduce((map, session) => map.set(session.subjectName, (map.get(session.subjectName) ?? 0) + session.focusedDurationSeconds), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <div className="heatmap-shell">
        <div className="weekday-labels">
          <span>{t("Mon")}</span>
          <span>{t("Wed")}</span>
          <span>{t("Fri")}</span>
          <span>{t("Sun")}</span>
        </div>
        <div className="heatmap-scroll" ref={scrollRef}>
          <div className="heatmap-months" style={{ width: weeks.length * 14 }}>
            {markers.map((marker) => (
              <span key={`${marker.index}-${marker.label}`} style={{ left: marker.index * 14 }}>
                {marker.label}
              </span>
            ))}
          </div>
          <div className="heatmap-weeks">
            {weeks.map((days, index) => (
              <div className="heatmap-week" key={index}>
                {days.map((day) => (
                  <button aria-label={`${day.date.toLocaleDateString(localeCode())}, ${formatDuration(day.seconds)}, ${t("{{count}} sessions", { count: day.count })}`} aria-pressed={selected?.key === day.key} title={`${day.date.toLocaleDateString(localeCode(), { weekday: "short", day: "numeric", month: "short", year: "numeric" })}\n${formatDuration(day.seconds)}\n${t("{{count}} Sessions", { count: day.count })}`} onClick={() => setSelected(day)} onFocus={() => setSelected(day)} key={day.key} className={`heat-${heatmapLevel(day.seconds, scale.step)}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <div className="heatmap-detail" role="status">
          <strong>
            {selected.date.toLocaleDateString(localeCode(), {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </strong>
          <span>
            {formatDuration(selected.seconds)} · {selected.count} {selected.count === 1 ? "Session" : "Sessions"}
          </span>
          {breakdown.slice(0, 3).map(([name, seconds]) => (
            <span key={name} title={name}>
              {name}: {formatDuration(seconds)}
            </span>
          ))}
          {breakdown.length > 3 && <span>{t("+{{count}} more", { count: breakdown.length - 3 })}</span>}
        </div>
      )}
      <div className="heatmap-legend">
        <span>
          <i className="heat-0" />
          {t("No study")}
        </span>
        {scale.thresholds.map((threshold, index) => (
          <span key={threshold}>
            <i className={`heat-${index + 1}`} />
            {index < 3 ? `≤ ${formatDuration(threshold)}` : `> ${formatDuration(scale.thresholds[2])}`}
          </span>
        ))}
      </div>
      {explainScale && (
        <p className="panel-foot">
          90th percentile: {formatDuration(scale.p90)} · Four intervals of {formatDuration(scale.step)}
        </p>
      )}
    </>
  );
}
