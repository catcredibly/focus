import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../db";
import type { AcademicYear, FocusSession, Subject } from "../types";

type TimerState = {
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
};

const CHANNEL = "focus-timer";
const STORAGE_KEY = "focus.activeTimer";

const initialState: TimerState = {
  running: false,
  paused: false,
  subject: "Physics",
  subjectColor: "#ff922b",
  subjectId: "",
  academicYearId: "",
  academicYearName: "",
  sessionId: null,
  startedAt: null,
  targetEnd: null,
  remainingSeconds: 75 * 60,
};

function readStored(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(() => readStored());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const completingRef = useRef(false);

  const commit = useCallback((next: TimerState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    channelRef.current?.postMessage(next);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => setState(event.data as TimerState);
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (!state.running || state.paused || !state.targetEnd) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((state.targetEnd! - Date.now()) / 1000));
      setState((current) => ({ ...current, remainingSeconds: remaining }));
      if (remaining <= 0 && !completingRef.current) {
        completingRef.current = true;
        void persistCompleted(state, state.targetEnd!).finally(() => {
          commit({ ...state, running: false, paused: false, targetEnd: null, startedAt: null, sessionId: null, remainingSeconds: 0 });
          completingRef.current = false;
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.running, state.paused, state.targetEnd, state, commit]);

  const start = useCallback((seconds: number, subject: Subject, year: AcademicYear) => {
    const now = Date.now();
    commit({
      ...state,
      subject: subject.name,
      subjectId: subject.id,
      subjectColor: subject.color,
      academicYearId: year.id,
      academicYearName: year.name,
      sessionId: crypto.randomUUID(),
      running: true,
      paused: false,
      startedAt: now,
      targetEnd: now + seconds * 1000,
      remainingSeconds: seconds,
    });
  }, [commit, state]);

  const pause = useCallback(() => {
    if (!state.running) return;
    if (state.paused) {
      commit({
        ...state,
        paused: false,
        targetEnd: Date.now() + state.remainingSeconds * 1000,
      });
    } else {
      commit({ ...state, paused: true, targetEnd: null });
    }
  }, [commit, state]);

  const stop = useCallback(async () => {
    if (state.running) await persistCompleted(state, Date.now());
    commit({ ...state, running: false, paused: false, startedAt: null, targetEnd: null, sessionId: null });
  }, [commit, state]);

  const extend = useCallback((seconds: number) => {
    if (!state.running) return;
    commit({
      ...state,
      remainingSeconds: state.remainingSeconds + seconds,
      targetEnd: state.paused ? null : (state.targetEnd ?? Date.now()) + seconds * 1000,
    });
  }, [commit, state]);

  const display = useMemo(() => {
    const total = Math.max(0, state.remainingSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return { hours, minutes, seconds };
  }, [state.remainingSeconds]);

  return { state, display, start, pause, stop, extend };
}

async function persistCompleted(state: TimerState, endTime: number) {
  if (!state.sessionId || !state.subjectId || !state.startedAt || endTime <= state.startedAt) return;
  const session: FocusSession = {
    id: state.sessionId,
    subjectId: state.subjectId,
    subjectName: state.subject,
    academicYearId: state.academicYearId,
    academicYearName: state.academicYearName,
    startTime: state.startedAt,
    endTime,
    focusedDurationSeconds: Math.max(1, Math.round((endTime - state.startedAt) / 1000)),
    archived: false,
  };
  await db.sessions.put(session);
}
