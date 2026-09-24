import { invoke, isTauri } from "@tauri-apps/api/core";
import { ACTIVE_TIMER_STORAGE_KEY, type TimerState } from "./timerState";

export const TIMER_STATE_CHANGED = "focus:timer-state-changed";
export const POPOUT_CLOSED = "focus:popout-closed";

/** Finished-but-not-yet-saved timers are recoverable data, not active popouts. */
export function activePopoutSession() {
  try {
    const timer = JSON.parse(localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY) ?? "null") as TimerState | null;
    if (!timer?.running || !timer.sessionId || timer.finished || timer.saveFailed) return null;
    if (timer.paused) return { sessionId: timer.sessionId, deadline: null };
    if (typeof timer.targetEnd === "number" && Number.isFinite(timer.targetEnd) && timer.targetEnd > Date.now()) return { sessionId: timer.sessionId, deadline: Math.floor(timer.targetEnd) };
  } catch { /* Invalid recovery state must never create an empty window. */ }
  return null;
}

/** Call inside the shared geometry lock; always read current storage, not a React snapshot. */
export async function synchronizePopoutSession() {
  const session = activePopoutSession();
  await invoke("sync_popout_session", { sessionId: session?.sessionId ?? null, deadline: session?.deadline ?? null });
  return session;
}

export async function closeTimerPopout() {
  window.dispatchEvent(new Event(POPOUT_CLOSED));
  // Do not queue Close behind geometry work. Native generation invalidation
  // prevents the work already in progress from showing the windows afterward.
  if (isTauri()) await invoke("hide_timer_popout");
}
