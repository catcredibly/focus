//! Windows broadcasts cover work-area/taskbar and display topology changes that
//! ordinary Tauri move/resize events do not report for an already hidden timer.
#[cfg(windows)]
unsafe extern "system" fn display_proc(
    hwnd: windows_sys::Win32::Foundation::HWND, message: u32,
    wparam: usize, lparam: isize, id: usize, data: usize,
) -> isize {
    use tauri::Emitter;
    use windows_sys::Win32::UI::{Shell::{DefSubclassProc, RemoveWindowSubclass}, WindowsAndMessaging::{WM_DISPLAYCHANGE, WM_SETTINGCHANGE, WM_DPICHANGED, WM_DEVICECHANGE, WM_NCDESTROY}};
    let result = DefSubclassProc(hwnd, message, wparam, lparam);
    let reason = match message {
        WM_DISPLAYCHANGE => Some("display-change"),
        WM_SETTINGCHANGE => Some("work-area-change"),
        WM_DPICHANGED => Some("dpi-change"),
        WM_DEVICECHANGE => Some("device-change"),
        _ => None,
    };
    if let Some(reason) = reason {
        let app = &*(data as *const tauri::AppHandle);
        let _ = app.emit_to("timer", "focus://display-geometry-changed", reason);
    }
    if message == WM_NCDESTROY {
        RemoveWindowSubclass(hwnd, Some(display_proc), id);
        drop(Box::from_raw(data as *mut tauri::AppHandle));
    }
    result
}

pub fn install(_app: &tauri::AppHandle) -> Result<(), String> {
    #[cfg(windows)]
    {
        use tauri::Manager;
        let window = _app.get_webview_window("main").ok_or("Main window unavailable")?;
        let hwnd = window.hwnd().map_err(|error| error.to_string())?;
        let data = Box::into_raw(Box::new(_app.clone()));
        if unsafe { windows_sys::Win32::UI::Shell::SetWindowSubclass(hwnd.0 as _, Some(display_proc), 2, data as usize) } == 0 {
            unsafe { drop(Box::from_raw(data)); }
            return Err("Unable to observe display geometry changes".into());
        }
    }
    Ok(())
}
