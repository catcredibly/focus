import { db, type FocusDatabase } from "./db";
import { ACTIVE_TIMER_STORAGE_KEY, LAST_TIMER_DURATION_KEY, type TimerState } from "./timerState";

export type AccentColour = "coral" | "orange" | "pink" | "miku" | "cappuccino";
export type Theme = "dark" | "light";
export type UiScale = "small" | "medium" | "large" | "extra-large";
export type SubjectPickerMode = "remember" | "fixed";
export type PopoutSize = "small" | "medium" | "large";
export type TimerDurationMode = "remember" | "fixed";
export type PopoutAutoHide = "500" | "1000" | "2000" | "never";
export type Locale = "en" | "zh-CN" | "zh-TW" | "ja";
export type DockCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type DockEdge = "top" | "right" | "bottom" | "left";
export type DockMonitor = "current" | `display:${number}`;
export type CompletionSound = "soft-chime" | "bell" | "digital" | "gentle" | "bright";
export type DateFormat = "full" | "standard" | "compact" | "numeric";
export type ClockFormat = "system" | "12-hour" | "24-hour";

export type FocusSettings = {
  displayName: string;
  sidebarSubtitle: string;
  language: Locale;
  theme: Theme;
  startMaximized: boolean;
  launchAtStartup: boolean;
  timerDurationMode: TimerDurationMode;
  lastTimerDurationSeconds: number;
  fixedTimerDurationSeconds: number;
  subjectPickerMode: SubjectPickerMode;
  defaultSubjectId: string;
  lastSubjectId: string;
  showDate: boolean;
  dateFormat: DateFormat;
  showWeekday: boolean;
  showClock: boolean;
  clockFormat: ClockFormat;
  dailyGoalEnabled: boolean;
  dailyGoalSeconds: number;
  weeklyGoalEnabled: boolean;
  weeklyGoalSeconds: number;
  completionSound: boolean;
  completionSoundChoice: CompletionSound;
  completionSoundVolume: number;
  completionNotification: boolean;
  popoutAlwaysOnTop: boolean;
  popoutRememberPosition: boolean;
  popoutShowSubject: boolean;
  popoutShowClock: boolean;
  popoutSize: PopoutSize;
  popoutHideControls: boolean;
  popoutAutoHide: PopoutAutoHide;
  popoutAutoOpen: boolean;
  popoutShowInTaskbar: boolean;
  popoutCloseOnCompletion: boolean;
  popoutTransparency: number;
  popoutPositionX: number | null;
  popoutPositionY: number | null;
  popoutDockingEnabled: boolean;
  popoutDockCorner: DockCorner;
  popoutDockMonitor: DockMonitor;
  popoutDocked: boolean;
  popoutDockAutoHide: boolean;
  popoutAutoHideEdge: DockEdge;
  popoutAutoHideOffset: number;
  accentColour: AccentColour;
  uiScale: UiScale;
  lastBackupAt: string | null;
  allowDirectActiveDeletion: boolean;
};

export const SETTINGS_KEYS: { [K in keyof FocusSettings]: string } = {
  displayName: "displayName",
  sidebarSubtitle: "sidebarSubtitle",
  language: "language",
  theme: "theme",
  startMaximized: "startMaximized",
  launchAtStartup: "launchAtStartup",
  timerDurationMode: "timerDurationMode",
  lastTimerDurationSeconds: LAST_TIMER_DURATION_KEY,
  fixedTimerDurationSeconds: "fixedTimerDurationSeconds",
  subjectPickerMode: "subjectPickerMode",
  defaultSubjectId: "defaultSubjectId",
  lastSubjectId: "lastSubjectId",
  showDate: "showDate",
  dateFormat: "dateFormat",
  showWeekday: "showWeekday",
  showClock: "showClock",
  clockFormat: "clockFormat",
  dailyGoalEnabled: "dailyGoalEnabled",
  dailyGoalSeconds: "dailyGoalSeconds",
  weeklyGoalEnabled: "weeklyGoalEnabled",
  weeklyGoalSeconds: "weeklyGoalSeconds",
  completionSound: "completionSound",
  completionSoundChoice: "completionSoundChoice",
  completionSoundVolume: "completionSoundVolume",
  completionNotification: "completionNotification",
  popoutAlwaysOnTop: "popoutAlwaysOnTop",
  popoutRememberPosition: "popoutRememberPosition",
  popoutShowSubject: "popoutShowSubject",
  popoutShowClock: "popoutShowClock",
  popoutSize: "popoutSize",
  popoutHideControls: "popoutHideControls",
  popoutAutoHide: "popoutAutoHide",
  popoutAutoOpen: "popoutAutoOpen",
  popoutShowInTaskbar: "popoutShowInTaskbar",
  popoutCloseOnCompletion: "popoutCloseOnCompletion",
  popoutTransparency: "popoutTransparency",
  popoutPositionX: "popoutPositionX",
  popoutPositionY: "popoutPositionY",
  popoutDockingEnabled: "popoutDockingEnabled",
  popoutDockCorner: "popoutDockCorner",
  popoutDockMonitor: "popoutDockMonitor",
  popoutDocked: "popoutDocked",
  popoutDockAutoHide: "popoutDockAutoHide",
  popoutAutoHideEdge: "popoutAutoHideEdge",
  popoutAutoHideOffset: "popoutAutoHideOffset",
  accentColour: "accentColour",
  uiScale: "uiScale",
  lastBackupAt: "lastBackupAt",
  allowDirectActiveDeletion: "allowDirectActiveDeletion",
};

export const DEFAULT_SETTINGS: FocusSettings = {
  displayName: "",
  sidebarSubtitle: "",
  language: "en",
  theme: "dark",
  startMaximized: true,
  launchAtStartup: false,
  timerDurationMode: "remember",
  lastTimerDurationSeconds: 75 * 60,
  fixedTimerDurationSeconds: 75 * 60,
  subjectPickerMode: "remember",
  defaultSubjectId: "",
  lastSubjectId: "",
  showDate: true,
  dateFormat: "standard",
  showWeekday: true,
  showClock: true,
  clockFormat: "system",
  dailyGoalEnabled: false,
  dailyGoalSeconds: 2 * 60 * 60,
  weeklyGoalEnabled: false,
  weeklyGoalSeconds: 12 * 60 * 60,
  completionSound: true,
  completionSoundChoice: "soft-chime",
  completionSoundVolume: 65,
  completionNotification: true,
  popoutAlwaysOnTop: true,
  popoutRememberPosition: true,
  popoutShowSubject: true,
  popoutShowClock: true,
  popoutSize: "medium",
  popoutHideControls: true,
  popoutAutoHide: "1000",
  popoutAutoOpen: false,
  popoutShowInTaskbar: false,
  popoutCloseOnCompletion: false,
  popoutTransparency: 100,
  popoutPositionX: null,
  popoutPositionY: null,
  popoutDockingEnabled: false,
  popoutDockCorner: "top-right",
  popoutDockMonitor: "current",
  popoutDocked: false,
  popoutDockAutoHide: false,
  popoutAutoHideEdge: "right",
  popoutAutoHideOffset: 0,
  accentColour: "coral",
  uiScale: "medium",
  lastBackupAt: null,
  allowDirectActiveDeletion: false,
};

const booleans = new Set<keyof FocusSettings>(["startMaximized", "launchAtStartup", "showDate", "showWeekday", "showClock", "dailyGoalEnabled", "weeklyGoalEnabled", "completionSound", "completionNotification", "popoutAlwaysOnTop", "popoutRememberPosition", "popoutShowSubject", "popoutShowClock", "popoutHideControls", "popoutAutoOpen", "popoutShowInTaskbar", "popoutCloseOnCompletion", "popoutDockingEnabled", "popoutDocked", "popoutDockAutoHide", "allowDirectActiveDeletion"]);
const numbers = new Set<keyof FocusSettings>(["lastTimerDurationSeconds", "fixedTimerDurationSeconds", "dailyGoalSeconds", "weeklyGoalSeconds", "completionSoundVolume", "popoutTransparency", "popoutPositionX", "popoutPositionY", "popoutAutoHideOffset"]);

function decode<K extends keyof FocusSettings>(key: K, raw: string | undefined): FocusSettings[K] {
  if (raw === undefined) return DEFAULT_SETTINGS[key];
  if (booleans.has(key)) return (raw === "true") as FocusSettings[K];
  if (numbers.has(key)) {
    if (raw === "null") return null as FocusSettings[K];
    let value = Number(raw);
    if (!Number.isFinite(value)) return DEFAULT_SETTINGS[key];
    if (key === "popoutTransparency") value = Math.min(100, Math.max(10, value));
    if (key === "completionSoundVolume") value = Math.min(100, Math.max(0, value));
    if (key === "popoutAutoHideOffset") value = Math.min(1, Math.max(0, value));
    if (["lastTimerDurationSeconds", "fixedTimerDurationSeconds", "dailyGoalSeconds", "weeklyGoalSeconds"].includes(key)) value = Math.max(0, Math.floor(value));
    return value as FocusSettings[K];
  }
  if (key === "lastBackupAt") return (raw || null) as FocusSettings[K];
  const allowed: Partial<Record<keyof FocusSettings, readonly string[]>> = {
    language: ["en", "zh-CN", "zh-TW", "ja"], theme: ["dark", "light"], timerDurationMode: ["remember", "fixed"], subjectPickerMode: ["remember", "fixed"], dateFormat: ["full", "standard", "compact", "numeric"], clockFormat: ["system", "12-hour", "24-hour"],
    completionSoundChoice: ["soft-chime", "bell", "digital", "gentle", "bright"], popoutAutoHide: ["500", "1000", "2000", "never"],
    popoutDockCorner: ["top-left", "top-right", "bottom-left", "bottom-right"], popoutAutoHideEdge: ["top", "right", "bottom", "left"],
    popoutSize: ["small", "medium", "large"], accentColour: ["coral", "orange", "pink", "miku", "cappuccino"], uiScale: ["small", "medium", "large", "extra-large"],
  };
  if (key === "popoutDockMonitor") return (/^(current|display:\d+)$/.test(raw) ? raw : DEFAULT_SETTINGS[key]) as FocusSettings[K];
  return ((allowed[key] && !allowed[key]?.includes(raw)) ? DEFAULT_SETTINGS[key] : raw) as FocusSettings[K];
}

export async function loadSettings(database: FocusDatabase = db): Promise<FocusSettings> {
  const rows = new Map((await database.settings.toArray()).map((row) => [row.key, row.value]));
  return Object.fromEntries((Object.keys(DEFAULT_SETTINGS) as (keyof FocusSettings)[]).map((key) => [key, decode(key, rows.get(SETTINGS_KEYS[key]))])) as FocusSettings;
}

export async function saveSetting<K extends keyof FocusSettings>(key: K, value: FocusSettings[K], database: FocusDatabase = db) {
  await database.settings.put({ key: SETTINGS_KEYS[key], value: String(value) });
}

export async function restoreSettingDefaults(keys: (keyof FocusSettings)[], database: FocusDatabase = db) {
  await database.transaction("rw", database.settings, async () => {
    await database.settings.bulkDelete(keys.map((key) => SETTINGS_KEYS[key]));
  });
}

export function greeting(name: string, hour = new Date().getHours()) {
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const trimmed = name.trim();
  return `Good ${part}${trimmed ? `, ${trimmed}` : ""}`;
}

export function normaliseDuration(hours: number, minutes: number, seconds: number) {
  const total = Math.max(0, Math.floor(hours || 0) * 3600 + Math.floor(minutes || 0) * 60 + Math.floor(seconds || 0));
  return { total, hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

export function timerDefaultDuration(settings: FocusSettings) {
  return settings.timerDurationMode === "fixed" ? settings.fixedTimerDurationSeconds : settings.lastTimerDurationSeconds;
}

export function hasActiveTimer(storage: Pick<Storage, "getItem"> = localStorage) {
  try {
    const timer = JSON.parse(storage.getItem(ACTIVE_TIMER_STORAGE_KEY) ?? "null") as Partial<TimerState> | null;
    return Boolean(timer?.running || timer?.paused || (timer?.sessionId && timer?.startedAt));
  } catch { return false; }
}

export async function clearAllFocusData(database: FocusDatabase = db, storage: Pick<Storage, "getItem" | "removeItem"> = localStorage) {
  if (hasActiveTimer(storage)) throw new Error("Finish or stop the current timer before clearing app data.");
  await database.transaction("rw", database.sessions, database.subjects, database.academicYears, database.settings, async () => {
    await Promise.all([database.sessions.clear(), database.subjects.clear(), database.academicYears.clear(), database.settings.clear()]);
  });
  storage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
}

export function formatLastBackup(value: string | null, locale?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
