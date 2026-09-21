import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock3,
  History,
  Import,
  Menu,
  Settings,
} from "lucide-react";

const items = [
  [Clock3, "Timer"],
  [BarChart3, "Analytics"],
  [History, "History"],
  [BookOpen, "Subjects"],
  [CalendarDays, "Academic Years"],
  [Import, "Import / Export"],
  [Settings, "Settings"],
] as const;

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="brand-row">
        <div className="brand-mark">◉</div>
        {!collapsed && (
          <div>
            <div className="brand-name">Focus</div>
            <div className="brand-subtitle">Study. Track. Improve.</div>
          </div>
        )}
        <button className="icon-button sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
      </div>

      <nav className="nav-list">
        {items.map(([Icon, label], index) => (
          <button key={label} className={`nav-item ${index === 0 ? "nav-item--active" : ""}`}>
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-greeting">
          <div className="moon">◒</div>
          <div>
            <div>Good evening, Daniel</div>
            <span>Stay consistent.</span>
          </div>
        </div>
      )}
    </aside>
  );
}
