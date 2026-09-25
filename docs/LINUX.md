# Experimental Linux x86-64 support

Windows remains the release baseline. Linux uses the platform-specific
`src-tauri/tauri.linux.conf.json`: existing square PNGs, AppImage and Debian bundles.
The shared Windows NSIS/updater configuration and ICO are unchanged.

## Native behavior and limitations

- Main-window minimum sizes use Tauri on Linux; Windows keeps its WM_GETMINMAXINFO hook.
- Linux work areas use Tauri's GTK-backed monitor work area, in physical pixels.
  This excludes desktop panels where the compositor supplies usable bounds.
- GTK monitor-added/removed and geometry/work-area/scale notifications refresh the
  popout, including hidden tabs. Windows keeps its display-message subclass.
- X11 (including XWayland when GTK selects X11) uses Tauri placement, dragging,
  docking and reveal-tab geometry. Mixed-DPI, panel changes, negative monitor
  coordinates and display reconnection still need testing on real desktops.
- Native Wayland does not permit reliable application-controlled global placement.
  Focus leaves placement to the compositor, keeps the popout floating/draggable,
  and does not auto-hide it behind an unplaceable reveal tab. Saved preferences
  are retained. Menus are compositor-positioned. Pin/dock positioning has no effect.
- The global-shortcut plugin uses X11. Native Wayland skips initialization;
  non-empty registration reports unavailable, and Clear remains usable. An X11
  initialization failure does not abort startup. No portal shortcut support is claimed.
- Always-on-top, taskbar exclusion, focus requests and notification delivery remain
  subject to the compositor/desktop. These use existing Tauri APIs.
- Autostart uses the existing Tauri Linux autostart implementation; AppImage paths
  should remain stable after enabling it. Test login behavior in an installed desktop.
- Focus currently has no tray implementation on either Windows or Linux.
- Closing the main window exits; closing the popout retains the active timer.
  Existing session/generation checks remain authoritative.

## Validation

The manually dispatched Linux workflow builds on Ubuntu 22.04 x86-64, runs the
frontend checks/tests and Rust checks/tests, builds both package formats, and checks
Debian architecture/icon contents and extracted AppImage contents. Packages remain
workflow artifacts, not source files. Signing inputs and updater settings are unchanged.

A successful headless build is not a native-desktop behavior test. Before calling
Linux stable, test X11 and native Wayland with GNOME/KDE, mixed scale monitors,
hotplug/panel changes, drag/close/pin, reveal shortcuts, notifications and autostart.
Linux updates additionally require matching Linux entries in a published updater
manifest; this patch does not modify or publish that manifest.

References: https://v2.tauri.app/reference/config/ (platform configuration),
https://docs.rs/tauri/latest/tauri/window/struct.Monitor.html (work areas),
https://v2.tauri.app/distribute/appimage/ (Linux packaging).
