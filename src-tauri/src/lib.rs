use tauri::Manager;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkArea {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[cfg(windows)]
fn timer_work_area(window: &tauri::WebviewWindow) -> Result<WorkArea, String> {
    use windows_sys::Win32::Foundation::{POINT, RECT};
    use windows_sys::Win32::Graphics::Gdi::{GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST};

    let position = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let point = POINT {
        x: position.x + size.width as i32 / 2,
        y: position.y + size.height as i32 / 2,
    };
    unsafe {
        let monitor = MonitorFromPoint(point, MONITOR_DEFAULTTONEAREST);
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            rcMonitor: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            rcWork: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            dwFlags: 0,
        };
        if GetMonitorInfoW(monitor, &mut info) == 0 {
            return Err("Unable to read the Windows monitor work area".into());
        }
        Ok(WorkArea {
            x: info.rcWork.left,
            y: info.rcWork.top,
            width: (info.rcWork.right - info.rcWork.left) as u32,
            height: (info.rcWork.bottom - info.rcWork.top) as u32,
        })
    }
}

#[cfg(not(windows))]
fn timer_work_area(window: &tauri::WebviewWindow) -> Result<WorkArea, String> {
    let monitor = window.current_monitor().map_err(|e| e.to_string())?
        .ok_or_else(|| "No monitor is available".to_string())?;
    Ok(WorkArea {
        x: monitor.position().x,
        y: monitor.position().y,
        width: monitor.size().width,
        height: monitor.size().height,
    })
}

#[tauri::command]
fn open_timer_popout(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    Err("The configured timer window is unavailable".into())
}

#[tauri::command]
fn set_timer_always_on_top(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window
            .set_always_on_top(enabled)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_timer_taskbar(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window
            .set_skip_taskbar(!visible)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_timer_position(app: tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        let monitors = window.available_monitors().map_err(|e| e.to_string())?;
        let visible = monitors.iter().any(|monitor| {
            let position = monitor.position();
            let size = monitor.size();
            x >= position.x
                && y >= position.y
                && x < position.x + size.width as i32
                && y < position.y + size.height as i32
        });
        let position = if visible {
            tauri::PhysicalPosition::new(x, y)
        } else if let Some(monitor) = window.primary_monitor().map_err(|e| e.to_string())? {
            tauri::PhysicalPosition::new(monitor.position().x + 32, monitor.position().y + 32)
        } else {
            tauri::PhysicalPosition::new(32, 32)
        };
        window.set_position(position).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_timer_position_unchecked(app: tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window
            .set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_timer_work_area(app: tauri::AppHandle) -> Result<WorkArea, String> {
    let window = app
        .get_webview_window("timer")
        .ok_or_else(|| "The configured timer window is unavailable".to_string())?;
    timer_work_area(&window)
}

#[tauri::command]
fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_timer_popout(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None,
            ))?;
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_timer_popout,
            set_timer_always_on_top,
            set_timer_taskbar,
            set_timer_position,
            set_timer_position_unchecked,
            get_timer_work_area,
            focus_main_window,
            hide_timer_popout
        ])
        .on_window_event(|window, event| {
            if window.label() == "timer" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Focus");
}
