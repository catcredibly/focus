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

type Section = "General" | "Timer" | "Popout" | "Appearance" | "Data" | "About";
const sections: [Section, typeof MonitorCog][] = [["General", MonitorCog], ["Timer", Clock3], ["Popout", Play], ["Appearance", Palette], ["Data", Database], ["About", Info]];

export function SettingsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [section, setSection] = useState<Section>("General");
  const { settings, setSetting } = useSettings();
  return <main className="page settings-page"><header className="page-header"><div><h1>Settings</h1><p>Configure Focus for the way you study.</p></div></header><div className="settings-layout">
    <nav className="settings-nav" aria-label="Settings sections">{sections.map(([name, Icon]) => <button key={name} className={section === name ? "active" : ""} onClick={() => setSection(name)}><Icon />{name}</button>)}</nav>
    <section className="settings-content">{section === "General" && <General settings={settings} setSetting={setSetting}/>} {section === "Timer" && <Timer settings={settings} setSetting={setSetting}/>} {section === "Popout" && <Popout settings={settings} setSetting={setSetting}/>} {section === "Appearance" && <Appearance settings={settings} setSetting={setSetting}/>} {section === "Data" && <Data settings={settings} setSetting={setSetting} onNavigate={onNavigate}/>} {section === "About" && <About/>}</section>
  </div></main>;
}

type SettingsProps = { settings: FocusSettings; setSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void> };

function SettingsHeader({ title, children }: { title: string; children: ReactNode }) { return <header className="settings-section-header"><h2>{title}</h2><p>{children}</p></header>; }
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <div className="setting-row"><div><strong>{label}</strong>{hint && <span>{hint}</span>}</div><div className="setting-control">{children}</div></div>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`settings-toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}><span/></button>; }

function General({ settings, setSetting }: SettingsProps) {
  const [name, setName] = useState(settings.displayName);
  useEffect(() => setName(settings.displayName), [settings.displayName]);
  const startup = async (enabled: boolean) => {
    try { if (isTauri()) await (enabled ? enable() : disable()); await setSetting("launchAtStartup", enabled); } catch { /* Keep the persisted value aligned with native registration. */ }
  };
  return <><SettingsHeader title="General">Basic app settings.</SettingsHeader>
    <Row label="Your name" hint="Used in the sidebar greeting."><input className="settings-input" value={name} maxLength={60} placeholder="Your name" onChange={(event) => setName(event.target.value)} onBlur={() => void setSetting("displayName", name.trim())}/></Row>
    <Row label="Start Focus maximized"><Toggle label="Start Focus maximized" checked={settings.startMaximized} onChange={(value) => void setSetting("startMaximized", value)}/></Row>
    <Row label="Launch Focus at Windows startup"><Toggle label="Launch Focus at Windows startup" checked={settings.launchAtStartup} onChange={(value) => void startup(value)}/></Row>
  </>;
}

function DurationEditor({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const parts = { hours: Math.floor(value / 3600), minutes: Math.floor((value % 3600) / 60), seconds: value % 60 };
  const [draft, setDraft] = useState(parts);
  useEffect(() => setDraft(parts), [value]);
  const commit = () => { const next = normaliseDuration(draft.hours, draft.minutes, draft.seconds); setDraft(next); onChange(next.total); };
  return <div className="duration-editor"><label><input aria-label="Hours" min="0" type="number" value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: Number(event.target.value) })} onBlur={commit}/><span>Hours</span></label><b>:</b><label><input aria-label="Minutes" min="0" type="number" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Number(event.target.value) })} onBlur={commit}/><span>Minutes</span></label><b>:</b><label><input aria-label="Seconds" min="0" type="number" value={draft.seconds} onChange={(event) => setDraft({ ...draft, seconds: Number(event.target.value) })} onBlur={commit}/><span>Seconds</span></label></div>;
}

function Timer({ settings, setSetting }: SettingsProps) {
  const notification = async (enabled: boolean) => {
    if (enabled && isTauri()) { const granted = await isPermissionGranted(); if (!granted && await requestPermission() !== "granted") return; }
    await setSetting("completionNotification", enabled);
  };
  return <><SettingsHeader title="Timer">Behaviour during focus Sessions.</SettingsHeader>
    <Row label="New timer duration"><select value={settings.timerDurationMode} onChange={(event) => void setSetting("timerDurationMode", event.target.value as FocusSettings["timerDurationMode"])}><option value="remember">Remember last used</option><option value="fixed">Fixed default</option></select></Row>
    {settings.timerDurationMode === "fixed" && <Row label="Fixed default duration" hint="Values are normalized when you leave a field."><DurationEditor value={settings.fixedTimerDurationSeconds} onChange={(value) => void setSetting("fixedTimerDurationSeconds", value)}/></Row>}
    <Row label="Play sound when timer finishes"><Toggle label="Play sound when timer finishes" checked={settings.completionSound} onChange={(value) => void setSetting("completionSound", value)}/></Row>
    <Row label="Show notification when timer finishes"><Toggle label="Show notification when timer finishes" checked={settings.completionNotification} onChange={(value) => void notification(value)}/></Row>
  </>;
}

function Popout({ settings, setSetting }: SettingsProps) {
  return <><SettingsHeader title="Popout">Configure the floating timer window.</SettingsHeader>
    <Row label="Always on top by default"><Toggle label="Always on top by default" checked={settings.popoutAlwaysOnTop} onChange={(v) => void setSetting("popoutAlwaysOnTop", v)}/></Row>
    <Row label="Remember popout position"><Toggle label="Remember popout position" checked={settings.popoutRememberPosition} onChange={(v) => void setSetting("popoutRememberPosition", v)}/></Row>
    <Row label="Show Subject"><Toggle label="Show Subject" checked={settings.popoutShowSubject} onChange={(v) => void setSetting("popoutShowSubject", v)}/></Row>
    <Row label="Hide controls until hovered"><Toggle label="Hide controls until hovered" checked={settings.popoutHideControls} onChange={(v) => void setSetting("popoutHideControls", v)}/></Row>
    <Row label="Auto-hide controls after"><select value={settings.popoutAutoHide} disabled={!settings.popoutHideControls} onChange={(event) => void setSetting("popoutAutoHide", event.target.value as FocusSettings["popoutAutoHide"])}><option value="500">0.5 sec</option><option value="1000">1 sec</option><option value="2000">2 sec</option><option value="never">Never</option></select></Row>
    <Row label="Open popout automatically when a timer starts"><Toggle label="Open popout automatically" checked={settings.popoutAutoOpen} onChange={(v) => void setSetting("popoutAutoOpen", v)}/></Row>
    <Row label="Show popout in taskbar"><Toggle label="Show popout in taskbar" checked={settings.popoutShowInTaskbar} onChange={(v) => void setSetting("popoutShowInTaskbar", v)}/></Row>
    <Row label="Close popout when timer finishes"><Toggle label="Close popout on completion" checked={settings.popoutCloseOnCompletion} onChange={(v) => void setSetting("popoutCloseOnCompletion", v)}/></Row>
    <Row label="Transparency" hint={`${settings.popoutTransparency}%`}><input aria-label="Popout transparency" type="range" min="70" max="100" step="5" value={settings.popoutTransparency} onChange={(event) => void setSetting("popoutTransparency", Number(event.target.value))}/></Row>
  </>;
}

const accents: { name: string; value: AccentColour; color: string }[] = [{ name:"Orange",value:"orange",color:"#ff922b"},{name:"Blue",value:"blue",color:"#4da3ff"},{name:"Green",value:"green",color:"#4dd39a"},{name:"Purple",value:"purple",color:"#9c72f2"}];
function Appearance({ settings, setSetting }: SettingsProps) {
  return <><SettingsHeader title="Appearance">Customize the Focus interface.</SettingsHeader>
    <Row label="Theme"><select disabled value="dark"><option>Dark</option></select></Row>
    <Row label="Accent colour"><div className="accent-options">{accents.map((accent) => <button key={accent.value} title={accent.name} aria-label={accent.name} className={settings.accentColour === accent.value ? "active" : ""} style={{ "--swatch": accent.color } as CSSProperties} onClick={() => void setSetting("accentColour", accent.value)}><span/></button>)}</div></Row>
    <Row label="UI scale"><select value={settings.uiScale} onChange={(event) => void setSetting("uiScale", event.target.value as FocusSettings["uiScale"])}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></Row>
  </>;
}

function Data({ settings, setSetting, onNavigate }: SettingsProps & { onNavigate: (page: string) => void }) {
  const [confirming, setConfirming] = useState(false); const [typed, setTyped] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const clear = async () => { setBusy(true); setError(""); try { await clearAllFocusData(); window.location.reload(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Focus data could not be cleared."); setBusy(false); } };
  const startClear = () => { setError(""); if (hasActiveTimer()) { setError("Finish or stop the current timer before clearing app data."); return; } setConfirming(true); };
  return <><SettingsHeader title="Data">Storage and data management.</SettingsHeader>
    <Row label="Storage" hint="Your Focus data is stored locally on this device."><span className="storage-value">On this device</span></Row>
    <Row label="Last full backup" hint={formatLastBackup(settings.lastBackupAt)}><button className="secondary-action" onClick={() => void exportFullBackup()}><Download/> Back up now</button></Row>
    <Row label="Import / Export" hint="Move data between devices or restore a backup."><button className="secondary-action" onClick={() => onNavigate("Import / Export")}>Open Import / Export</button></Row>
    <div className="settings-subheading"><strong>Deletion safety</strong><span>Archive-first protection for Subjects and Academic Years.</span></div>
    <Row label="Allow deleting active Academic Years and Subjects" hint="Permanent deletion still requires confirmation and removes related study data."><Toggle label="Allow deleting active Academic Years and Subjects" checked={settings.allowDirectActiveDeletion} onChange={(value) => void setSetting("allowDirectActiveDeletion", value)}/></Row>
    <Row label="Clear all data" hint="Permanently remove all local Focus data."><button className="danger-outline" onClick={startClear}><Trash2/> Clear all data</button></Row>
    {error && <div className="notice notice--error">{error}</div>}
    {confirming && <div className="modal-backdrop" onMouseDown={() => setConfirming(false)}><section className="modal clear-data-modal" onMouseDown={(event) => event.stopPropagation()}><h2>Clear all Focus data?</h2><p>This permanently deletes all study history, Subjects, Academic Years, and Settings stored on this device.</p><p>This cannot be undone without a backup. Type <strong>DELETE</strong> to continue.</p><input autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} aria-label="Type DELETE to confirm"/><div className="modal-actions"><button onClick={() => setConfirming(false)}>Cancel</button><button className="danger-action" disabled={typed !== "DELETE" || busy} onClick={() => void clear()}>{busy ? "Clearing..." : "Clear all data"}</button></div></section></div>}
  </>;
}

function About() {
  const [version, setVersion] = useState(packageMetadata.version);
  useEffect(() => { if (isTauri()) void getVersion().then(setVersion).catch(() => undefined); }, []);
  return <div className="about-settings"><SettingsHeader title="About">Application information.</SettingsHeader><div className="about-body">
    <div className="about-identity"><img src={focusIcon} alt="Focus"/><div><h3>Focus</h3><p>Study. Track. Improve.</p><span>Version {version}</span></div></div>
    <section><h3>About Focus</h3><p>Focus is a local-first study timer and analytics app designed for long-term study tracking.</p></section>
    <section><h3>Your data</h3><p>Focus stores your study data locally on this device. Your data is not uploaded to a Focus account or cloud service.</p></section>
    <section><h3>Application</h3><dl><div><dt>Version</dt><dd>{version}</dd></div><div><dt>Platform</dt><dd>Windows</dd></div><div><dt>Data storage</dt><dd>Local device</dd></div></dl></section>
    <section><h3>Built with</h3><p>Tauri / React / TypeScript</p></section>
  </div></div>;
}
