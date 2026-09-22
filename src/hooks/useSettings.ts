import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSetting, type FocusSettings } from "../settings";

export function useSettings() {
  const stored = useLiveQuery(() => loadSettings(), []);
  const settings = stored ?? DEFAULT_SETTINGS;
  const setSetting = useCallback(<K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => saveSetting(key, value), []);
  return {
    settings,
    loaded: stored !== undefined,
    setSetting,
  };
}
