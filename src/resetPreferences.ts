import { isTauri } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { DEFAULT_SETTINGS, resetAllSettings } from "./settings";
import { registerRevealShortcut } from "./shortcuts";

/** Register first, then commit preferences; roll native changes back on failure. */
export async function resetPreferences() {
  if (!isTauri()) return resetAllSettings();
  await registerRevealShortcut(DEFAULT_SETTINGS.popoutRevealShortcut, async () => {
    const wasEnabled = await isEnabled();
    await disable();
    try { await resetAllSettings(); }
    catch (error) { if (wasEnabled) await enable(); throw error; }
  });
}
