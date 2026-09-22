import { Clock3, Database, Download, Info, MonitorCog, Palette, Play, Trash2 } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { isTauri } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { exportFullBackup } from "../importExport/exportBackup";
import { useSettings } from "../hooks/useSettings";
import { clearAllFocusData, formatLastBackup, hasActiveTimer, normaliseDuration, type AccentColour, type FocusSettings } from "../settings";
import focusIcon from "../assets/focus-icon.png";
import packageMetadata from "../../package.json";
import { useTranslation } from "react-i18next";

type Section = "General" | "Timer" | "Popout" | "Appearance" | "Data" | "About";
const sections: [Section, typeof MonitorCog][] = [["General", MonitorCog], ["Timer", Clock3], ["Popout", Play], ["Appearance", Palette], ["Data", Database], ["About", Info]];

export function SettingsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("General");
  const { settings, setSetting } = useSettings();
  return <main className="page settings-page"><header className="page-header"><div><h1>{t("Settings")}</h1><p>{t("Configure Focus for the way you study.")}</p></div></header><div className="settings-layout">
    <nav className="settings-nav" aria-label={t("Settings sections")}>{sections.map(([name, Icon]) => <button key={name} className={section === name ? "active" : ""} onClick={() => setSection(name)}><Icon />{t(name)}</button>)}</nav>
    <section className="settings-content">{section === "General" && <General settings={settings} setSetting={setSetting}/>} {section === "Timer" && <Timer settings={settings} setSetting={setSetting}/>} {section === "Popout" && <Popout settings={settings} setSetting={setSetting}/>} {section === "Appearance" && <Appearance settings={settings} setSetting={setSetting}/>} {section === "Data" && <Data settings={settings} setSetting={setSetting} onNavigate={onNavigate}/>} {section === "About" && <About/>}</section>
  </div></main>;
}

type SettingsProps = { settings: FocusSettings; setSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void> };

function SettingsHeader({ title, children }: { title: string; children: ReactNode }) { return <header className="settings-section-header"><h2>{title}</h2><p>{children}</p></header>; }
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <div className="setting-row"><div><strong>{label}</strong>{hint && <span>{hint}</span>}</div><div className="setting-control">{children}</div></div>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`settings-toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}><span/></button>; }

function General({ settings, setSetting }: SettingsProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(settings.displayName);
  useEffect(() => setName(settings.displayName), [settings.displayName]);
  const startup = async (enabled: boolean) => {
    try { if (isTauri()) await (enabled ? enable() : disable()); await setSetting("launchAtStartup", enabled); } catch { /* Keep the persisted value aligned with native registration. */ }
  };
  return <><SettingsHeader title={t("General")}>{t("Basic app settings.")}</SettingsHeader>
    <Row label={t("Language")}><select value={settings.language} onChange={(event) => void setSetting("language", event.target.value as FocusSettings["language"])}><option value="en">{t("English")}</option><option value="zh-CN">简体中文</option></select></Row>
    <Row label={t("Your name")} hint={t("Used in the sidebar greeting.")}><input className="settings-input" value={name} maxLength={60} placeholder={t("Your name")} onChange={(event) => setName(event.target.value)} onBlur={() => void setSetting("displayName", name.trim())}/></Row>
    <Row label={t("Start Focus maximized")}><Toggle label={t("Start Focus maximized")} checked={settings.startMaximized} onChange={(value) => void setSetting("startMaximized", value)}/></Row>
    <Row label={t("Launch Focus at Windows startup")}><Toggle label={t("Launch Focus at Windows startup")} checked={settings.launchAtStartup} onChange={(value) => void startup(value)}/></Row>
  </>;
}

function DurationEditor({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const { t } = useTranslation();
  const parts = { hours: Math.floor(value / 3600), minutes: Math.floor((value % 3600) / 60), seconds: value % 60 };
  const [draft, setDraft] = useState(parts);
  useEffect(() => setDraft(parts), [value]);
  const commit = () => { const next = normaliseDuration(draft.hours, draft.minutes, draft.seconds); setDraft(next); onChange(next.total); };
  return <div className="duration-editor"><label><input aria-label={t("Hours")} min="0" type="number" value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: Number(event.target.value) })} onBlur={commit}/><span>{t("Hours")}</span></label><b>:</b><label><input aria-label={t("Minutes")} min="0" type="number" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Number(event.target.value) })} onBlur={commit}/><span>{t("Minutes")}</span></label><b>:</b><label><input aria-label={t("Seconds")} min="0" type="number" value={draft.seconds} onChange={(event) => setDraft({ ...draft, seconds: Number(event.target.value) })} onBlur={commit}/><span>{t("Seconds")}</span></label></div>;
}

function Timer({ settings, setSetting }: SettingsProps) {
  const { t } = useTranslation();
  const notification = async (enabled: boolean) => {
    if (enabled && isTauri()) { const granted = await isPermissionGranted(); if (!granted && await requestPermission() !== "granted") return; }
    await setSetting("completionNotification", enabled);
  };
  return <><SettingsHeader title={t("Timer")}>{t("Behaviour during focus Sessions.")}</SettingsHeader>
    <Row label={t("New timer duration")}><select value={settings.timerDurationMode} onChange={(event) => void setSetting("timerDurationMode", event.target.value as FocusSettings["timerDurationMode"])}><option value="remember">{t("Remember last used")}</option><option value="fixed">{t("Fixed default")}</option></select></Row>
    {settings.timerDurationMode === "fixed" && <Row label={t("Fixed default duration")} hint={t("Values are normalized when you leave a field.")}><DurationEditor value={settings.fixedTimerDurationSeconds} onChange={(value) => void setSetting("fixedTimerDurationSeconds", value)}/></Row>}
    <Row label={t("Play sound when timer finishes")}><Toggle label={t("Play sound when timer finishes")} checked={settings.completionSound} onChange={(value) => void setSetting("completionSound", value)}/></Row>
    <Row label={t("Show notification when timer finishes")}><Toggle label={t("Show notification when timer finishes")} checked={settings.completionNotification} onChange={(value) => void notification(value)}/></Row>
  </>;
}

function Popout({ settings, setSetting }: SettingsProps) {
  const { t } = useTranslation();
  return <><SettingsHeader title={t("Popout")}>{t("Configure the floating timer window.")}</SettingsHeader>
    <Row label={t("Always on top by default")}><Toggle label={t("Always on top by default")} checked={settings.popoutAlwaysOnTop} onChange={(v) => void setSetting("popoutAlwaysOnTop", v)}/></Row>
    <Row label={t("Remember popout position")}><Toggle label={t("Remember popout position")} checked={settings.popoutRememberPosition} onChange={(v) => void setSetting("popoutRememberPosition", v)}/></Row>
    <div className="settings-subheading"><strong>{t("Corner docking")}</strong><span>{t("Dock the popout to a screen corner, with optional edge auto-hide.")}</span></div>
    <Row label={t("Enable corner docking")}><Toggle label={t("Enable corner docking")} checked={settings.popoutDockingEnabled} onChange={(v) => void setSetting("popoutDockingEnabled", v)}/></Row>
    <Row label={t("Default corner")}><select value={settings.popoutDockCorner} disabled={!settings.popoutDockingEnabled} onChange={(event) => void setSetting("popoutDockCorner", event.target.value as FocusSettings["popoutDockCorner"])}><option value="top-left">{t("Top Left")}</option><option value="top-right">{t("Top Right")}</option><option value="bottom-left">{t("Bottom Left")}</option><option value="bottom-right">{t("Bottom Right")}</option></select></Row>
    <Row label={t("Auto-hide when docked")}><Toggle label={t("Auto-hide when docked")} checked={settings.popoutDockAutoHide} onChange={(v) => void setSetting("popoutDockAutoHide", v)}/></Row>
    <Row label={t("Show Subject")}><Toggle label={t("Show Subject")} checked={settings.popoutShowSubject} onChange={(v) => void setSetting("popoutShowSubject", v)}/></Row>
    <Row label={t("Hide controls until hovered")}><Toggle label={t("Hide controls until hovered")} checked={settings.popoutHideControls} onChange={(v) => void setSetting("popoutHideControls", v)}/></Row>
    <Row label={t("Auto-hide controls after")}><select value={settings.popoutAutoHide} disabled={!settings.popoutHideControls} onChange={(event) => void setSetting("popoutAutoHide", event.target.value as FocusSettings["popoutAutoHide"])}><option value="500">0.5 sec</option><option value="1000">1 sec</option><option value="2000">2 sec</option><option value="never">{t("Never")}</option></select></Row>
    <Row label={t("Open popout automatically when a timer starts")}><Toggle label={t("Open popout automatically")} checked={settings.popoutAutoOpen} onChange={(v) => void setSetting("popoutAutoOpen", v)}/></Row>
    <Row label={t("Show popout in taskbar")}><Toggle label={t("Show popout in taskbar")} checked={settings.popoutShowInTaskbar} onChange={(v) => void setSetting("popoutShowInTaskbar", v)}/></Row>
    <Row label={t("Close popout when timer finishes")}><Toggle label={t("Close popout on completion")} checked={settings.popoutCloseOnCompletion} onChange={(v) => void setSetting("popoutCloseOnCompletion", v)}/></Row>
    <Row label={t("Transparency")} hint={`${settings.popoutTransparency}%`}><input aria-label={t("Transparency")} type="range" min="70" max="100" step="5" value={settings.popoutTransparency} onChange={(event) => void setSetting("popoutTransparency", Number(event.target.value))}/></Row>
  </>;
}

const accents: { name: string; value: AccentColour; color: string }[] = [{ name:"Orange",value:"orange",color:"#ff922b"},{name:"Blue",value:"blue",color:"#4da3ff"},{name:"Green",value:"green",color:"#4dd39a"},{name:"Purple",value:"purple",color:"#9c72f2"}];
function Appearance({ settings, setSetting }: SettingsProps) {
  const { t } = useTranslation();
  return <><SettingsHeader title={t("Appearance")}>{t("Customize the Focus interface.")}</SettingsHeader>
    <Row label={t("Theme")}><select disabled value="dark"><option>{t("Dark")}</option></select></Row>
    <Row label={t("Accent colour")}><div className="accent-options">{accents.map((accent) => <button key={accent.value} title={t(accent.name)} aria-label={t(accent.name)} className={settings.accentColour === accent.value ? "active" : ""} style={{ "--swatch": accent.color } as CSSProperties} onClick={() => void setSetting("accentColour", accent.value)}><span/></button>)}</div></Row>
    <Row label={t("UI scale")}><select value={settings.uiScale} onChange={(event) => void setSetting("uiScale", event.target.value as FocusSettings["uiScale"])}><option value="small">{t("Small")}</option><option value="medium">{t("Medium")}</option><option value="large">{t("Large")}</option></select></Row>
  </>;
}

function Data({ settings, setSetting, onNavigate }: SettingsProps & { onNavigate: (page: string) => void }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false); const [typed, setTyped] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const clear = async () => { setBusy(true); setError(""); try { await clearAllFocusData(); window.location.reload(); } catch (reason) { setError(t(reason instanceof Error ? reason.message : "Focus data could not be cleared.")); setBusy(false); } };
  const startClear = () => { setError(""); if (hasActiveTimer()) { setError(t("Finish or stop the current timer before clearing app data.")); return; } setConfirming(true); };
  return <><SettingsHeader title={t("Data")}>{t("Storage and data management.")}</SettingsHeader>
    <Row label={t("Storage")} hint={t("Your Focus data is stored locally on this device.")}><span className="storage-value">{t("On this device")}</span></Row>
    <Row label={t("Last full backup")} hint={settings.lastBackupAt ? formatLastBackup(settings.lastBackupAt, settings.language) : t("Never")}><button className="secondary-action" onClick={() => void exportFullBackup()}><Download/> {t("Back up now")}</button></Row>
    <Row label={t("Import / Export")} hint={t("Move data between devices or restore a backup.")}><button className="secondary-action" onClick={() => onNavigate("Import / Export")}>{t("Open Import / Export")}</button></Row>
    <div className="settings-subheading"><strong>{t("Deletion safety")}</strong><span>{t("Archive-first protection for Subjects and Academic Years.")}</span></div>
    <Row label={t("Allow deleting active Academic Years and Subjects")} hint={t("Permanent deletion still requires confirmation and removes related study data.")}><Toggle label={t("Allow deleting active Academic Years and Subjects")} checked={settings.allowDirectActiveDeletion} onChange={(value) => void setSetting("allowDirectActiveDeletion", value)}/></Row>
    <Row label={t("Clear all data")} hint={t("Permanently remove all local Focus data.")}><button className="danger-outline" onClick={startClear}><Trash2/> {t("Clear all data")}</button></Row>
    {error && <div className="notice notice--error">{error}</div>}
    {confirming && <div className="modal-backdrop" onMouseDown={() => setConfirming(false)}><section className="modal clear-data-modal" onMouseDown={(event) => event.stopPropagation()}><h2>{t("Clear all Focus data?")}</h2><p>{t("This permanently deletes all study history, Subjects, Academic Years, and Settings stored on this device.")}</p><p>{t("This cannot be undone without a backup. Type DELETE to continue.")}</p><input autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} aria-label={t("Type DELETE to confirm")}/><div className="modal-actions"><button onClick={() => setConfirming(false)}>{t("Cancel")}</button><button className="danger-action" disabled={typed !== "DELETE" || busy} onClick={() => void clear()}>{busy ? t("Clearing...") : t("Clear all data")}</button></div></section></div>}
  </>;
}

function About() {
  const { t } = useTranslation();
  const [version, setVersion] = useState(packageMetadata.version);
  useEffect(() => { if (isTauri()) void getVersion().then(setVersion).catch(() => undefined); }, []);
  return <div className="about-settings"><SettingsHeader title={t("About")}>{t("Application information.")}</SettingsHeader><div className="about-body">
    <div className="about-identity"><img src={focusIcon} alt="Focus"/><div><h3>Focus</h3><p>{t("Study. Track. Improve.")}</p><span>{t("Version {{version}}", { version })}</span></div></div>
    <section><h3>{t("About Focus")}</h3><p>{t("Focus is a local-first study timer and analytics app designed for long-term study tracking.")}</p></section>
    <section><h3>{t("Your data")}</h3><p>{t("Focus stores your study data locally on this device. Your data is not uploaded to a Focus account or cloud service.")}</p></section>
    <section><h3>{t("Application")}</h3><dl><div><dt>{t("Version")}</dt><dd>{version}</dd></div><div><dt>{t("Platform")}</dt><dd>Windows</dd></div><div><dt>{t("Data storage")}</dt><dd>{t("Local device")}</dd></div></dl></section>
    <section><h3>{t("Built with")}</h3><p>Tauri / React / TypeScript</p></section>
  </div></div>;
}
