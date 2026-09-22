import { Check, MoreHorizontal, Pause, Play, Plus, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { cornerPosition, defaultEdgeForCorner, nearestDockCorner, type Point, type Size, type WorkArea } from "../popoutPlacement";
import type { DockCorner } from "../settings";
import { TimerExtendMenu } from "./TimerExtendMenu";
import { formatTimerClock } from "../dateTime";

function parts(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

const cornerOffset = (corner: DockCorner) => corner.startsWith("top") ? 0 : 1;

export function PopoutTimer() {
  const timer = useTimer();
  const { t } = useTranslation();
  const { settings, loaded, setSetting } = useSettings();
  const [menu, setMenu] = useState<"extend" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [menuWindowOpen, setMenuWindowOpen] = useState(false);
  const [displays, setDisplays] = useState<{ id: string; label: string }[]>([]);
  const [now, setNow] = useState(() => new Date());
  const draggingRef = useRef(false);
  const programmaticUntilRef = useRef(0);
  const undockingRef = useRef(false);
  const wasDockedRef = useRef(false);
  const hideTimerRef = useRef(0);
  const dockedActive = settings.popoutDockingEnabled && settings.popoutDocked;
  const selectedMonitorAvailable = settings.popoutDockMonitor === "current" || displays.some((display) => display.id === settings.popoutDockMonitor);
  const autoHideActive = dockedActive && settings.popoutDockAutoHide && selectedMonitorAvailable;

  const geometry = useCallback(async () => {
    const window = getCurrentWindow();
    const [workArea, size] = await Promise.all([invoke<WorkArea>("get_timer_work_area", { monitorId: selectedMonitorAvailable ? settings.popoutDockMonitor : "current" }), window.outerSize()]);
    return { workArea, size: { width: size.width, height: size.height } as Size };
  }, [selectedMonitorAvailable, settings.popoutDockMonitor]);

  const move = useCallback(async (position: Point, unchecked = false) => {
    programmaticUntilRef.current = Date.now() + 500;
    await invoke(unchecked ? "set_timer_position_unchecked" : "set_timer_position", { x: Math.round(position.x), y: Math.round(position.y) });
  }, []);

  const placeDocked = useCallback(async () => {
    if (!isTauri() || undockingRef.current) return;
    const { workArea, size } = await geometry();
    await move(cornerPosition(workArea, size, settings.popoutDockCorner));
  }, [geometry, move, settings.popoutDockCorner]);

  const clearHideTimer = () => window.clearTimeout(hideTimerRef.current);
  const reveal = useCallback(async () => {
    if (!autoHideActive || draggingRef.current) return;
    clearHideTimer(); await placeDocked(); await invoke("cancel_timer_auto_hide"); setRevealed(true);
  }, [autoHideActive, placeDocked]);
  const hide = useCallback(async () => {
    if (!autoHideActive || draggingRef.current || menu !== null || menuWindowOpen) return;
    setRevealed(false);
    await invoke("show_timer_auto_hide_tab", { monitorId: settings.popoutDockMonitor, edge: settings.popoutAutoHideEdge, offset: settings.popoutAutoHideOffset });
  }, [autoHideActive, menu, menuWindowOpen, settings.popoutAutoHideEdge, settings.popoutAutoHideOffset, settings.popoutDockMonitor]);
  const scheduleHide = () => {
    clearHideTimer();
    if (autoHideActive && revealed && menu === null && !menuWindowOpen && !draggingRef.current) hideTimerRef.current = window.setTimeout(() => void hide(), 400);
  };

  const settleDrag = async () => {
    if (!isTauri()) return;
    const window = getCurrentWindow();
    const [position, { workArea, size }] = await Promise.all([window.outerPosition(), geometry()]);
    const corner = settings.popoutDockingEnabled ? nearestDockCorner(position, workArea, size) : null;
    if (corner) {
      const edge = defaultEdgeForCorner(corner);
      await Promise.all([setSetting("popoutDocked", true), setSetting("popoutDockCorner", corner), setSetting("popoutAutoHideEdge", edge), setSetting("popoutAutoHideOffset", cornerOffset(corner))]);
      await move(cornerPosition(workArea, size, corner));
    } else {
      await setSetting("popoutDocked", false);
      if (settings.popoutRememberPosition) await Promise.all([setSetting("popoutPositionX", position.x), setSetting("popoutPositionY", position.y)]);
    }
  };

  const startDrag = (event: ReactPointerEvent) => {
    if (!isTauri() || dockedActive || event.button !== 0 || (event.target as HTMLElement).closest("[data-no-drag]")) return;
    clearHideTimer(); setMenu(null);
    const start = { x: event.clientX, y: event.clientY };
    const cleanup = () => { window.removeEventListener("pointermove", movePointer); window.removeEventListener("pointerup", cleanup); window.removeEventListener("pointercancel", cleanup); };
    const perform = async () => {
      draggingRef.current = true;
      try { await getCurrentWindow().startDragging(); } finally {
        draggingRef.current = false; await settleDrag();
      }
    };
    const movePointer = (pointer: PointerEvent) => {
      if (Math.hypot(pointer.clientX - start.x, pointer.clientY - start.y) < 5) return;
      cleanup(); pointer.preventDefault(); void perform();
    };
    window.addEventListener("pointermove", movePointer); window.addEventListener("pointerup", cleanup); window.addEventListener("pointercancel", cleanup);
  };

  useEffect(() => {
    if (wasDockedRef.current && !dockedActive) {
      undockingRef.current = true;
      setRevealed(false);
      if (isTauri() && settings.popoutRememberPosition && settings.popoutPositionX !== null && settings.popoutPositionY !== null) {
        void move({ x: settings.popoutPositionX, y: settings.popoutPositionY });
      }
      const timeout = window.setTimeout(() => { undockingRef.current = false; }, 750);
      wasDockedRef.current = dockedActive;
      return () => window.clearTimeout(timeout);
    }
    wasDockedRef.current = dockedActive;
  }, [dockedActive, move, settings.popoutPositionX, settings.popoutPositionY, settings.popoutRememberPosition]);

  useEffect(() => {
    if (!loaded || undockingRef.current || !settings.popoutDockingEnabled || !settings.popoutDocked) return;
    void placeDocked().then(() => {
      if (settings.popoutDockAutoHide && selectedMonitorAvailable) void hide();
      else setRevealed(true);
    });
  }, [hide, loaded, placeDocked, selectedMonitorAvailable, settings.popoutDockAutoHide, settings.popoutDocked, settings.popoutDockingEnabled]);

  useEffect(() => { void invoke("set_timer_taskbar", { visible: settings.popoutShowInTaskbar }).catch(() => undefined); }, [settings.popoutShowInTaskbar]);
  useEffect(() => {
    void invoke("set_timer_size", { size: settings.popoutSize })
      .then(() => {
        if (loaded && settings.popoutDockingEnabled && settings.popoutDocked) return placeDocked();
      })
      .catch(() => undefined);
  }, [loaded, placeDocked, selectedMonitorAvailable, settings.popoutAutoHide, settings.popoutDockAutoHide, settings.popoutDocked, settings.popoutDockingEnabled, settings.popoutSize]);
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 10_000); return () => window.clearInterval(id); }, []);
  useEffect(() => { let stop: (() => void) | undefined; void getCurrentWindow().onFocusChanged(({ payload }) => { if (payload) { setMenu(null); setStopping(false); } }).then((value) => { stop = value; }); return () => stop?.(); }, []);
  useEffect(() => { let stop: (() => void) | undefined; void getCurrentWindow().listen("focus://reveal-auto-hide", () => void reveal()).then((value) => { stop = value; }); return () => stop?.(); }, [reveal]);
  useEffect(() => { let stop: (() => void) | undefined; void getCurrentWindow().listen("focus://popout-menu-closed", () => setMenuWindowOpen(false)).then((value) => { stop = value; }); return () => stop?.(); }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let alive = true;
    const refresh = () => void invoke<{ id: string; label: string }[]>("list_monitor_work_areas").then((value) => { if (alive) setDisplays(value); }).catch(() => undefined);
    refresh(); const interval = window.setInterval(refresh, 2500);
    return () => { alive = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!loaded || selectedMonitorAvailable || !dockedActive || !isTauri()) return;
    setRevealed(true);
    void geometry().then(({ workArea, size }) => move(cornerPosition(workArea, size, settings.popoutDockCorner))).catch(() => undefined);
  }, [dockedActive, geometry, loaded, move, selectedMonitorAvailable, settings.popoutDockCorner]);

  useEffect(() => {
    const pointerDown = (event: PointerEvent) => { if (menu && !(event.target as HTMLElement).closest("[data-popout-overlay], [data-popout-menu-button]")) setMenu(null); };
    const keyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", pointerDown); window.addEventListener("keydown", keyDown);
    return () => { document.removeEventListener("pointerdown", pointerDown); window.removeEventListener("keydown", keyDown); clearHideTimer(); };
  }, [menu]);

  useEffect(() => {
    if (!settings.popoutRememberPosition || dockedActive) return;
    let timerId = 0; let unlisten: (() => void) | undefined;
    void getCurrentWindow().onMoved(({ payload }) => {
      if (draggingRef.current || Date.now() < programmaticUntilRef.current) return;
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => { void setSetting("popoutPositionX", payload.x); void setSetting("popoutPositionY", payload.y); }, 300);
    }).then((stop) => { unlisten = stop; });
    return () => { window.clearTimeout(timerId); unlisten?.(); };
  }, [dockedActive, settings.popoutRememberPosition, setSetting]);

  const controlsDelay = settings.popoutAutoHide === "never" ? "2147483647ms" : `${settings.popoutAutoHide}ms`;
  const time = parts(timer.state.remainingSeconds);
  return <main className={`popout-root ${settings.popoutHideControls ? "popout-root--hover-controls" : ""}`} data-accent={settings.accentColour} data-theme={settings.theme} data-scale={settings.uiScale} data-edge={settings.popoutAutoHideEdge} data-size={settings.popoutSize} style={{ "--controls-hide-delay": controlsDelay, "--popout-surface-alpha": settings.popoutTransparency / 100 } as CSSProperties} onPointerDown={startDrag} onMouseEnter={clearHideTimer} onMouseLeave={scheduleHide}>
    <div className="popout-content">
      {(settings.popoutShowSubject || settings.popoutShowClock) && <div className="popout-subject-row">{settings.popoutShowSubject && <div className="popout-subject subject-overflow" tabIndex={0} title={timer.state.subject || t("No Subject")}><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject || t("No Subject")}</div>}{settings.popoutShowClock && <time>{formatTimerClock(now, settings.language, settings.clockFormat)}</time>}</div>}
      <div className="popout-time"><span>{time[0]}</span><b>:</b><span>{time[1]}</span><b>:</b><span>{time[2]}</span></div>
      <div className="popout-labels"><span>{t("Hours")}</span><span>{t("Minutes")}</span><span>{t("Seconds")}</span></div>
      <div className="popout-status">{timer.state.finished ? t("Finished") : timer.state.paused ? t("Paused") : ""}</div>
      <button data-no-drag className="popout-close tooltip-button" aria-label={t("Close popout")} data-tooltip={t("Close popout")} onClick={() => invoke("hide_timer_popout")}><X/></button>
      <div className="popout-controls" data-no-drag>
        <button className="tooltip-button" aria-label={timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")} data-tooltip={timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")} onClick={timer.state.finished ? timer.finish : timer.pause}>{timer.state.finished ? <Check/> : timer.state.paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}</button>
        <button className="tooltip-button" aria-label={t("Extend")} data-tooltip={t("Extend")} onClick={() => setMenu((value) => value === "extend" ? null : "extend")}><Plus size={18}/></button>
        <button className="tooltip-button" aria-label={t("Stop")} data-tooltip={t("Stop")} onClick={() => setStopping(true)}><Square size={15} fill="currentColor"/></button>
        <button className="tooltip-button" aria-label={t("More")} data-tooltip={t("More")} data-popout-menu-button onClick={() => { clearHideTimer(); setMenuWindowOpen(true); void invoke("open_timer_menu").catch(() => setMenuWindowOpen(false)); }}><MoreHorizontal size={18}/></button>
      </div>
      {menu === "extend" && <div data-no-drag data-popout-overlay><TimerExtendMenu compact onClose={() => setMenu(null)} onExtend={(seconds) => { timer.extend(seconds); setMenu(null); }}/></div>}
      {stopping && <div data-no-drag data-popout-overlay className="popout-menu popout-stop-confirm"><strong>{t("Stop timer?")}</strong><span>{t("Elapsed focus time will be saved.")}</span><button onClick={() => setStopping(false)}>{t("Cancel")}</button><button className="danger-action" onClick={async () => { setStopping(false); await timer.stop(); }}>{t("Stop and save")}</button></div>}
    </div>
  </main>;
}
