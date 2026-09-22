import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import { defaultEdgeForCorner } from "../popoutPlacement";
import type { DockCorner, FocusSettings } from "../settings";

export function PopoutMenu() {
  const { t } = useTranslation();
  const { settings, setSetting } = useSettings();
  const [view, setView] = useState<"more" | "dock">("more");
  const [displays, setDisplays] = useState<{ id: string; label: string }[]>([]);
  const docked = settings.popoutDockingEnabled && settings.popoutDocked;
  const corners: [DockCorner, string][] = [["top-left", "Top Left"], ["top-right", "Top Right"], ["bottom-left", "Bottom Left"], ["bottom-right", "Bottom Right"]];
  const close = () => void invoke("hide_timer_menu");

  useEffect(() => {
    void invoke<{ id: string; label: string }[]>("list_monitor_work_areas").then(setDisplays).catch(() => undefined);
    let stop: (() => void) | undefined;
    void getCurrentWindow().onFocusChanged(({ payload }) => { if (!payload) close(); }).then((value) => { stop = value; });
    return () => stop?.();
  }, []);

  const dock = async (corner: DockCorner) => {
    await Promise.all([
      setSetting("popoutDockingEnabled", true), setSetting("popoutDocked", true), setSetting("popoutDockCorner", corner),
      setSetting("popoutAutoHideEdge", defaultEdgeForCorner(corner)), setSetting("popoutAutoHideOffset", corner.startsWith("top") ? 0 : 1),
    ]);
    close();
  };

  return <main className="popout-menu-window" data-accent={settings.accentColour} data-theme={settings.theme}>
    {view === "more" ? <>
      <button onClick={async () => { const next = !settings.popoutAlwaysOnTop; await setSetting("popoutAlwaysOnTop", next); await invoke("set_timer_always_on_top", { enabled: next }); close(); }}>{t("Always on top")} <span>{t(settings.popoutAlwaysOnTop ? "On" : "Off")}</span></button>
      {docked && <button onClick={async () => {
        await setSetting("popoutDocked", false);
        await invoke("restore_timer_floating_position", { x: settings.popoutPositionX, y: settings.popoutPositionY });
        close();
      }}>{t("Undock")}</button>}
      <button onClick={() => setView("dock")}>{t("Dock to")}<ChevronRight/></button>
      <label className="popout-menu-select">{t("Monitor")}<select title={displays.find((display) => display.id === settings.popoutDockMonitor)?.label} value={settings.popoutDockMonitor} onChange={async (event) => { await setSetting("popoutDockMonitor", event.target.value as FocusSettings["popoutDockMonitor"]); close(); }}><option value="current">{t("Current monitor")}</option>{displays.map((display) => <option value={display.id} key={display.id}>{display.label}</option>)}</select></label>
      {docked && <button onClick={async () => { await setSetting("popoutDockAutoHide", !settings.popoutDockAutoHide); close(); }}>{t("Auto-hide")} <span>{t(settings.popoutDockAutoHide ? "On" : "Off")}</span></button>}
      <button onClick={() => { close(); void invoke("focus_main_window"); }}>{t("Open Focus")}</button>
      <button onClick={() => { close(); void invoke("hide_timer_popout"); }}>{t("Close popout")}</button>
    </> : <>
      <button onClick={() => setView("more")}><ChevronLeft/>{t("Dock to")}</button>
      {corners.map(([corner, label]) => <button key={corner} onClick={() => void dock(corner)}>{t(label)}{docked && settings.popoutDockCorner === corner ? <Check/> : null}</button>)}
    </>}
  </main>;
}
