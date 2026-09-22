import { Check, ExternalLink, Pause, Play, Plus, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { CURRENT_YEAR_KEY, formatDuration } from "../data";
import { useTimer } from "../hooks/useTimer";
import { currentStreak, todaySummary } from "../timerState";
import { useSettings } from "../hooks/useSettings";
import { normaliseDuration, saveSetting, timerDefaultDuration } from "../settings";
import { openTimerPopout } from "../native";
import { TimerExtendMenu } from "./TimerExtendMenu";
import { useTranslation } from "react-i18next";
import { localeCode } from "../i18n";

const pad = (value: number) => String(value).padStart(2, "0");

const todayText = () => new Date().toLocaleDateString(localeCode(), { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function TimerPage() {
  const timer = useTimer();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [extendOpen, setExtendOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const currentYearId = useLiveQuery(async () => (await db.settings.get(CURRENT_YEAR_KEY))?.value ?? "", []) ?? "";
  const currentYear = useLiveQuery(() => currentYearId ? db.academicYears.get(currentYearId) : undefined, [currentYearId]);
  const subjects = useLiveQuery(async () => currentYearId ? (await db.subjects.where("academicYearId").equals(currentYearId).toArray()).filter((subject) => !subject.archived) : [], [currentYearId]) ?? [];
  const sessions = useLiveQuery(() => db.sessions.orderBy("startTime").reverse().toArray(), []) ?? [];
  const defaultDuration = timerDefaultDuration(settings);
  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
  const summary = todaySummary(sessions);
  const recent = sessions.filter((session) => !session.archived).slice(0, 4);

  useEffect(() => {
    if (!defaultDuration || timer.state.running) return;
    setHours(Math.floor(defaultDuration / 3600));
    setMinutes(Math.floor((defaultDuration % 3600) / 60));
    setSeconds(defaultDuration % 60);
  }, [defaultDuration, timer.state.running]);

  const commitInput = () => {
    const value = normaliseDuration(hours, minutes, seconds);
    setHours(value.hours); setMinutes(value.minutes); setSeconds(value.seconds);
    return value.total;
  };

  const openPopout = () => openTimerPopout(settings).catch(() => undefined);

  if (timer.state.running) return <main className="timer-shell timer-shell--running"><section className="running-stage">
    <div className="quote">“{t("Small steps, big progress.")}”</div><div className="date">{todayText()}</div>
    <div className="running-subject"><span className="subject-dot" style={{ background: timer.state.subjectColor }}/>{timer.state.subject}</div>
    <div className="running-time"><span>{pad(timer.display.hours)}</span><b>:</b><span>{pad(timer.display.minutes)}</span><b>:</b><span>{pad(timer.display.seconds)}</span></div>
    <div className="running-labels"><span>{t("Hours")}</span><span>{t("Minutes")}</span><span>{t("Seconds")}</span></div><div className="running-status">{timer.state.finished ? t("Finished") : timer.state.paused ? t("Paused") : ""}</div>
    <div className="running-controls"><button className="control-button" onClick={timer.state.finished ? timer.finish : timer.pause}>{timer.state.finished ? <Check size={25}/> : timer.state.paused ? <Play size={25} fill="currentColor"/> : <Pause size={25} fill="currentColor"/>}<span>{timer.state.finished ? t("Finish") : timer.state.paused ? t("Resume") : t("Pause")}</span></button><button className="control-button" onClick={timer.stop}><Square size={22} fill="currentColor"/><span>{t("Stop")}</span></button><div className="extend-wrap"><button className={`control-button ${extendOpen ? "control-button--accent" : ""}`} onClick={() => setExtendOpen((value) => !value)}><Plus size={27}/><span>{t("Extend")}</span></button>{extendOpen && <TimerExtendMenu onClose={() => setExtendOpen(false)} onExtend={(seconds) => { timer.extend(seconds); setExtendOpen(false); }}/>}</div><button className="control-button" onClick={openPopout}><ExternalLink size={22}/><span>{t("Pop out")}</span></button></div>
    <input className="note-field" aria-label={t("Session note")} placeholder={t("Add a note (optional)...")} value={timer.state.note} onChange={(event) => timer.setNote(event.target.value)}/>
  </section></main>;

  return <main className="timer-shell timer-shell--idle"><section className="timer-card">
    <div className="quote">“{t("Small steps, big progress.")}”</div><div className="date">{todayText()}</div>
    <div className="time-entry"><label><input value={hours} onChange={(event) => setHours(Number(event.target.value || 0))} onBlur={commitInput}/><span>{t("Hours")}</span></label><b>:</b><label><input value={minutes} onChange={(event) => setMinutes(Number(event.target.value || 0))} onBlur={commitInput}/><span>{t("Minutes")}</span></label><b>:</b><label><input value={seconds} onChange={(event) => setSeconds(Number(event.target.value || 0))} onBlur={commitInput}/><span>{t("Seconds")}</span></label></div>
    <select className="subject-select" value={selectedSubject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)} disabled={!subjects.length}>{!subjects.length && <option>{t("Add a Subject for the current Academic Year")}</option>}{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
    <input className="note-field" aria-label={t("Session note")} placeholder={t("Add a note (optional)...")} value={timer.state.note} onChange={(event) => timer.setNote(event.target.value)}/>
    <button className="start-button" disabled={!selectedSubject || !currentYear} onClick={async () => { const duration = commitInput(); if (selectedSubject && currentYear && duration > 0) { await saveSetting("lastTimerDurationSeconds", duration); timer.start(duration, selectedSubject, currentYear); if (settings.popoutAutoOpen) await openPopout(); } }}><Play size={20} fill="currentColor"/> {t("Start")}</button>
  </section><aside className="today-panel"><h2>{t("Today")}</h2><div className="metric-card"><span>{t("Focus time")}</span><strong>{formatDuration(summary.focusedDurationSeconds)}</strong></div><div className="metric-card"><span>{t("Sessions")}</span><strong>{summary.sessions.length}</strong></div><div className="metric-card"><span>{t("Current streak")}</span><strong>{t("{{count}} days", { count: currentStreak(sessions) })}</strong></div><h3>{t("Recent Sessions")}</h3>{recent.map((session) => <div className="recent-row" key={session.id}><span className="recent-dot"/><span>{session.subjectName}</span><strong>{formatDuration(session.focusedDurationSeconds)}</strong><small>{new Date(session.startTime).toLocaleTimeString(localeCode(), { hour: "2-digit", minute: "2-digit" })}</small></div>)}{!recent.length && <p className="recent-empty">{t("No completed Sessions yet.")}</p>}</aside></main>;
}
