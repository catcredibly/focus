import { Check, MoreHorizontal, Pause, Play, Plus, Square, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { TimerExtendMenu } from "./TimerExtendMenu";

function parts(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

export function PopoutTimer() {
  const timer = useTimer();
  const { settings, loaded, setSetting } = useSettings();
  const [menu, setMenu] = useState<"extend" | "more" | null>(null);
  const [onTop, setOnTop] = useState(settings.popoutAlwaysOnTop);
  const appliedDefaultRef = useRef(false);

  const toggleOnTop = async () => {
    const next = !onTop;
    setOnTop(next);
    try { await invoke("set_timer_always_on_top", { enabled: next }); } catch { /* Browser preview. */ }
  };

  useEffect(() => {
    void invoke("set_timer_popout_expanded", { expanded: menu !== null }).catch(() => undefined);
  }, [menu]);

  useEffect(() => {
    if (!loaded || appliedDefaultRef.current) return;
    setOnTop(settings.popoutAlwaysOnTop);
    appliedDefaultRef.current = true;
  }, [loaded, settings.popoutAlwaysOnTop]);

  useEffect(() => {
    void invoke("set_timer_taskbar", { visible: settings.popoutShowInTaskbar }).catch(() => undefined);
  }, [settings.popoutShowInTaskbar]);

  useEffect(() => {
    if (!settings.popoutRememberPosition) return;
    let timerId = 0;
    let unlisten: (() => void) | undefined;
    void getCurrentWindow().onMoved(({ payload }) => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        void setSetting("popoutPositionX", payload.x);
        void setSetting("popoutPositionY", payload.y);
      }, 300);
    }).then((stop) => { unlisten = stop; });
    return () => { window.clearTimeout(timerId); unlisten?.(); };
  }, [settings.popoutRememberPosition, setSetting]);

  const hideDelay = settings.popoutAutoHide === "never" ? "2147483647ms" : `${settings.popoutAutoHide}ms`;
  const time = parts(timer.state.remainingSeconds);
  return <main className={`popout-root ${settings.popoutHideControls ? "popout-root--hover-controls" : ""}`} data-accent={settings.accentColour} data-scale={settings.uiScale} style={{ "--controls-hide-delay": hideDelay, "--popout-opacity": settings.popoutTransparency / 100 } as CSSProperties}>
    {settings.popoutShowSubject && <div className="popout-subject"><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject || "No Subject"}</div>}
    <div className="popout-time"><span>{time[0]}</span><b>:</b><span>{time[1]}</span><b>:</b><span>{time[2]}</span></div>
    <div className="popout-labels"><span>Hours</span><span>Minutes</span><span>Seconds</span></div>
    <div className="popout-status">{timer.state.finished ? "Finished" : timer.state.paused ? "Paused" : ""}</div>
    <button className="popout-close" title="Close popout" aria-label="Close popout" onClick={() => invoke("hide_timer_popout")}><X/></button>
    <div className="popout-controls">
      <button title={timer.state.finished ? "Finish" : timer.state.paused ? "Resume" : "Pause"} onClick={timer.state.finished ? timer.finish : timer.pause}>{timer.state.finished ? <Check/> : timer.state.paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}</button>
      <button title="Extend" onClick={() => setMenu((value) => value === "extend" ? null : "extend")}><Plus size={18}/></button>
      <button title="Stop" onClick={timer.stop}><Square size={15} fill="currentColor"/></button>
      <button title="More" onClick={() => setMenu((value) => value === "more" ? null : "more")}><MoreHorizontal size={18}/></button>
    </div>
    {menu === "extend" && <TimerExtendMenu compact onClose={() => setMenu(null)} onExtend={(seconds) => { timer.extend(seconds); setMenu(null); }}/>} {menu === "more" && <div className="popout-menu"><button onClick={toggleOnTop}>Always on top <span>{onTop ? "On" : "Off"}</span></button><button onClick={() => invoke("focus_main_window")}>Open Focus</button><button onClick={() => invoke("hide_timer_popout")}>Close popout</button></div>}
  </main>;
}
