import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { captureShortcut, registerRevealShortcut, shortcutLabel } from "../shortcuts";

export function ShortcutRecorder({ value, disabled = false }: { value: string; disabled?: boolean }) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (disabled) setRecording(false); }, [disabled]);
  const apply = async (next: string) => {
    setBusy(true); setError("");
    try { await registerRevealShortcut(next, true); setRecording(false); }
    catch { setRecording(false); setError(t("That shortcut is unavailable. Your previous shortcut is unchanged.")); }
    finally { setBusy(false); }
  };
  return <div className="shortcut-setting"><div className="shortcut-controls"><kbd className={`shortcut-value ${recording ? "is-recording" : ""}`} aria-live="polite">{recording ? t("Press shortcut…") : value ? shortcutLabel(value) : t("None")}</kbd><button className="secondary-action" disabled={disabled || busy} onClick={() => { setRecording(!recording); setError(""); }} onBlur={() => { if (!busy) setRecording(false); }} onKeyDown={event => {
    if (disabled || !recording || busy) return;
    if (event.key === "Escape") { event.preventDefault(); setRecording(false); return; }
    if (event.key === "Tab") { setRecording(false); return; }
    event.preventDefault(); event.stopPropagation();
    const next = captureShortcut(event);
    if (next && !event.repeat) void apply(next);
  }}>{t(recording ? "Press shortcut…" : "Change")}</button><button className="secondary-action" disabled={disabled || busy || !value} onClick={() => void apply("")}>{t("Clear")}</button></div>{error && <small className="field-error" role="alert">{error}</small>}</div>;
}
