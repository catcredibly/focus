import { lazy, Suspense, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Sidebar } from "./components/Sidebar";
import { TimerPage } from "./components/TimerPage";
import { PopoutTimer } from "./components/PopoutTimer";
import { AcademicYearsPage, HistoryPage, SubjectsPage } from "./components/ManagementPages";
import { ImportExportPage } from "./components/ImportExportPage";
import { SettingsPage } from "./components/SettingsPage";
import { useSettings } from "./hooks/useSettings";
import i18n from "./i18n";
import { useTranslation } from "react-i18next";
import { hasActiveTimer } from "./settings";

const AnalyticsPage = lazy(() => import("./components/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get("analyticsDemo") === "1" ? "Analytics" : "Timer");
  const isPopout = window.location.hash.includes("popout");
  const { settings, loaded } = useSettings();
  const { t } = useTranslation();
  const [closeWarning, setCloseWarning] = useState(false);
  const [secondInstanceWarning, setSecondInstanceWarning] = useState(false);

  useEffect(() => { void i18n.changeLanguage(settings.language); }, [settings.language]);

  useEffect(() => {
    if (!isTauri() || isPopout || !loaded) return;
    const window = getCurrentWindow();
    void (settings.startMaximized ? window.maximize() : window.unmaximize()).catch(() => undefined);
  }, [isPopout, loaded, settings.startMaximized]);

  useEffect(() => {
    if (!isTauri() || isPopout) return;
    let stopClose: (() => void) | undefined; let stopSecond: (() => void) | undefined;
    void getCurrentWindow().onCloseRequested((event) => {
      event.preventDefault();
      if (hasActiveTimer()) setCloseWarning(true);
      else void invoke("close_main_window");
    }).then((stop) => { stopClose = stop; });
    void listen("focus://second-instance", () => setSecondInstanceWarning(true)).then((stop) => { stopSecond = stop; });
    return () => { stopClose?.(); stopSecond?.(); };
  }, [isPopout]);

  if (isPopout) return <PopoutTimer />;

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`} data-accent={settings.accentColour} data-theme={settings.theme} data-scale={settings.uiScale}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} active={page} onNavigate={setPage} />
      {page === "Timer" && <TimerPage />}
      {page === "Analytics" && <Suspense fallback={<main className="page"><div className="analytics-loading">{t("Loading analytics...")}</div></main>}><AnalyticsPage /></Suspense>}
      {page === "Academic Years" && <AcademicYearsPage />}
      {page === "Subjects" && <SubjectsPage />}
      {page === "History" && <HistoryPage />}
      {page === "Import / Export" && <ImportExportPage onNavigate={setPage} />}
      {page === "Settings" && <SettingsPage onNavigate={setPage} />}
      {!['Timer', 'Analytics', 'Academic Years', 'Subjects', 'History', 'Import / Export', 'Settings'].includes(page) && <main className="page"><div className="empty-state"><h1>{t(page)}</h1><p>{t("Coming in a later milestone.")}</p></div></main>}
      {closeWarning && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true"><h2>{t("Close Focus while a timer is active?")}</h2><p>{t("The timer will be recovered the next time Focus opens. No Session will be finalized by closing the app.")}</p><div className="modal-actions"><button onClick={() => setCloseWarning(false)}>{t("Cancel")}</button><button className="danger-action" onClick={() => void invoke("close_main_window")}>{t("Close Focus")}</button></div></section></div>}
      {secondInstanceWarning && <div className="modal-backdrop"><section className="modal" role="alertdialog" aria-modal="true"><h2>{t("Focus is already running")}</h2><p>{t("The existing Focus window has been brought to the front.")}</p><div className="modal-actions"><button className="primary-action" onClick={() => setSecondInstanceWarning(false)}>{t("OK")}</button></div></section></div>}
    </div>
  );
}
