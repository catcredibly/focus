import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TimerPage } from "./components/TimerPage";
import { PopoutTimer } from "./components/PopoutTimer";
import { AcademicYearsPage, HistoryPage, SubjectsPage } from "./components/ManagementPages";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("Timer");
  const isPopout = window.location.hash.includes("popout");

  if (isPopout) return <PopoutTimer />;

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} active={page} onNavigate={setPage} />
      {page === "Timer" && <TimerPage />}
      {page === "Academic Years" && <AcademicYearsPage />}
      {page === "Subjects" && <SubjectsPage />}
      {page === "History" && <HistoryPage />}
      {!['Timer', 'Academic Years', 'Subjects', 'History'].includes(page) && <main className="page"><div className="empty-state"><h1>{page}</h1><p>Coming in a later milestone.</p></div></main>}
    </div>
  );
}
