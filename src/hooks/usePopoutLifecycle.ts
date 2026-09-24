import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { ACTIVE_TIMER_STORAGE_KEY } from "../timerState";
import { activePopoutSession, synchronizePopoutSession, TIMER_STATE_CHANGED } from "../popoutLifecycle";

/** Lives in the main shell, so navigation and Timer-page unmounts cannot suspend lifecycle reconciliation. */
export function usePopoutLifecycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isTauri()) return;
    let deadlineTimer = 0;
    let disposed = false;
    let previous: string | undefined;
    const reconcile = () => {
      if (disposed) return;
      window.clearTimeout(deadlineTimer);
      const session = activePopoutSession();
      const signature = JSON.stringify(session);
      if (signature !== previous) {
        previous = signature;
        void navigator.locks.request("focus.popout.geometry", () => synchronizePopoutSession()).catch(console.error);
      }
      if (session?.deadline) deadlineTimer = window.setTimeout(reconcile, Math.min(2_147_483_647, Math.max(1, session.deadline - Date.now())));
    };
    const storage = (event: StorageEvent) => { if (event.key === ACTIVE_TIMER_STORAGE_KEY || event.key === null) reconcile(); };
    const channel = new BroadcastChannel("focus-timer");
    channel.onmessage = reconcile;
    window.addEventListener(TIMER_STATE_CHANGED, reconcile);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", reconcile);
    reconcile();
    return () => {
      disposed = true; window.clearTimeout(deadlineTimer); channel.close();
      window.removeEventListener(TIMER_STATE_CHANGED, reconcile);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
    };
  }, [enabled]);
}
