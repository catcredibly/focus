import { MoreHorizontal, Pause, Play, Square } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTimer } from "../hooks/useTimer";

function format(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function PopoutTimer() {
  const timer = useTimer();
  const [menu, setMenu] = useState(false);
  const [onTop, setOnTop] = useState(true);

  const toggleOnTop = async () => {
    const next = !onTop;
    setOnTop(next);
    try { await invoke("set_timer_always_on_top", { enabled: next }); } catch { /* browser preview */ }
  };

  return (
    <main className="popout-root">
      <div className="popout-subject"><span className="subject-dot" />{timer.state.subject}</div>
      <div className="popout-time">{format(timer.state.remainingSeconds)}</div>
      <div className="popout-controls">
        <button onClick={timer.pause}>{timer.state.paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}</button>
        <button onClick={timer.stop}><Square size={15} fill="currentColor" /></button>
        <button onClick={() => setMenu((v) => !v)}><MoreHorizontal size={18} /></button>
      </div>
      {menu && (
        <div className="popout-menu">
          <button onClick={toggleOnTop}>Always on top <span>{onTop ? "✓" : ""}</span></button>
          <button onClick={() => invoke("focus_main_window")}>Open Focus</button>
          <button onClick={() => invoke("hide_timer_popout")}>Hide timer</button>
        </div>
      )}
    </main>
  );
}
