use serde::Serialize;
use tauri::{Emitter, Manager};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkArea {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MonitorWorkArea {
    id: String,
    label: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[cfg(windows)]
fn work_area_at_point(x: i32, y: i32) -> Result<WorkArea, String> {
    use windows_sys::Win32::Foundation::{POINT, RECT};
    use windows_sys::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST,
    };

    let point = POINT { x, y };
    unsafe {
        let monitor = MonitorFromPoint(point, MONITOR_DEFAULTTONEAREST);
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            rcMonitor: RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            rcWork: RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
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

#[cfg(windows)]
fn timer_work_area(
    window: &tauri::WebviewWindow,
    monitor_id: Option<&str>,
) -> Result<WorkArea, String> {
    if let Some(index) = monitor_id
        .and_then(|value| value.strip_prefix("display:"))
        .and_then(|value| value.parse::<usize>().ok())
    {
        let monitors = window.available_monitors().map_err(|e| e.to_string())?;
        if let Some(monitor) = monitors.get(index) {
            return work_area_at_point(
                monitor.position().x + monitor.size().width as i32 / 2,
                monitor.position().y + monitor.size().height as i32 / 2,
            );
        }
    }
    let position = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    work_area_at_point(
        position.x + size.width as i32 / 2,
        position.y + size.height as i32 / 2,
    )
}

#[cfg(not(windows))]
fn timer_work_area(
    window: &tauri::WebviewWindow,
    monitor_id: Option<&str>,
) -> Result<WorkArea, String> {
    let explicit = monitor_id
        .and_then(|value| value.strip_prefix("display:"))
        .and_then(|value| value.parse::<usize>().ok())
        .and_then(|index| window.available_monitors().ok()?.get(index).cloned());
    let monitor = explicit
        .or(window.current_monitor().map_err(|e| e.to_string())?)
        .ok_or_else(|| "No monitor is available".to_string())?;
    Ok(WorkArea {
        x: monitor.position().x,
        y: monitor.position().y,
        width: monitor.size().width,
        height: monitor.size().height,
    })
}

#[tauri::command]
fn list_monitor_work_areas(app: tauri::AppHandle) -> Result<Vec<MonitorWorkArea>, String> {
    let window = app
        .get_webview_window("timer")
        .or_else(|| app.get_webview_window("main"))
        .ok_or_else(|| "No Focus window is available".to_string())?;
    window
        .available_monitors()
        .map_err(|e| e.to_string())?
        .iter()
        .enumerate()
        .map(|(index, monitor)| {
            #[cfg(windows)]
            let area = work_area_at_point(
                monitor.position().x + monitor.size().width as i32 / 2,
                monitor.position().y + monitor.size().height as i32 / 2,
            )?;
            #[cfg(not(windows))]
            let area = WorkArea {
                x: monitor.position().x,
                y: monitor.position().y,
                width: monitor.size().width,
                height: monitor.size().height,
            };
            Ok(MonitorWorkArea {
                id: format!("display:{}", index),
                label: monitor
                    .name()
                    .map(|name| format!("Display {} - {}", index + 1, name))
                    .unwrap_or_else(|| format!("Display {}", index + 1)),
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height,
            })
        })
        .collect()
}

fn clamped_timer_position(window: &tauri::WebviewWindow, x: i32, y: i32) -> Result<tauri::PhysicalPosition<i32>, String> {
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    let requested_monitor = monitors.iter().find(|monitor| {
        let position = monitor.position();
        let size = monitor.size();
        x >= position.x && y >= position.y && x < position.x + size.width as i32 && y < position.y + size.height as i32
    }).cloned();
    let monitor = requested_monitor.clone()
        .or(window.current_monitor().map_err(|e| e.to_string())?)
        .or(window.primary_monitor().map_err(|e| e.to_string())?)
        .ok_or_else(|| "No monitor is available".to_string())?;
    let desired = if requested_monitor.is_some() { (x, y) } else { (monitor.position().x + 32, monitor.position().y + 32) };
    #[cfg(windows)]
    let area = work_area_at_point(monitor.position().x + monitor.size().width as i32 / 2, monitor.position().y + monitor.size().height as i32 / 2)?;
    #[cfg(not(windows))]
    let area = WorkArea { x: monitor.position().x, y: monitor.position().y, width: monitor.size().width, height: monitor.size().height };
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let max_x = (area.x + area.width as i32 - size.width as i32).max(area.x);
    let max_y = (area.y + area.height as i32 - size.height as i32).max(area.y);
    Ok(tauri::PhysicalPosition::new(desired.0.clamp(area.x, max_x), desired.1.clamp(area.y, max_y)))
}

fn ensure_timer_on_screen(window: &tauri::WebviewWindow) -> Result<(), String> {
    let position = window.outer_position().map_err(|e| e.to_string())?;
    window.set_position(clamped_timer_position(window, position.x, position.y)?).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_timer_popout(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        ensure_timer_on_screen(&window)?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    Err("The configured timer window is unavailable".into())
}

#[tauri::command]
fn open_timer_menu(app: tauri::AppHandle) -> Result<(), String> {
    let timer = app.get_webview_window("timer").ok_or_else(|| "The timer window is unavailable".to_string())?;
    let menu = app.get_webview_window("timer-menu").ok_or_else(|| "The timer menu is unavailable".to_string())?;
    let timer_position = timer.outer_position().map_err(|e| e.to_string())?;
    let timer_size = timer.outer_size().map_err(|e| e.to_string())?;
    let menu_size = menu.outer_size().map_err(|e| e.to_string())?;
    let area = timer_work_area(&timer, None)?;
    let margin = 8;
    let area_right = area.x + area.width as i32;
    let area_bottom = area.y + area.height as i32;
    let preferred_x = timer_position.x + timer_size.width as i32 - menu_size.width as i32;
    let below = timer_position.y + timer_size.height as i32 + margin;
    let above = timer_position.y - menu_size.height as i32 - margin;
    let x = preferred_x.clamp(area.x, (area_right - menu_size.width as i32).max(area.x));
    let y = if below + menu_size.height as i32 <= area_bottom { below } else { above }
        .clamp(area.y, (area_bottom - menu_size.height as i32).max(area.y));
    menu.set_position(tauri::PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
    menu.show().map_err(|e| e.to_string())?;
    menu.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_timer_menu(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer-menu") {
        window.hide().map_err(|e| e.to_string())?;
    }
    if let Some(timer) = app.get_webview_window("timer") {
        timer.emit("focus://popout-menu-closed", ()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_timer_auto_hide_tab(app: tauri::AppHandle, monitor_id: String, edge: String, offset: f64) -> Result<(), String> {
    let timer = app.get_webview_window("timer").ok_or_else(|| "The timer window is unavailable".to_string())?;
    if !timer.is_visible().map_err(|e| e.to_string())? {
        return Ok(());
    }
    let tab = app.get_webview_window("timer-tab").ok_or_else(|| "The timer reveal tab is unavailable".to_string())?;
    let vertical = edge == "left" || edge == "right";
    let (width, height) = if vertical { (18, 58) } else { (58, 18) };
    tab.set_size(tauri::LogicalSize::new(width, height)).map_err(|e| e.to_string())?;
    let size = tab.outer_size().map_err(|e| e.to_string())?;
    let area = timer_work_area(&timer, Some(&monitor_id))?;
    let inset = (10.0 * tab.scale_factor().map_err(|e| e.to_string())?).round() as i32;
    let normalized = offset.clamp(0.0, 1.0);
    let x_span = (area.width as i32 - size.width as i32 - inset * 2).max(0);
    let y_span = (area.height as i32 - size.height as i32 - inset * 2).max(0);
    let along_x = area.x + inset + (normalized * x_span as f64).round() as i32;
    let along_y = area.y + inset + (normalized * y_span as f64).round() as i32;
    let position = match edge.as_str() {
        "left" => tauri::PhysicalPosition::new(area.x, along_y),
        "right" => tauri::PhysicalPosition::new(area.x + area.width as i32 - size.width as i32, along_y),
        "top" => tauri::PhysicalPosition::new(along_x, area.y),
        _ => tauri::PhysicalPosition::new(along_x, area.y + area.height as i32 - size.height as i32),
    };
    tab.set_position(position).map_err(|e| e.to_string())?;
    tab.show().map_err(|e| e.to_string())?;
    timer.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn request_timer_reveal(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window.emit("focus://reveal-auto-hide", ()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn cancel_timer_auto_hide(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(tab) = app.get_webview_window("timer-tab") {
        tab.hide().map_err(|e| e.to_string())?;
    }
    if let Some(timer) = app.get_webview_window("timer") {
        timer.show().map_err(|e| e.to_string())?;
        timer.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_timer_always_on_top(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window
            .set_always_on_top(enabled)
            .map_err(|e| e.to_string())?;
    }
    if let Some(window) = app.get_webview_window("timer-menu") {
        window.set_always_on_top(enabled).map_err(|e| e.to_string())?;
    }
    if let Some(window) = app.get_webview_window("timer-tab") {
        window.set_always_on_top(enabled).map_err(|e| e.to_string())?;
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
fn set_timer_size(app: tauri::AppHandle, size: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        let (width, height) = match size.as_str() {
            "small" => (320, 170),
            "large" => (460, 230),
            _ => (380, 190),
        };
        window.set_size(tauri::LogicalSize::new(width, height)).map_err(|e| e.to_string())?;
        ensure_timer_on_screen(&window)?;
    }
    Ok(())
}

#[tauri::command]
fn set_timer_position(app: tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        window.set_position(clamped_timer_position(&window, x, y)?).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn restore_timer_floating_position(app: tauri::AppHandle, x: Option<i32>, y: Option<i32>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("timer") {
        let current = window.outer_position().map_err(|e| e.to_string())?;
        let position = clamped_timer_position(&window, x.unwrap_or(current.x), y.unwrap_or(current.y))?;
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
fn get_timer_work_area(
    app: tauri::AppHandle,
    monitor_id: Option<String>,
) -> Result<WorkArea, String> {
    let window = app
        .get_webview_window("timer")
        .ok_or_else(|| "The configured timer window is unavailable".to_string())?;
    timer_work_area(&window, monitor_id.as_deref())
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
    if let Some(window) = app.get_webview_window("timer-menu") {
        window.hide().map_err(|e| e.to_string())?;
    }
    if let Some(window) = app.get_webview_window("timer") {
        window.hide().map_err(|e| e.to_string())?;
    }
    if let Some(window) = app.get_webview_window("timer-tab") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn close_main_window(app: tauri::AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

#[tauri::command]
fn set_main_fullscreen(app: tauri::AppHandle, fullscreen: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_fullscreen(fullscreen)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn is_main_fullscreen(app: tauri::AppHandle) -> Result<bool, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "The main Focus window is unavailable".to_string())?
        .is_fullscreen()
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
                let _ = window.emit("focus://second-instance", ());
            }
        }))
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
            open_timer_menu,
            hide_timer_menu,
            show_timer_auto_hide_tab,
            request_timer_reveal,
            cancel_timer_auto_hide,
            set_timer_always_on_top,
            set_timer_taskbar,
            set_timer_size,
            set_timer_position,
            restore_timer_floating_position,
            set_timer_position_unchecked,
            get_timer_work_area,
            list_monitor_work_areas,
            focus_main_window,
            hide_timer_popout,
            close_main_window,
            set_main_fullscreen,
            is_main_fullscreen
        ])
        .on_window_event(|window, event| {
            if window.label() == "timer" || window.label() == "timer-menu" || window.label() == "timer-tab" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                    if window.label() == "timer-tab" {
                        if let Some(timer) = window.app_handle().get_webview_window("timer") {
                            let _ = timer.show();
                            let _ = timer.set_focus();
                        }
                    }
                    if window.label() == "timer-menu" {
                        if let Some(timer) = window.app_handle().get_webview_window("timer") {
                            let _ = timer.emit("focus://popout-menu-closed", ());
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Focus");
}
