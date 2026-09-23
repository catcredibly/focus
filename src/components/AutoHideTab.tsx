import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";

export function AutoHideTab() {
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();
  const active = settings.popoutDockAutoHide;
  const [edge, setEdge] = useState(settings.popoutAutoHideEdge);
  const wasActive = useRef(false);
  const revealing = useRef(false);
  const reveal = () => {
    if (revealing.current) return;
    revealing.current = true;
    void invoke("request_timer_reveal").finally(() => window.setTimeout(() => { revealing.current = false; }, 500));
  };

  useEffect(() => {
    if (!loaded) return;
    if (wasActive.current && !active) void invoke("cancel_timer_auto_hide");
    wasActive.current = active;
  }, [active, loaded]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    void getCurrentWindow().listen<string>("focus://auto-hide-tab-edge", ({ payload }) => setEdge(payload as typeof edge)).then((value) => { stop = value; });
    return () => stop?.();
  }, []);
  useEffect(() => {
    if (loaded) void invoke("resize_timer_auto_hide_tab", { edge, tabSize: settings.popoutAutoHideTabSize });
  }, [edge, loaded, settings.popoutAutoHideTabSize]);

  return <main className="auto-hide-tab-window" data-accent={settings.accentColour} data-edge={edge} data-size={settings.popoutAutoHideTabSize}>
    <button aria-label={t("Open Focus")} onPointerEnter={reveal} onClick={reveal}>{settings.popoutAutoHideShowAccent && <span/>}</button>
  </main>;
}
