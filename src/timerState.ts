import type { AcademicYear, FocusSession, Subject } from "./types";

export const ACTIVE_TIMER_STORAGE_KEY = "focus.activeTimer";
export const LAST_TIMER_DURATION_KEY = "lastTimerDurationSeconds";

export type TimerState = {
  running: boolean;
  paused: boolean;
  subject: string;
  subjectColor: string;
  subjectId: string;
  academicYearId: string;
  academicYearName: string;
  sessionId: string | null;
  startedAt: number | null;
  targetEnd: number | null;
  remainingSeconds: number;
  plannedDurationSeconds: number;
  note: string;
  finished?: boolean;
  finishedAt?: number | null;
};

export const initialTimerState: TimerState = {
  running: false,
  paused: false,
  subject: "",
  subjectColor: "#ff922b",
  subjectId: "",
  academicYearId: "",
  academicYearName: "",
  sessionId: null,
  startedAt: null,
  targetEnd: null,
  remainingSeconds: 75 * 60,
  plannedDurationSeconds: 75 * 60,
  note: "",
  finished: false,
  finishedAt: null,
};

export function startTimerState(state: TimerState, seconds: number, subject: Subject, year: AcademicYear, now = Date.now(), sessionId: string = crypto.randomUUID()): TimerState {
  return { ...state, subject: subject.name, subjectId: subject.id, subjectColor: subject.color, academicYearId: year.id, academicYearName: year.name, sessionId, running: true, paused: false, finished: false, finishedAt: null, startedAt: now, targetEnd: now + seconds * 1000, remainingSeconds: seconds, plannedDurationSeconds: seconds };
}

export function extendTimerState(state: TimerState, seconds: number, now = Date.now()): TimerState {
  if (!state.running) return state;
  if (seconds <= 0) return state;
  return { ...state, paused: state.finished ? false : state.paused, finished: false, finishedAt: null, remainingSeconds: state.remainingSeconds + seconds, plannedDurationSeconds: state.plannedDurationSeconds + seconds, targetEnd: state.paused && !state.finished ? null : (state.targetEnd ?? now) + seconds * 1000 };
}

export function completedSession(state: TimerState, endTime: number): FocusSession | undefined {
  if (!state.sessionId || !state.subjectId || !state.startedAt || endTime <= state.startedAt) return;
  const focusedDurationSeconds = Math.max(1, state.plannedDurationSeconds - state.remainingSeconds);
  return { id: state.sessionId, subjectId: state.subjectId, subjectName: state.subject, academicYearId: state.academicYearId, academicYearName: state.academicYearName, startTime: state.startedAt, endTime, focusedDurationSeconds, note: state.note.trim() || undefined, archived: false };
}

export function idleTimerState(state: TimerState): TimerState {
  return { ...state, running: false, paused: false, finished: false, finishedAt: null, startedAt: null, targetEnd: null, sessionId: null, remainingSeconds: state.plannedDurationSeconds, note: "" };
}

export function localDateInputValue(stamp: number) {
  const date = new Date(stamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todaySummary(sessions: FocusSession[], now = Date.now()) {
  const date = new Date(now);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  const today = sessions.filter((session) => !session.archived && session.startTime >= start && session.startTime < end);
  return { sessions: today, focusedDurationSeconds: today.reduce((sum, session) => sum + session.focusedDurationSeconds, 0) };
}

export function currentStreak(sessions: FocusSession[], now = Date.now()) {
  const activeDays = new Set(sessions.filter((session) => !session.archived).map((session) => localDateInputValue(session.startTime)));
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!activeDays.has(localDateInputValue(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(localDateInputValue(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
