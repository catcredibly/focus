import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimerState = {
  running: boolean;
  paused: boolean;
  subject: string;
  subjectColor: string;
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
      if (remaining <= 0) {
        commit({ ...state, running: false, paused: false, targetEnd: null, remainingSeconds: 0 });
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.running, state.paused, state.targetEnd, state, commit]);

  const start = useCallback((seconds: number, subject = state.subject) => {
    const now = Date.now();
    commit({
      ...state,
      subject,
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

  const stop = useCallback(() => {
    commit({ ...state, running: false, paused: false, startedAt: null, targetEnd: null });
  }, [commit, state]);

  const extend = useCallback((seconds: number) => {
    if (!state.running) return;
    commit({
      ...state,
      remainingSeconds: state.remainingSeconds + seconds,
      targetEnd: state.paused ? null : (state.targetEnd ?? Date.now()) + seconds * 1000,
    });
  }, [commit, state]);

  const setSubject = useCallback((subject: string) => commit({ ...state, subject }), [commit, state]);

  const display = useMemo(() => {
    const total = Math.max(0, state.remainingSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return { hours, minutes, seconds };
  }, [state.remainingSeconds]);

  return { state, display, start, pause, stop, extend, setSubject };
}
