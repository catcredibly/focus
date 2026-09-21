# Focus

This is the first implementation scaffold for the Windows Focus timer.

## Current milestone: V0.4

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
- Academic Year creation, editing, current selection, archive, and restore
- Subject management scoped by Academic Year
- Current-year active Subjects integrated with the Timer
- Completed and manual Session history with editing, archive, restore, and pagination
- IndexedDB V1 to V2 migration preserving existing Sessions
- Versioned, lossless JSON backup and transactional merge/replace restore
- UTF-8 CSV Session export for Excel and flexible CSV import with column mapping
- Import previews, validation, conflict handling, and duplicate detection
- Native Windows open/save dialogs through official Tauri plugins
- Five-view local Analytics with Academic Year and date-range filtering
- Scrollable focus trends, cumulative totals, and rolling calendar-day averages
- Adaptive P90 activity heatmaps and factual study-pattern summaries

Full Settings and final Windows polish are later milestones.

## Windows prerequisites

1. Install Node.js LTS.
2. Install Rust using rustup (MSVC toolchain).
3. Install Visual Studio Build Tools with **Desktop development with C++** and a Windows SDK.
4. Windows 11 normally already has WebView2. If Tauri reports that it is missing, install the Microsoft Edge WebView2 Runtime.

## Run

    npm install
    npm run tauri dev

## Recommended build order

1. Settings and popout polish.
2. Windows installer build.
