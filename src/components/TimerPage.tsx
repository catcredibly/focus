import { Pause, Play, Square, Plus, MoreHorizontal, ExternalLink } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTimer } from "../hooks/useTimer";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { CURRENT_YEAR_KEY, formatDuration } from "../data";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function normalise(hours: number, minutes: number, seconds: number) {
  const total = Math.max(0, Math.floor(hours) * 3600 + Math.floor(minutes) * 60 + Math.floor(seconds));
  return {
    total,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function TimerPage() {
  const timer = useTimer();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [extendOpen, setExtendOpen] = useState(false);
  const currentYearId = useLiveQuery(async () => (await db.settings.get(CURRENT_YEAR_KEY))?.value ?? "", []) ?? "";
  const currentYear = useLiveQuery(() => currentYearId ? db.academicYears.get(currentYearId) : undefined, [currentYearId]);
  const subjects = useLiveQuery(async () => currentYearId ? (await db.subjects.where("academicYearId").equals(currentYearId).toArray()).filter((subject) => !subject.archived) : [], [currentYearId]) ?? [];
  const recent = useLiveQuery(async () => (await db.sessions.orderBy("startTime").reverse().limit(12).toArray()).filter((session) => !session.archived), []) ?? [];
  const [subjectId, setSubjectId] = useState("");
  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];

  const commitInput = () => {
    const value = normalise(hours, minutes, seconds);
    setHours(value.hours);
    setMinutes(value.minutes);
    setSeconds(value.seconds);
    return value.total;
  };

  const openPopout = async () => {
    try {
      await invoke("open_timer_popout");
    } catch {
      // Safe no-op in browser preview.
    }
  };

  if (timer.state.running) {
    return (
      <main className="timer-shell timer-shell--running">
        <section className="running-stage">
          <div className="quote">“Small steps, big progress.”</div>
          <div className="date">Mon, 21 Sep 2026</div>

          <div className="running-subject"><span className="subject-dot" />{timer.state.subject}</div>
          <div className="running-time">
            <span>{pad(timer.display.hours)}</span><b>:</b><span>{pad(timer.display.minutes)}</span><b>:</b><span>{pad(timer.display.seconds)}</span>
          </div>
          <div className="running-labels"><span>Hours</span><span>Minutes</span><span>Seconds</span></div>
          <div className="running-status">{timer.state.paused ? "Paused" : "Running"}</div>

          <div className="running-controls">
            <button className="control-button" onClick={timer.pause}>
              {timer.state.paused ? <Play size={25} fill="currentColor" /> : <Pause size={25} fill="currentColor" />}
              <span>{timer.state.paused ? "Resume" : "Pause"}</span>
            </button>
            <button className="control-button" onClick={timer.stop}>
              <Square size={22} fill="currentColor" />
              <span>Stop</span>
            </button>
            <div className="extend-wrap">
              <button className={`control-button ${extendOpen ? "control-button--accent" : ""}`} onClick={() => setExtendOpen((v) => !v)}>
                <Plus size={27} />
                <span>Extend</span>
              </button>
              {extendOpen && (
                <div className="extend-menu">
                  {[5, 15, 30, 50].map((min) => (
                    <button key={min} onClick={() => { timer.extend(min * 60); setExtendOpen(false); }}>
                      <Plus size={16} /> {min} minutes
                    </button>
                  ))}
                  <button><MoreHorizontal size={16} /> Custom…</button>
                </div>
              )}
            </div>
            <button className="control-button" onClick={openPopout}>
              <ExternalLink size={22} />
              <span>Pop out</span>
            </button>
          </div>

          <div className="note-field">Add a note (optional)…</div>
        </section>
      </main>
    );
  }

  return (
    <main className="timer-shell timer-shell--idle">
      <section className="timer-card">
        <div className="quote">“Small steps, big progress.”</div>
        <div className="date">Mon, 21 Sep 2026</div>

        <div className="time-entry">
          <label>
            <input value={hours} onChange={(e) => setHours(Number(e.target.value || 0))} onBlur={commitInput} />
            <span>Hours</span>
          </label>
          <b>:</b>
          <label>
            <input value={minutes} onChange={(e) => setMinutes(Number(e.target.value || 0))} onBlur={commitInput} />
            <span>Minutes</span>
          </label>
          <b>:</b>
          <label>
            <input value={seconds} onChange={(e) => setSeconds(Number(e.target.value || 0))} onBlur={commitInput} />
            <span>Seconds</span>
          </label>
        </div>

        <select className="subject-select" value={selectedSubject?.id ?? ""} onChange={(e) => setSubjectId(e.target.value)} disabled={!subjects.length}>
          {!subjects.length && <option>Add a Subject for the current Academic Year</option>}
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <div className="note-field">Add a note (optional)…</div>
        <button className="start-button" disabled={!selectedSubject || !currentYear} onClick={() => selectedSubject && currentYear && timer.start(commitInput(), selectedSubject, currentYear)}><Play size={20} fill="currentColor" /> Start</button>
      </section>

      <aside className="today-panel">
        <h2>Today</h2>
        <div className="metric-card"><span>Focus time</span><strong>2 hr 35 min</strong></div>
        <div className="metric-card"><span>Sessions</span><strong>4</strong></div>
        <div className="metric-card"><span>Current streak</span><strong>8 days</strong></div>
        <h3>Recent sessions</h3>
        {recent.slice(0, 4).map((session) => (
          <div className="recent-row" key={session.id}>
            <span className="recent-dot" />
            <span>{session.subjectName}</span><strong>{formatDuration(session.focusedDurationSeconds)}</strong><small>{new Date(session.startTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</small>
          </div>
        ))}
      </aside>
    </main>
  );
}
