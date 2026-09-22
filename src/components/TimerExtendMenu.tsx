import { Clock3, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { normaliseDuration } from "../settings";

export const EXTEND_PRESETS_MINUTES = [5, 15, 30, 60] as const;

export function TimerExtendMenu({ onExtend, onClose, compact = false }: { onExtend: (seconds: number) => void; onClose: () => void; compact?: boolean }) {
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState({ hours: 0, minutes: 20, seconds: 0 });
  const normalise = () => { const next = normaliseDuration(draft.hours, draft.minutes, draft.seconds); setDraft(next); return next.total; };
  const add = () => { const seconds = normalise(); if (seconds > 0) onExtend(seconds); };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (custom) setCustom(false); else onClose(); }
      if (event.key === "Enter" && custom) { event.preventDefault(); add(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  return <div className={`extend-menu ${compact ? "extend-menu--compact" : ""}`}>
    {!custom ? <>{EXTEND_PRESETS_MINUTES.map((minutes) => <button key={minutes} onClick={() => onExtend(minutes * 60)}><Plus/> {minutes} minutes</button>)}<button onClick={() => setCustom(true)}><Clock3/> Custom...</button></> : <div className="custom-extend">
      <div className="custom-duration"><label><input autoFocus inputMode="numeric" value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: Math.max(0, Number(event.target.value || 0)) })} onBlur={normalise}/><span>Hours</span></label><b>:</b><label><input inputMode="numeric" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Math.max(0, Number(event.target.value || 0)) })} onBlur={normalise}/><span>Minutes</span></label><b>:</b><label><input inputMode="numeric" value={draft.seconds} onChange={(event) => setDraft({ ...draft, seconds: Math.max(0, Number(event.target.value || 0)) })} onBlur={normalise}/><span>Seconds</span></label></div>
      <div className="custom-extend-actions"><button onClick={() => setCustom(false)}>Cancel</button><button className="custom-add" disabled={normaliseDuration(draft.hours, draft.minutes, draft.seconds).total === 0} onClick={add}>Add time</button></div>
    </div>}
  </div>;
}
