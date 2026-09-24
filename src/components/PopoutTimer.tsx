import { closeTimerPopout, POPOUT_CLOSED } from "../popoutLifecycle";
import { Check, MoreHorizontal, Pause, Pin, Play, Plus, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { nearestDockCorner } from "../popoutPlacement";
import { hideTimerAutomatically, revealTimerAutomatically, toggleTimerAutoHide, syncPopoutLayout, setPopoutDocked, timerGeometry, rememberFloatingPosition, resetPopoutTransientState } from "../native";
import { TimerExtendMenu } from "./TimerExtendMenu";
import { formatTimerClock } from "../dateTime";

function parts(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

export function PopoutTimer() {
  const timer = useTimer();
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();
  const [menu, setMenu] = useState<"extend" | null>(null);
  const [stopping, setStopping] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [menuWindowOpen, setMenuWindowOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [nativeError, setNativeError] = useState(false);
  const draggingRef = useRef(false);
  const hideTimerRef = useRef(0);
  const lastSize = useRef(`${settings.popoutLayout}:${settings.popoutSize}`);
  const compact = settings.popoutLayout === "compact";
  const openMenu = (view: string) => { clearHideTimer(); setMenuWindowOpen(true); void invoke("open_timer_menu", { view }).catch(() => setMenuWindowOpen(false)); };
  const dockedActive = settings.popoutDockingEnabled && settings.popoutDocked;
  const clearHideTimer = useCallback(() => window.clearTimeout(hideTimerRef.current), []);
  const report = (operation: Promise<unknown>) => operation.catch(() => setNativeError(true));
  const reveal = useCallback(async () => {
    if (draggingRef.current) return;
    clearHideTimer();
    await revealTimerAutomatically();
  }, [clearHideTimer]);
  const hide = useCallback(async () => {
    if (draggingRef.current || menu || menuWindowOpen || stopping || voiding) return;
    await hideTimerAutomatically();
  }, [menu, menuWindowOpen, stopping, voiding]);
  const scheduleHide = () => {
    clearHideTimer();
    if (settings.popoutDockAutoHide && !menu && !menuWindowOpen && !stopping && !voiding && !draggingRef.current) {
      hideTimerRef.current = window.setTimeout(() => void report(hide()), settings.popoutAutoHideDelaySeconds * 1000);
    }
  };
  const settleDrag = async () => {
    const geometry = await timerGeometry();
    await rememberFloatingPosition();
    const corner = settings.popoutDockingEnabled ? nearestDockCorner(geometry, geometry.workArea, geometry, 52 * geometry.scale) : null;
    if (corner) await setPopoutDocked(true, corner);
  };
  const startDrag = (event: ReactPointerEvent) => {
    if (!isTauri() || dockedActive || event.button !== 0 || (event.target as HTMLElement).closest("[data-no-drag]")) return;
    event.preventDefault(); clearHideTimer(); setMenu(null); draggingRef.current = true;
    void report(getCurrentWindow().startDragging().finally(() => { draggingRef.current = false; void report(settleDrag()); }));
  };
  const toggleDock = async () => {
    clearHideTimer();
    if (!dockedActive && !settings.popoutDockingEnabled) {
      setMenuWindowOpen(true); await invoke("open_timer_menu", { view: "dock" }).catch(() => setMenuWindowOpen(false));
    } else await setPopoutDocked(!dockedActive);
  };
  useEffect(() => {
    if (!loaded || !isTauri()) return;
    const resize = lastSize.current !== `${settings.popoutLayout}:${settings.popoutSize}`;
    lastSize.current = `${settings.popoutLayout}:${settings.popoutSize}`;
    void report(syncPopoutLayout(resize));
  }, [loaded, settings.popoutLayout, settings.popoutSize, settings.popoutDocked, settings.popoutDockingEnabled, settings.popoutDockCorner, settings.popoutDockMonitor, settings.popoutDockAutoHide, settings.popoutAlwaysOnTop, settings.popoutShowInTaskbar]);
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 10_000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    if (!isTauri()) return;
    const subscriptions = [
      getCurrentWindow().onFocusChanged(({ payload }) => { if (payload) { setMenu(null); setStopping(false); } }),
      getCurrentWindow().listen("focus://reveal-auto-hide", () => void report(reveal())),
      getCurrentWindow().listen("focus://toggle-auto-hide", () => { clearHideTimer(); if (!draggingRef.current && !menu && !menuWindowOpen && !stopping && !voiding) void report(toggleTimerAutoHide()); }),
      getCurrentWindow().listen("focus://popout-menu-closed", () => setMenuWindowOpen(false)),
    ];
    return () => { for (const subscription of subscriptions) void subscription.then(stop => stop()); };
  }, [reveal, clearHideTimer, menu, menuWindowOpen, stopping, voiding]);
  useEffect(() => {
    const closed = () => { clearHideTimer(); resetPopoutTransientState(); setMenu(null); setMenuWindowOpen(false); setStopping(false); setVoiding(false); draggingRef.current = false; };
    window.addEventListener(POPOUT_CLOSED, closed);
    const subscription = isTauri() ? getCurrentWindow().listen("focus://popout-closed", closed) : undefined;
    return () => { window.removeEventListener(POPOUT_CLOSED, closed); void subscription?.then(stop => stop()); };
  }, [clearHideTimer]);
  useEffect(() => {
    const pointerDown = (event: PointerEvent) => { if (menu && !(event.target as HTMLElement).closest("[data-popout-overlay], [data-popout-menu-button]")) setMenu(null); };
    const keyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", pointerDown); window.addEventListener("keydown", keyDown);
    return () => { document.removeEventListener("pointerdown", pointerDown); window.removeEventListener("keydown", keyDown); clearHideTimer(); };
  }, [menu, clearHideTimer]);

  const controlsDelay = settings.popoutAutoHide === "never" ? "2147483647ms" : `${settings.popoutAutoHide}ms`;
  const time = parts(timer.state.remainingSeconds);
  return <main className={`popout-root ${settings.popoutHideControls ? "popout-root--hover-controls" : ""}`} data-accent={settings.accentColour} data-theme={settings.theme} data-scale={settings.uiScale} data-edge={settings.popoutAutoHideEdge} data-layout={settings.popoutLayout} data-size={settings.popoutSize} style={{ "--controls-hide-delay": controlsDelay, "--popout-surface-alpha": settings.popoutTransparency / 100 } as CSSProperties} onPointerDown={startDrag} onMouseEnter={clearHideTimer} onMouseLeave={scheduleHide}>
    {!dockedActive && <div className="popout-drag-edge" aria-hidden="true"/>}
    <div className="popout-content">
      {nativeError && <button data-no-drag className="field-error" onClick={() => setNativeError(false)}>{t("Unable to update the popout window. Try again.")}</button>}
      {(settings.popoutShowSubject || settings.popoutShowClock) && <div className="popout-subject-row">{settings.popoutShowSubject && <div className="popout-subject subject-overflow" tabIndex={0} title={timer.state.subject || t("No Subject")}><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject || t("No Subject")}</div>}{settings.popoutShowClock && <time>{formatTimerClock(now, settings.language, settings.clockFormat)}</time>}</div>}
      <div className="popout-time"><span>{time[0]}</span><b>:</b><span>{time[1]}</span><b>:</b><span>{time[2]}</span></div>
      <div className="popout-labels"><span>{t("Hours")}</span><span>{t("Minutes")}</span><span>{t("Seconds")}</span></div>
      <div className="popout-status">{timer.state.finished ? t("Finished") : timer.state.paused ? t("Paused") : ""}</div>
      <div className="popout-actions">
      <button data-no-drag className="popout-close tooltip-button" aria-label={t("Close popout")} data-tooltip={t("Close popout")} onClick={() => { clearHideTimer(); void report(closeTimerPopout()); }}><X/></button>
      <button data-no-drag className="popout-pin tooltip-button" aria-label={t(dockedActive ? "Undock" : "Dock")} data-tooltip={t(dockedActive ? "Undock" : "Dock")} onClick={() => void report(toggleDock())}><Pin fill={dockedActive ? "currentColor" : "none"}/></button>
      <div className="popout-controls" data-no-drag>
        <button className="tooltip-button" aria-label={timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")} data-tooltip={timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")} onClick={timer.state.finished ? timer.finish : timer.pause}>{timer.state.finished ? <Check/> : timer.state.paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}</button>
        <button className="tooltip-button" aria-label={t("Extend")} data-tooltip={t("Extend")} onClick={() => compact ? openMenu("extend") : setMenu((value) => value === "extend" ? null : "extend")}><Plus size={18}/></button>
        <button className="tooltip-button" aria-label={t("Stop")} data-tooltip={t("Stop")} onClick={() => compact ? openMenu("stop") : setStopping(true)}><Square size={15} fill="currentColor"/></button>
        <button className="tooltip-button" aria-label={t("More")} data-tooltip={t("More")} data-popout-menu-button onClick={() => { clearHideTimer(); setMenuWindowOpen(true); void invoke("open_timer_menu", { view: "more" }).catch(() => setMenuWindowOpen(false)); }}><MoreHorizontal size={18}/></button>
      </div>
      </div>
      {menu === "extend" && <div data-no-drag data-popout-overlay><TimerExtendMenu compact onClose={() => setMenu(null)} onExtend={(seconds) => { timer.extend(seconds); setMenu(null); }}/></div>}
      {stopping && <div data-no-drag data-popout-overlay className="popout-menu popout-stop-confirm"><strong>{t("Stop timer?")}</strong><span>{t("Elapsed focus time will be saved.")}</span><button className="secondary-action" onClick={() => setStopping(false)}>{t("Cancel")}</button><button className="danger-outline" onClick={() => { setStopping(false); setVoiding(true); }}>{t("Void Session")}</button><button className="primary-action" onClick={async () => { setStopping(false); await timer.stop(); }}>{t("Stop and save")}</button></div>}
      {voiding && <div data-no-drag data-popout-overlay className="popout-menu popout-stop-confirm"><strong>{t("Void this Session?")}</strong><span>{t("The recorded study time will be discarded.")}</span><button className="secondary-action" onClick={() => setVoiding(false)}>{t("Cancel")}</button><button className="danger-action" onClick={() => { timer.discard(); setVoiding(false); }}>{t("Void Session")}</button></div>}
    </div>
  </main>;
}
