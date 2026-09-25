import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listenForShortcut, registerRevealShortcut, shortcutLabel } from "../shortcuts";

export function ShortcutRecorder({ value, disabled = false }: { value: string; disabled?: boolean }) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const applying = useRef(false);
  useEffect(() => { if (disabled) setRecording(false); }, [disabled]);
  const apply = useCallback(async (next: string) => {
    if (applying.current) return;
    applying.current = true;
    setRecording(false); setBusy(true); setError("");
    try { await registerRevealShortcut(next, true); setRecording(false); }
    catch { setRecording(false); setError(t("That shortcut is unavailable. Your previous shortcut is unchanged.")); }
    finally { applying.current = false; setBusy(false); }
  }, [t]);
  useEffect(() => {
    if (!recording || disabled || busy) return;
    return listenForShortcut(next => { void apply(next); }, () => setRecording(false));
  }, [recording, disabled, busy, apply]);
  return <div className="shortcut-setting"><div className="shortcut-controls"><kbd className={`shortcut-value ${recording ? "is-recording" : ""}`} aria-live="polite">{recording ? t("Press shortcut…") : value ? shortcutLabel(value) : t("None")}</kbd><button className="secondary-action" disabled={disabled || busy} onClick={() => { setRecording(!recording); setError(""); }}>{t(recording ? "Press shortcut…" : "Change")}</button><button className="secondary-action" disabled={disabled || busy || !value} onClick={() => void apply("")}>{t("Clear")}</button></div>{error && <small className="field-error" role="alert">{error}</small>}</div>;
}
