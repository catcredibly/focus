import { Check, ChevronLeft, ChevronRight, MoreHorizontal, Pause, Play, Plus, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { autoHidePosition, cornerPosition, defaultEdgeForCorner, edgeOffset, nearestDockCorner, nearestEdge, tabOrientation, type Point, type Size, type WorkArea } from "../popoutPlacement";
import type { DockCorner } from "../settings";
import { TimerExtendMenu } from "./TimerExtendMenu";

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
  const [menu, setMenu] = useState<"extend" | "more" | "dock" | null>(null);
  const [onTop, setOnTop] = useState(settings.popoutAlwaysOnTop);
  const [revealed, setRevealed] = useState(false);
  const appliedDefaultRef = useRef(false);
  const draggingRef = useRef(false);
  const programmaticUntilRef = useRef(0);
  const hideTimerRef = useRef(0);
  const tabHoverTimerRef = useRef(0);
  const suppressTabClickRef = useRef(false);
  const dockedActive = settings.popoutDockingEnabled && settings.popoutDocked;
  const autoHideActive = dockedActive && settings.popoutDockAutoHide;

  const geometry = useCallback(async () => {
    const window = getCurrentWindow();
    const [workArea, size] = await Promise.all([invoke<WorkArea>("get_timer_work_area"), window.outerSize()]);
    return { workArea, size: { width: size.width, height: size.height } as Size };
  }, []);

  const move = useCallback(async (position: Point, unchecked = false) => {
    programmaticUntilRef.current = Date.now() + 500;
    await invoke(unchecked ? "set_timer_position_unchecked" : "set_timer_position", { x: Math.round(position.x), y: Math.round(position.y) });
  }, []);

  const placeDocked = useCallback(async (hidden: boolean, edge = settings.popoutAutoHideEdge, offset = settings.popoutAutoHideOffset) => {
    if (!isTauri()) return;
    const { workArea, size } = await geometry();
    const position = settings.popoutDockAutoHide ? autoHidePosition(workArea, size, edge, offset, hidden) : cornerPosition(workArea, size, settings.popoutDockCorner);
    await move(position, hidden);
  }, [geometry, move, settings.popoutAutoHideEdge, settings.popoutAutoHideOffset, settings.popoutDockAutoHide, settings.popoutDockCorner]);

  const clearHideTimer = () => window.clearTimeout(hideTimerRef.current);
  const scheduleReveal = () => {
    window.clearTimeout(tabHoverTimerRef.current);
    tabHoverTimerRef.current = window.setTimeout(() => void reveal(), 180);
  };
  const reveal = useCallback(async () => {
    if (!autoHideActive || draggingRef.current) return;
    clearHideTimer(); setRevealed(true); await placeDocked(false);
  }, [autoHideActive, placeDocked]);
  const hide = useCallback(async () => {
    if (!autoHideActive || draggingRef.current || menu !== null) return;
    setRevealed(false); await placeDocked(true);
  }, [autoHideActive, menu, placeDocked]);
  const scheduleHide = () => {
    clearHideTimer();
    if (autoHideActive && revealed && menu === null && !draggingRef.current) hideTimerRef.current = window.setTimeout(() => void hide(), 400);
  };

  const toggleOnTop = async () => {
    const next = !onTop;
    setOnTop(next); await setSetting("popoutAlwaysOnTop", next);
    try { await invoke("set_timer_always_on_top", { enabled: next }); } catch { /* Browser preview. */ }
    setMenu(null);
  };

  const dock = async (corner: DockCorner) => {
    const edge = defaultEdgeForCorner(corner);
    await Promise.all([
      setSetting("popoutDockingEnabled", true), setSetting("popoutDocked", true), setSetting("popoutDockCorner", corner),
      setSetting("popoutAutoHideEdge", edge), setSetting("popoutAutoHideOffset", cornerOffset(corner)),
    ]);
    setMenu(null); setRevealed(!settings.popoutDockAutoHide);
    if (isTauri()) {
      const { workArea, size } = await geometry();
      await move(settings.popoutDockAutoHide ? autoHidePosition(workArea, size, edge, cornerOffset(corner), true) : cornerPosition(workArea, size, corner), settings.popoutDockAutoHide);
    }
  };

  const undock = async () => {
    await setSetting("popoutDocked", false);
    setMenu(null); setRevealed(false);
    if (isTauri() && settings.popoutRememberPosition && settings.popoutPositionX !== null && settings.popoutPositionY !== null) await move({ x: settings.popoutPositionX, y: settings.popoutPositionY });
  };

  const toggleDockAutoHide = async () => {
    const next = !settings.popoutDockAutoHide;
    await setSetting("popoutDockAutoHide", next);
    setMenu(null); setRevealed(!next);
    if (isTauri()) {
      const { workArea, size } = await geometry();
      await move(next ? autoHidePosition(workArea, size, settings.popoutAutoHideEdge, settings.popoutAutoHideOffset, true) : cornerPosition(workArea, size, settings.popoutDockCorner), next);
    }
  };

  const settleDrag = async (tabDrag: boolean) => {
    if (!isTauri()) return;
    const window = getCurrentWindow();
    const [position, { workArea, size }] = await Promise.all([window.outerPosition(), geometry()]);
    if (tabDrag) {
      const edge = nearestEdge(position, workArea, size);
      const offset = edgeOffset(position, workArea, size, edge);
      await Promise.all([setSetting("popoutAutoHideEdge", edge), setSetting("popoutAutoHideOffset", offset), setSetting("popoutDocked", true)]);
      await move(autoHidePosition(workArea, size, edge, offset, true), true);
      return;
    }
    const corner = settings.popoutDockingEnabled ? nearestDockCorner(position, workArea, size) : null;
    if (corner) {
      const edge = defaultEdgeForCorner(corner);
      await Promise.all([setSetting("popoutDocked", true), setSetting("popoutDockCorner", corner), setSetting("popoutAutoHideEdge", edge), setSetting("popoutAutoHideOffset", cornerOffset(corner))]);
      await move(settings.popoutDockAutoHide ? autoHidePosition(workArea, size, edge, cornerOffset(corner), true) : cornerPosition(workArea, size, corner), settings.popoutDockAutoHide);
    } else {
      await setSetting("popoutDocked", false);
      if (settings.popoutRememberPosition) await Promise.all([setSetting("popoutPositionX", position.x), setSetting("popoutPositionY", position.y)]);
    }
  };

  const startDrag = async (event: ReactPointerEvent, tabDrag = false) => {
    if (!isTauri() || event.button !== 0 || (event.target as HTMLElement).closest("[data-no-drag]")) return;
    event.preventDefault(); clearHideTimer(); window.clearTimeout(tabHoverTimerRef.current); setMenu(null); draggingRef.current = true;
    if (tabDrag) suppressTabClickRef.current = true;
    try { await getCurrentWindow().startDragging(); } finally {
      draggingRef.current = false; await settleDrag(tabDrag);
      if (tabDrag) window.setTimeout(() => { suppressTabClickRef.current = false; }, 100);
    }
  };

  useEffect(() => {
    if (!loaded || appliedDefaultRef.current) return;
    setOnTop(settings.popoutAlwaysOnTop); appliedDefaultRef.current = true;
  }, [loaded, settings.popoutAlwaysOnTop]);

  useEffect(() => {
    if (!loaded || !settings.popoutDockingEnabled || !settings.popoutDocked) return;
    setRevealed(!settings.popoutDockAutoHide); void placeDocked(settings.popoutDockAutoHide);
  }, [loaded, placeDocked, settings.popoutDockAutoHide, settings.popoutDocked, settings.popoutDockingEnabled]);

  useEffect(() => { void invoke("set_timer_taskbar", { visible: settings.popoutShowInTaskbar }).catch(() => undefined); }, [settings.popoutShowInTaskbar]);

  useEffect(() => {
    const pointerDown = (event: PointerEvent) => { if (menu && !(event.target as HTMLElement).closest("[data-popout-overlay], [data-popout-menu-button]")) setMenu(null); };
    const keyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", pointerDown); window.addEventListener("keydown", keyDown);
    return () => { document.removeEventListener("pointerdown", pointerDown); window.removeEventListener("keydown", keyDown); clearHideTimer(); window.clearTimeout(tabHoverTimerRef.current); };
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
  const hidden = autoHideActive && !revealed;
  const cornerLabels: [DockCorner, string][] = [["top-left", "Top Left"], ["top-right", "Top Right"], ["bottom-left", "Bottom Left"], ["bottom-right", "Bottom Right"]];

  return <main className={`popout-root ${settings.popoutHideControls ? "popout-root--hover-controls" : ""} ${hidden ? "popout-root--auto-hidden" : ""}`} data-accent={settings.accentColour} data-scale={settings.uiScale} data-edge={settings.popoutAutoHideEdge} style={{ "--controls-hide-delay": controlsDelay, "--popout-opacity": settings.popoutTransparency / 100 } as CSSProperties} onPointerDown={(event) => void startDrag(event)} onMouseEnter={clearHideTimer} onMouseLeave={scheduleHide}>
    {hidden && <button className={`auto-hide-tab auto-hide-tab--${tabOrientation(settings.popoutAutoHideEdge)}`} aria-label={t("Open Focus")} onPointerDown={(event) => { event.stopPropagation(); void startDrag(event, true); }} onMouseEnter={scheduleReveal} onMouseLeave={() => window.clearTimeout(tabHoverTimerRef.current)} onClick={() => { if (!suppressTabClickRef.current) void reveal(); }}><span/></button>}
    <div className="popout-content">
      {settings.popoutShowSubject && <div className="popout-subject"><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject || t("No Subject")}</div>}
      <div className="popout-time"><span>{time[0]}</span><b>:</b><span>{time[1]}</span><b>:</b><span>{time[2]}</span></div>
      <div className="popout-labels"><span>{t("Hours")}</span><span>{t("Minutes")}</span><span>{t("Seconds")}</span></div>
      <div className="popout-status">{timer.state.finished ? t("Finished") : timer.state.paused ? t("Paused") : ""}</div>
      <button data-no-drag className="popout-close" title={t("Close popout")} aria-label={t("Close popout")} onClick={() => invoke("hide_timer_popout")}><X/></button>
      <div className="popout-controls" data-no-drag>
        <button title={timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")} onClick={timer.state.finished ? timer.finish : timer.pause}>{timer.state.finished ? <Check/> : timer.state.paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}</button>
        <button title={t("Extend")} onClick={() => setMenu((value) => value === "extend" ? null : "extend")}><Plus size={18}/></button>
        <button title={t("Stop")} onClick={timer.stop}><Square size={15} fill="currentColor"/></button>
        <button data-popout-menu-button title={t("More")} onClick={() => setMenu((value) => value === "more" || value === "dock" ? null : "more")}><MoreHorizontal size={18}/></button>
      </div>
      {menu === "extend" && <div data-no-drag data-popout-overlay><TimerExtendMenu compact onClose={() => setMenu(null)} onExtend={(seconds) => { timer.extend(seconds); setMenu(null); }}/></div>}
      {menu === "more" && <div data-no-drag data-popout-overlay className="popout-menu">
        <button onClick={() => void toggleOnTop()}>{t("Always on top")} <span>{t(onTop ? "On" : "Off")}</span></button>
        {dockedActive && <button onClick={() => void undock()}>{t("Undock")}</button>}
        <button onClick={() => setMenu("dock")}>{t("Dock to")}<ChevronRight/></button>
        {dockedActive && <button onClick={() => void toggleDockAutoHide()}>{t("Auto-hide")} <span>{t(settings.popoutDockAutoHide ? "On" : "Off")}</span></button>}
        <button onClick={() => { setMenu(null); void invoke("focus_main_window"); }}>{t("Open Focus")}</button>
        <button onClick={() => invoke("hide_timer_popout")}>{t("Close popout")}</button>
      </div>}
      {menu === "dock" && <div data-no-drag data-popout-overlay className="popout-menu popout-menu--dock"><button onClick={() => setMenu("more")}><ChevronLeft/>{t("Dock to")}</button>{cornerLabels.map(([corner, label]) => <button key={corner} onClick={() => void dock(corner)}>{t(label)}{dockedActive && settings.popoutDockCorner === corner ? <Check/> : null}</button>)}</div>}
    </div>
  </main>;
}
