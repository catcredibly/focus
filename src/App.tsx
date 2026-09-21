import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TimerPage } from "./components/TimerPage";
import { PopoutTimer } from "./components/PopoutTimer";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const isPopout = window.location.hash.includes("popout");

  if (isPopout) return <PopoutTimer />;

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <TimerPage />
    </div>
  );
}
