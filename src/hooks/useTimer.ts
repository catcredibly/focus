import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../db";
import type { AcademicYear, Subject } from "../types";
import { ACTIVE_TIMER_STORAGE_KEY, completedSession, extendTimerState, idleTimerState, initialTimerState, startTimerState, type TimerState } from "../timerState";
import { handleTimerCompletion } from "../timerCompletion";

const CHANNEL = "focus-timer";
function readStored(): TimerState {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
    return raw ? { ...initialTimerState, ...JSON.parse(raw) } : initialTimerState;
  } catch {
    return initialTimerState;
  }
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(() => readStored());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const completingRef = useRef(false);

  const commit = useCallback((next: TimerState) => {
    setState(next);
    localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(next));
    channelRef.current?.postMessage(next);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => setState(event.data as TimerState);
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (!state.running || state.paused || state.finished || !state.targetEnd) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((state.targetEnd! - Date.now()) / 1000));
      setState((current) => ({ ...current, remainingSeconds: remaining }));
      if (remaining <= 0 && !completingRef.current) {
        completingRef.current = true;
        const completed = { ...state, remainingSeconds: 0, targetEnd: null, finished: true, finishedAt: state.targetEnd };
        commit(completed);
        const effects = window.location.hash.includes("popout") ? Promise.resolve() : handleTimerCompletion(completed);
        void effects.finally(() => {
          completingRef.current = false;
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.running, state.paused, state.targetEnd, state, commit]);

  const start = useCallback((seconds: number, subject: Subject, year: AcademicYear) => {
    commit(startTimerState(state, seconds, subject, year));
  }, [commit, state]);

  const pause = useCallback(() => {
    if (!state.running || state.finished) return;
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
    const now = Date.now();
    const snapshot = state.running && !state.paused && state.targetEnd
      ? { ...state, remainingSeconds: Math.max(0, Math.ceil((state.targetEnd - now) / 1000)) }
      : state;
    if (snapshot.running) await persistCompleted(snapshot, snapshot.finishedAt ?? now);
    commit(idleTimerState(snapshot));
  }, [commit, state]);

  const finish = useCallback(async () => {
    if (!state.running || !state.finished) return;
    await persistCompleted(state, state.finishedAt ?? Date.now());
    commit(idleTimerState(state));
  }, [commit, state]);

  const extend = useCallback((seconds: number) => {
    if (!state.running) return;
    commit(extendTimerState(state, seconds));
  }, [commit, state]);

  const setNote = useCallback((note: string) => commit({ ...state, note }), [commit, state]);

  const display = useMemo(() => {
    const total = Math.max(0, state.remainingSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return { hours, minutes, seconds };
  }, [state.remainingSeconds]);

  return { state, display, start, pause, stop, finish, extend, setNote };
}

async function persistCompleted(state: TimerState, endTime: number) {
  const session = completedSession(state, endTime);
  if (session) await db.sessions.put(session);
}
