# Focus

This is the first implementation scaffold for the Windows Focus timer.

## Current milestone: V0.2

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

Analytics, Import/Export, backup, and full Settings screens are later milestones.

## Windows prerequisites

1. Install Node.js LTS.
2. Install Rust using rustup (MSVC toolchain).
3. Install Visual Studio Build Tools with **Desktop development with C++** and a Windows SDK.
4. Windows 11 normally already has WebView2. If Tauri reports that it is missing, install the Microsoft Edge WebView2 Runtime.

## Run

    npm install
    npm run tauri dev

## Recommended build order

1. Import/export (JSON + CSV) and backup/restore.
2. Analytics and activity heatmap.
3. Settings and popout polish.
4. Windows installer build.
