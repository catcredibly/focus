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
import { useSettings } from "../hooks/useSettings";
import { useTranslation } from "react-i18next";

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
  active: string;
  onNavigate: (page: string) => void;
};

export function Sidebar({ collapsed, onToggle, active, onNavigate }: Props) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "Good morning{{name}}" : hour < 18 ? "Good afternoon{{name}}" : "Good evening{{name}}";
  const greetingName = settings.displayName.trim() ? `${settings.language === "zh-CN" ? "，" : ", "}${settings.displayName.trim()}` : "";
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="brand-row">
        <span className="brand-mark" aria-hidden="true"/>
        {!collapsed && (
          <div>
            <div className="brand-name">Focus</div>
            <div className="brand-subtitle">{t("Time well spent.")}</div>
          </div>
        )}
        <button className="icon-button sidebar-toggle" onClick={onToggle} aria-label={t("Toggle sidebar")}>
          <Menu size={18} />
        </button>
      </div>

      <nav className="nav-list">
        {items.map(([Icon, label]) => (
          <button key={label} onClick={() => onNavigate(label)} className={`nav-item ${active === label ? "nav-item--active" : ""}`}>
            <Icon size={20} />
            {!collapsed && <span>{t(label)}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-greeting">
          <div className="moon">◒</div>
          <div>
            <div>{t(greetingKey, { name: greetingName })}</div>
            <span className="greeting-subtitle" title={settings.sidebarSubtitle || t("Time well spent.")}><b>{settings.sidebarSubtitle || t("Time well spent.")}</b></span>
          </div>
        </div>
      )}
    </aside>
  );
}
