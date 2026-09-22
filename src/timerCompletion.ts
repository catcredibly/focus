import { isTauri, invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { formatDuration } from "./data";
import { loadSettings } from "./settings";
import type { TimerState } from "./timerState";

function playCompletionTone() {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(); oscillator.stop(context.currentTime + 0.46);
  oscillator.addEventListener("ended", () => void context.close());
}

export async function handleTimerCompletion(state: TimerState) {
  const settings = await loadSettings();
  if (settings.completionSound) try { playCompletionTone(); } catch { /* Audio may be unavailable before user interaction. */ }
  if (settings.completionNotification && isTauri()) {
    try {
      let granted = await isPermissionGranted();
      if (!granted) granted = await requestPermission() === "granted";
      if (granted) sendNotification({ title: "Focus session complete", body: `${state.subject} - ${formatDuration(state.plannedDurationSeconds)}` });
    } catch { /* Notification denial must not interrupt Session persistence. */ }
  }
  if (settings.popoutCloseOnCompletion && isTauri()) await invoke("hide_timer_popout").catch(() => undefined);
}
