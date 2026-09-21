# Focus starter

This is the first implementation scaffold for the Windows Focus timer.

## Current milestone

- React + TypeScript + Vite
- Tauri 2 desktop shell
- Windows main window starts maximized
- Sidebar with collapse button
- Idle timer UI
- Smooth transition to distraction-free running UI
- Minutes/seconds may overflow and are normalized on blur/start
- Extend the same running session by +5/+15/+30/+50 minutes
- Compact frameless popout timer
- Popout controls appear on hover
- Always-on-top can be toggled from the popout menu
- Dexie / IndexedDB database schema is prepared

Analytics, History, Subjects, Academic Years, Import/Export and full Settings screens are the next milestones.

## Windows prerequisites

1. Install Node.js LTS.
2. Install Rust using rustup (MSVC toolchain).
3. Install Visual Studio Build Tools with **Desktop development with C++** and a Windows SDK.
4. Windows 11 normally already has WebView2. If Tauri reports that it is missing, install the Microsoft Edge WebView2 Runtime.

## Run

    npm install
    npm run tauri dev

## Recommended build order

1. Finish timer/session persistence.
2. Subjects + Academic Years.
3. History + archive/restore.
4. Import/export (JSON + CSV).
5. Analytics and percentile heatmap.
6. Settings and popout polish.
7. Windows installer build.
