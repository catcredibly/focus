import { db, type FocusDatabase } from "./db";
import { ACTIVE_TIMER_STORAGE_KEY, LAST_TIMER_DURATION_KEY, type TimerState } from "./timerState";

export type AccentColour = "orange" | "blue" | "green" | "purple";
export type UiScale = "small" | "medium" | "large";
export type TimerDurationMode = "remember" | "fixed";
export type PopoutAutoHide = "500" | "1000" | "2000" | "never";

export type FocusSettings = {
  displayName: string;
  startMaximized: boolean;
  launchAtStartup: boolean;
  timerDurationMode: TimerDurationMode;
  lastTimerDurationSeconds: number;
  fixedTimerDurationSeconds: number;
  completionSound: boolean;
  completionNotification: boolean;
  popoutAlwaysOnTop: boolean;
  popoutRememberPosition: boolean;
  popoutShowSubject: boolean;
  popoutHideControls: boolean;
  popoutAutoHide: PopoutAutoHide;
  popoutAutoOpen: boolean;
  popoutShowInTaskbar: boolean;
  popoutCloseOnCompletion: boolean;
  popoutTransparency: number;
  popoutPositionX: number | null;
  popoutPositionY: number | null;
  accentColour: AccentColour;
  uiScale: UiScale;
  lastBackupAt: string | null;
  allowDirectActiveDeletion: boolean;
};

export const SETTINGS_KEYS: { [K in keyof FocusSettings]: string } = {
  displayName: "displayName",
  startMaximized: "startMaximized",
  launchAtStartup: "launchAtStartup",
  timerDurationMode: "timerDurationMode",
  lastTimerDurationSeconds: LAST_TIMER_DURATION_KEY,
  fixedTimerDurationSeconds: "fixedTimerDurationSeconds",
  completionSound: "completionSound",
  completionNotification: "completionNotification",
  popoutAlwaysOnTop: "popoutAlwaysOnTop",
  popoutRememberPosition: "popoutRememberPosition",
  popoutShowSubject: "popoutShowSubject",
  popoutHideControls: "popoutHideControls",
  popoutAutoHide: "popoutAutoHide",
  popoutAutoOpen: "popoutAutoOpen",
  popoutShowInTaskbar: "popoutShowInTaskbar",
  popoutCloseOnCompletion: "popoutCloseOnCompletion",
  popoutTransparency: "popoutTransparency",
  popoutPositionX: "popoutPositionX",
  popoutPositionY: "popoutPositionY",
  accentColour: "accentColour",
  uiScale: "uiScale",
  lastBackupAt: "lastBackupAt",
  allowDirectActiveDeletion: "allowDirectActiveDeletion",
};

export const DEFAULT_SETTINGS: FocusSettings = {
  displayName: "",
  startMaximized: true,
  launchAtStartup: false,
  timerDurationMode: "remember",
  lastTimerDurationSeconds: 75 * 60,
  fixedTimerDurationSeconds: 75 * 60,
  completionSound: true,
  completionNotification: true,
  popoutAlwaysOnTop: true,
  popoutRememberPosition: true,
  popoutShowSubject: true,
  popoutHideControls: true,
  popoutAutoHide: "1000",
  popoutAutoOpen: false,
  popoutShowInTaskbar: false,
  popoutCloseOnCompletion: false,
  popoutTransparency: 100,
  popoutPositionX: null,
  popoutPositionY: null,
  accentColour: "orange",
  uiScale: "medium",
  lastBackupAt: null,
  allowDirectActiveDeletion: false,
};

const booleans = new Set<keyof FocusSettings>(["startMaximized", "launchAtStartup", "completionSound", "completionNotification", "popoutAlwaysOnTop", "popoutRememberPosition", "popoutShowSubject", "popoutHideControls", "popoutAutoOpen", "popoutShowInTaskbar", "popoutCloseOnCompletion", "allowDirectActiveDeletion"]);
const numbers = new Set<keyof FocusSettings>(["lastTimerDurationSeconds", "fixedTimerDurationSeconds", "popoutTransparency", "popoutPositionX", "popoutPositionY"]);

function decode<K extends keyof FocusSettings>(key: K, raw: string | undefined): FocusSettings[K] {
  if (raw === undefined) return DEFAULT_SETTINGS[key];
  if (booleans.has(key)) return (raw === "true") as FocusSettings[K];
  if (numbers.has(key)) {
    if (raw === "null") return null as FocusSettings[K];
    const value = Number(raw);
    return (Number.isFinite(value) ? value : DEFAULT_SETTINGS[key]) as FocusSettings[K];
  }
  if (key === "lastBackupAt") return (raw || null) as FocusSettings[K];
  const allowed: Partial<Record<keyof FocusSettings, readonly string[]>> = {
    timerDurationMode: ["remember", "fixed"], popoutAutoHide: ["500", "1000", "2000", "never"],
    accentColour: ["orange", "blue", "green", "purple"], uiScale: ["small", "medium", "large"],
  };
  return ((allowed[key] && !allowed[key]?.includes(raw)) ? DEFAULT_SETTINGS[key] : raw) as FocusSettings[K];
}

export async function loadSettings(database: FocusDatabase = db): Promise<FocusSettings> {
  const rows = new Map((await database.settings.toArray()).map((row) => [row.key, row.value]));
  return Object.fromEntries((Object.keys(DEFAULT_SETTINGS) as (keyof FocusSettings)[]).map((key) => [key, decode(key, rows.get(SETTINGS_KEYS[key]))])) as FocusSettings;
}

export async function saveSetting<K extends keyof FocusSettings>(key: K, value: FocusSettings[K], database: FocusDatabase = db) {
  await database.settings.put({ key: SETTINGS_KEYS[key], value: String(value) });
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
