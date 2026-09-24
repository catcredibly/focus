import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSetting, type FocusSettings } from "../settings";

// Match the early HTML paint while IndexedDB loads; this is only a theme hint,
// never a replacement for persisted settings or a reason to delay rendering.
const initialSettings: FocusSettings = {
  ...DEFAULT_SETTINGS,
  theme: typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark",
};

export function useSettings() {
  const stored = useLiveQuery(() => loadSettings(), []);
  const settings = stored ?? initialSettings;
  const setSetting = useCallback(<K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => saveSetting(key, value), []);
  return {
    settings,
    loaded: stored !== undefined,
    setSetting,
  };
}
