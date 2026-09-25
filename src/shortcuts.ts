import { invoke, isTauri } from "@tauri-apps/api/core";
import { loadSettings, saveSetting } from "./settings";

const punctuation: Record<string, string> = { Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Backquote: "`" };
type KeyInput = Pick<KeyboardEvent, "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;
export function captureShortcut(event: KeyInput): string | undefined {
  const modifiers = [event.ctrlKey && "Ctrl", event.altKey && "Alt", event.shiftKey && "Shift"].filter(Boolean);
  const functionKey = /^F([1-9]|1[0-2])$/.test(event.code);
  if (event.metaKey || (!functionKey && (modifiers.length < 1 || !(/^Key[A-Z]$|^Digit[0-9]$/.test(event.code) || event.code in punctuation)))) return;
  return [...modifiers, event.code].join("+");
}
export function shortcutLabel(shortcut: string) {
  return shortcut.split("+").map(part => punctuation[part] ?? part.replace(/^Key|^Digit/, "")).join(" + ");
}
let operation = Promise.resolve();
/** Serialize startup and recorder changes; persist only a registered combination. */
export function registerRevealShortcut(shortcut: string, persist = false) {
  const next = operation.catch(() => undefined).then(async () => {
    if (!isTauri()) throw new Error("Global shortcuts require the desktop app.");
    const previous = (await loadSettings()).popoutRevealShortcut;
    await invoke("set_reveal_shortcut", { shortcut });
    if (persist) {
      try { await saveSetting("popoutRevealShortcut", shortcut); }
      catch (error) { await invoke("set_reveal_shortcut", { shortcut: previous }); throw error; }
    }
  });
  operation = next;
  return next;
}
