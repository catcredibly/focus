import { ExternalLink, MoreHorizontal, Pause, Play, Plus, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { CURRENT_YEAR_KEY, formatDuration } from "../data";
import { useTimer } from "../hooks/useTimer";
import { currentStreak, LAST_TIMER_DURATION_KEY, todaySummary } from "../timerState";

const pad = (value: number) => String(value).padStart(2, "0");

function normalise(hours: number, minutes: number, seconds: number) {
  const total = Math.max(0, Math.floor(hours) * 3600 + Math.floor(minutes) * 60 + Math.floor(seconds));
  return { total, hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

const todayText = () => new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function TimerPage() {
  const timer = useTimer();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [extendOpen, setExtendOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const currentYearId = useLiveQuery(async () => (await db.settings.get(CURRENT_YEAR_KEY))?.value ?? "", []) ?? "";
  const currentYear = useLiveQuery(() => currentYearId ? db.academicYears.get(currentYearId) : undefined, [currentYearId]);
  const subjects = useLiveQuery(async () => currentYearId ? (await db.subjects.where("academicYearId").equals(currentYearId).toArray()).filter((subject) => !subject.archived) : [], [currentYearId]) ?? [];
  const sessions = useLiveQuery(() => db.sessions.orderBy("startTime").reverse().toArray(), []) ?? [];
  const lastDuration = useLiveQuery(async () => Number((await db.settings.get(LAST_TIMER_DURATION_KEY))?.value || 75 * 60), []);
  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
  const summary = todaySummary(sessions);
  const recent = sessions.filter((session) => !session.archived).slice(0, 4);

  useEffect(() => {
    if (!lastDuration || timer.state.running) return;
    setHours(Math.floor(lastDuration / 3600));
    setMinutes(Math.floor((lastDuration % 3600) / 60));
    setSeconds(lastDuration % 60);
  }, [lastDuration, timer.state.running]);

  const commitInput = () => {
    const value = normalise(hours, minutes, seconds);
    setHours(value.hours); setMinutes(value.minutes); setSeconds(value.seconds);
    return value.total;
  };

  const openPopout = async () => {
    try { await invoke("open_timer_popout"); } catch { /* Browser preview has no native window. */ }
  };

  if (timer.state.running) return <main className="timer-shell timer-shell--running"><section className="running-stage">
    <div className="quote">"Small steps, big progress."</div><div className="date">{todayText()}</div>
    <div className="running-subject"><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject}</div>
    <div className="running-time"><span>{pad(timer.display.hours)}</span><b>:</b><span>{pad(timer.display.minutes)}</span><b>:</b><span>{pad(timer.display.seconds)}</span></div>
    <div className="running-labels"><span>Hours</span><span>Minutes</span><span>Seconds</span></div><div className="running-status">{timer.state.paused ? "Paused" : "Running"}</div>
    <div className="running-controls"><button className="control-button" onClick={timer.pause}>{timer.state.paused ? <Play size={25} fill="currentColor"/> : <Pause size={25} fill="currentColor"/>}<span>{timer.state.paused ? "Resume" : "Pause"}</span></button><button className="control-button" onClick={timer.stop}><Square size={22} fill="currentColor"/><span>Stop</span></button><div className="extend-wrap"><button className={`control-button ${extendOpen ? "control-button--accent" : ""}`} onClick={() => setExtendOpen((value) => !value)}><Plus size={27}/><span>Extend</span></button>{extendOpen && <div className="extend-menu">{[5, 15, 30, 50].map((value) => <button key={value} onClick={() => { timer.extend(value * 60); setExtendOpen(false); }}><Plus size={16}/> {value} minutes</button>)}<button><MoreHorizontal size={16}/> Custom...</button></div>}</div><button className="control-button" onClick={openPopout}><ExternalLink size={22}/><span>Pop out</span></button></div>
    <input className="note-field" aria-label="Session note" placeholder="Add a note (optional)..." value={timer.state.note} onChange={(event) => timer.setNote(event.target.value)}/>
  </section></main>;

  return <main className="timer-shell timer-shell--idle"><section className="timer-card">
    <div className="quote">"Small steps, big progress."</div><div className="date">{todayText()}</div>
    <div className="time-entry"><label><input value={hours} onChange={(event) => setHours(Number(event.target.value || 0))} onBlur={commitInput}/><span>Hours</span></label><b>:</b><label><input value={minutes} onChange={(event) => setMinutes(Number(event.target.value || 0))} onBlur={commitInput}/><span>Minutes</span></label><b>:</b><label><input value={seconds} onChange={(event) => setSeconds(Number(event.target.value || 0))} onBlur={commitInput}/><span>Seconds</span></label></div>
    <select className="subject-select" value={selectedSubject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)} disabled={!subjects.length}>{!subjects.length && <option>Add a Subject for the current Academic Year</option>}{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
    <input className="note-field" aria-label="Session note" placeholder="Add a note (optional)..." value={timer.state.note} onChange={(event) => timer.setNote(event.target.value)}/>
    <button className="start-button" disabled={!selectedSubject || !currentYear} onClick={async () => { const duration = commitInput(); if (selectedSubject && currentYear && duration > 0) { await db.settings.put({ key: LAST_TIMER_DURATION_KEY, value: String(duration) }); timer.start(duration, selectedSubject, currentYear); } }}><Play size={20} fill="currentColor"/> Start</button>
  </section><aside className="today-panel"><h2>Today</h2><div className="metric-card"><span>Focus time</span><strong>{formatDuration(summary.focusedDurationSeconds)}</strong></div><div className="metric-card"><span>Sessions</span><strong>{summary.sessions.length}</strong></div><div className="metric-card"><span>Current streak</span><strong>{currentStreak(sessions)} days</strong></div><h3>Recent Sessions</h3>{recent.map((session) => <div className="recent-row" key={session.id}><span className="recent-dot"/><span>{session.subjectName}</span><strong>{formatDuration(session.focusedDurationSeconds)}</strong><small>{new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>)}{!recent.length && <p className="recent-empty">No completed Sessions yet.</p>}</aside></main>;
}
