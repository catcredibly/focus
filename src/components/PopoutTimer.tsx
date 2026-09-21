import { MoreHorizontal, Pause, Play, Plus, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTimer } from "../hooks/useTimer";

function format(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function PopoutTimer() {
  const timer = useTimer();
  const [menu, setMenu] = useState<"extend" | "more" | null>(null);
  const [onTop, setOnTop] = useState(true);

  const toggleOnTop = async () => {
    const next = !onTop;
    setOnTop(next);
    try { await invoke("set_timer_always_on_top", { enabled: next }); } catch { /* Browser preview. */ }
  };

  useEffect(() => {
    void invoke("set_timer_popout_expanded", { expanded: menu !== null }).catch(() => undefined);
  }, [menu]);

  return <main className="popout-root">
    <div className="popout-subject"><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject || "Focus"}</div>
    <div className="popout-time">{format(timer.state.remainingSeconds)}</div>
    <div className="popout-controls">
      <button title={timer.state.paused ? "Resume" : "Pause"} onClick={timer.pause}>{timer.state.paused ? <Play size={17} fill="currentColor"/> : <Pause size={17} fill="currentColor"/>}</button>
      <button title="Stop" onClick={timer.stop}><Square size={15} fill="currentColor"/></button>
      <button title="Extend" onClick={() => setMenu((value) => value === "extend" ? null : "extend")}><Plus size={18}/></button>
      <button title="More" onClick={() => setMenu((value) => value === "more" ? null : "more")}><MoreHorizontal size={18}/></button>
    </div>
    {menu === "extend" && <div className="popout-menu">{[5, 10, 25, 50].map((minutes) => <button key={minutes} onClick={() => { timer.extend(minutes * 60); setMenu(null); }}><span>+ {minutes} minutes</span></button>)}</div>}
    {menu === "more" && <div className="popout-menu"><button onClick={toggleOnTop}>Always on top <span>{onTop ? "On" : "Off"}</span></button><button onClick={() => invoke("focus_main_window")}>Open Focus</button><button onClick={() => invoke("hide_timer_popout")}>Close popout</button></div>}
  </main>;
}
