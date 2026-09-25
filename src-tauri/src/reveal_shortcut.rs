use std::{str::FromStr, sync::Mutex};
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[derive(Default)]
pub struct RevealShortcut(Mutex<Option<Shortcut>>);

fn parse(value: &str) -> Result<Option<Shortcut>, String> {
    if value.is_empty() { return Ok(None); }
    let parts: Vec<_> = value.split('+').collect();
    let main = parts.last().ok_or("Invalid shortcut")?;
    let modifiers = &parts[..parts.len() - 1];
    let allowed_modifiers = ["Ctrl", "Alt", "Shift"];
    let expected: Vec<_> = allowed_modifiers.iter().filter(|part| modifiers.contains(part)).copied().collect();
    let allowed_key = (main.len() == 4 && main.starts_with("Key") && main.as_bytes()[3].is_ascii_uppercase())
        || (main.len() == 6 && main.starts_with("Digit") && main.as_bytes()[5].is_ascii_digit())
        || ["Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Comma", "Period", "Slash", "Backquote"].contains(main);
    if modifiers.is_empty() || modifiers.len() > 3 || modifiers != expected || !allowed_key { return Err("Invalid shortcut".into()); }
    Shortcut::from_str(value).map(Some).map_err(|e| e.to_string())
}

// Async commands run away from the event-loop thread; the plugin dispatches its
// OS registration back onto that thread and waits for the actual result.
#[tauri::command]
pub async fn set_reveal_shortcut(window: tauri::WebviewWindow, shortcut: String) -> Result<(), String> {
    if window.label() != "main" { return Err("Only the main window can configure shortcuts".into()); }
    let app = window.app_handle();
    let state = app.state::<RevealShortcut>();
    let mut current = state.0.lock().map_err(|_| "Shortcut state unavailable")?;
    let next = parse(&shortcut)?;
    if *current == next { return Ok(()); }
    // Acquire the new registration first. A conflict must leave the working
    // shortcut intact; only after success can the old registration be removed.
    if let Some(next) = next {
        app.global_shortcut().on_shortcut(next, |app, _, event| {
            if event.state() == ShortcutState::Pressed {
                let _ = app.emit_to("timer", "focus://toggle-auto-hide", ());
            }
        }).map_err(|e| e.to_string())?;
    }
    if let Some(previous) = *current {
        if let Err(error) = app.global_shortcut().unregister(previous) {
            if let Some(next) = next { let _ = app.global_shortcut().unregister(next); }
            return Err(error.to_string());
        }
    }
    *current = next;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::parse;
    #[test]
    fn accepts_only_constrained_shortcuts() {
        for value in ["Alt+Backquote", "Ctrl+KeyF", "Alt+Digit7", "Shift+Slash", "Ctrl+Alt+Shift+BracketLeft"] { assert!(parse(value).is_ok(), "{value}"); }
        for key in 1..=12 { for prefix in ["", "Ctrl+", "Alt+", "Shift+", "Ctrl+Alt+", "Ctrl+Shift+", "Alt+Shift+", "Ctrl+Alt+Shift+"] { assert!(parse(&format!("{prefix}F{key}")).is_err()); } }
        for value in ["KeyF", "Digit7", "Slash", "F0", "F13", "Ctrl+Ctrl+Alt+Shift+F12", "Ctrl+Alt+Numpad7", "Ctrl+Ctrl+KeyF", "Meta+Ctrl+KeyF", "Alt+Ctrl+KeyF"] { assert!(parse(value).is_err(), "{value}"); }
    }
}
