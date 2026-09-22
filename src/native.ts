import { invoke, isTauri } from "@tauri-apps/api/core";
import type { FocusSettings } from "./settings";

export async function openTimerPopout(settings: FocusSettings) {
  if (!isTauri()) return;
  await invoke("open_timer_popout");
  await Promise.all([
    invoke("set_timer_always_on_top", { enabled: settings.popoutAlwaysOnTop }),
    invoke("set_timer_taskbar", { visible: settings.popoutShowInTaskbar }),
    settings.popoutRememberPosition && (!settings.popoutDockingEnabled || !settings.popoutDocked) && settings.popoutPositionX !== null && settings.popoutPositionY !== null
      ? invoke("set_timer_position", { x: settings.popoutPositionX, y: settings.popoutPositionY }) : Promise.resolve(),
  ]);
}
