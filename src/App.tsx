import { lazy, Suspense, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TimerPage } from "./components/TimerPage";
import { PopoutTimer } from "./components/PopoutTimer";
import { AcademicYearsPage, HistoryPage, SubjectsPage } from "./components/ManagementPages";
import { ImportExportPage } from "./components/ImportExportPage";

const AnalyticsPage = lazy(() => import("./components/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get("analyticsDemo") === "1" ? "Analytics" : "Timer");
  const isPopout = window.location.hash.includes("popout");

  if (isPopout) return <PopoutTimer />;

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} active={page} onNavigate={setPage} />
      {page === "Timer" && <TimerPage />}
      {page === "Analytics" && <Suspense fallback={<main className="page"><div className="analytics-loading">Loading analytics...</div></main>}><AnalyticsPage /></Suspense>}
      {page === "Academic Years" && <AcademicYearsPage />}
      {page === "Subjects" && <SubjectsPage />}
      {page === "History" && <HistoryPage />}
      {page === "Import / Export" && <ImportExportPage onNavigate={setPage} />}
      {!['Timer', 'Analytics', 'Academic Years', 'Subjects', 'History', 'Import / Export'].includes(page) && <main className="page"><div className="empty-state"><h1>{page}</h1><p>Coming in a later milestone.</p></div></main>}
    </div>
  );
}
