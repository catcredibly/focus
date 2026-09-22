import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";

export function AutoHideTab() {
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();
  const active = settings.popoutDockingEnabled && settings.popoutDocked && settings.popoutDockAutoHide;
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

  return <main className="auto-hide-tab-window" data-accent={settings.accentColour} data-edge={settings.popoutAutoHideEdge}>
    <button aria-label={t("Open Focus")} onPointerEnter={reveal} onClick={reveal}><span/></button>
  </main>;
}
