use std::{sync::{Mutex, MutexGuard}, time::{SystemTime, UNIX_EPOCH}};
use tauri::{Emitter, Manager};

#[derive(Default)]
pub struct PopoutLifecycle(pub Mutex<PopoutState>);

#[derive(Default)]
pub struct PopoutState {
    pub session_id: Option<String>,
    pub deadline: Option<u64>,
    pub requested: bool,
    pub generation: u64,
}

impl PopoutState {
    pub fn active(&self) -> bool {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
        self.session_id.is_some() && self.deadline.is_none_or(|deadline| deadline > now)
    }
    pub fn allows(&self, generation: u64) -> bool {
        self.requested && self.active() && self.generation == generation
    }
}

pub fn lock(state: &PopoutLifecycle) -> Result<MutexGuard<'_, PopoutState>, String> {
    state.0.lock().map_err(|_| "Popout lifecycle unavailable".into())
}

fn hide_windows(app: &tauri::AppHandle) -> Result<(), String> {
    // Attempt every hide even if one window fails; a reveal tab must not outlive Close.
    let mut failure = None;
    for label in ["timer-menu", "timer-tab", "timer"] {
        if let Some(window) = app.get_webview_window(label) {
            if let Err(error) = window.hide() { failure = Some(error.to_string()); }
        }
    }
    let _ = app.emit("focus://popout-closed", ());
    failure.map_or(Ok(()), Err)
}

pub fn close(app: &tauri::AppHandle) -> Result<(), String> {
    let managed = app.state::<PopoutLifecycle>();
    let mut state = lock(&managed)?;
    // Visibility is transient, independent of persisted docking/auto-hide preferences.
    // Invalidate callbacks before hiding, and hold the guard through native operations.
    state.requested = false;
    state.generation = state.generation.wrapping_add(1);
    hide_windows(app)
}

#[tauri::command]
pub fn sync_popout_session(app: tauri::AppHandle, session_id: Option<String>, deadline: Option<u64>) -> Result<(), String> {
    let managed = app.state::<PopoutLifecycle>();
    let mut state = lock(&managed)?;
    let changed_session = state.session_id.is_some() && state.session_id != session_id;
    state.session_id = session_id;
    state.deadline = deadline;
    if changed_session || !state.active() {
        if state.requested || changed_session { state.generation = state.generation.wrapping_add(1); }
        state.requested = false;
        hide_windows(&app)?;
    }
    Ok(())
}

#[tauri::command]
pub fn prepare_timer_popout(app: tauri::AppHandle, session_id: Option<String>, deadline: Option<u64>) -> Result<u64, String> {
    sync_popout_session(app.clone(), session_id, deadline)?;
    let managed = app.state::<PopoutLifecycle>();
    let state = lock(&managed)?;
    Ok(state.generation)
}
