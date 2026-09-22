# Focus corrective feature pass — Popout, docking, auto-hide, localization, and bulk Session move

Continue from the current Focus repository.

Read first:

    AGENTS.md
    docs/design/DESIGN.md
    docs/ARCHITECTURE.md

Inspect the current implementation before changing anything.

This task consolidates the remaining related fixes/features:

1. Remove the motivational message from the Timer entirely.
2. Finish English / Simplified Chinese localization properly.
3. Repair the compact popout menu.
4. Make the frameless popout reliably draggable.
5. Fix broken Undock behavior.
6. Fix multi-monitor docking and allow explicit monitor selection.
7. Add/refine optional docking.
8. Add optional auto-hide with the approved minimal draggable edge tab.
9. Preserve the approved popout Extend / Custom behavior.
10. Add explicit History bulk Move for selected Sessions.
11. Update architecture documentation where appropriate.

Do not redesign unrelated working pages.

Codex may create logical commits after stable groups pass validation.

Do not push, merge, rebase, force-reset, or rewrite existing commits.


# 1. Remove the motivational message entirely

Remove the Timer message:

    "Small steps, big progress."

and the entire concept of a configurable motivational message.

Do NOT replace it with another quote.

Remove:

    motivational message text
    quote text
    edit-message button
    Settings control for changing it
    reset-to-default message controls
    translation keys that exist only for this feature
    any persisted setting dedicated to this message

The Timer page should simply use the freed space cleanly.

Do not leave an awkward blank placeholder where the message used to be.

The timer should become the clear visual focus.


# 2. Preserve Timer date

The current date may remain above the Timer if it fits the existing design.

Removing the message should not require removing useful date information.

Adjust vertical spacing naturally after the quote is removed.


# 3. Simplified Chinese support

Focus supports:

    English
    简体中文

Internal locales:

    en
    zh-CN

English remains the default.


# 4. Language setting

Language selection belongs under:

    Settings → General → Language

Options:

    English
    简体中文

Changing language should update the application immediately.

Persist the language through the existing Settings architecture.

No restart should be required.


# 5. Proper i18n architecture

Do NOT implement localization using scattered checks such as:

    language === "zh-CN" ? ...

through components.

Use the existing localization layer if already added.

Otherwise use a proper lightweight React i18n structure such as:

    i18next
    react-i18next

A suitable organization is:

    src/i18n/
        en.ts
        zh-CN.ts

or equivalent.


# 6. Fix incomplete Chinese translation

The current Chinese mode still contains substantial English UI.

Perform a full audit of visible application strings.

The screenshot currently shows examples such as:

    Analytics
    Overview
    Subjects
    Academic Years
    Time Trends
    Study Patterns
    All Years
    Total focus time
    Total Sessions
    Longest streak
    Average per active day
    Most studied Subject
    Focus time over time
    Focus time by Academic Year
    Focus time by Subject
    Study activity
    Session length distribution
    No study
    Jump to latest

These and equivalent visible UI strings must be localized.

Do not leave a mixed English/Chinese interface except where content is intentionally user-created or a proper noun/technology name.


# 7. Translate the complete application interface

Audit and translate user-facing text throughout:

    Sidebar
    Timer
    Timer states
    Extend
    Custom Extend
    popout
    popout menus
    docking controls
    auto-hide controls
    Analytics
    Overview
    Subjects Analytics
    Academic Years Analytics
    Time Trends
    Study Patterns
    History
    Subjects
    Academic Years
    Import / Export
    Settings
    General
    Timer settings
    Popout settings
    Appearance
    Data
    About
    confirmation dialogs
    selection mode
    bulk Move
    bulk Delete
    empty states
    validation messages
    chart labels
    chart tooltips
    heatmap legends
    notifications
    loading states


# 8. Do not translate user-created data

Never translate:

    Subject names
    Academic Year names
    Session notes
    imported user text

Examples:

If the Subject is:

    Mathematics

keep:

    Mathematics

even when the UI is Chinese.

If the Subject is:

    数学

keep:

    数学

when the UI is English.


# 9. Suggested Chinese terminology

Use natural concise Simplified Chinese desktop UI wording.

Examples:

    Timer
    计时器

    Analytics
    数据分析

    History
    历史记录

    Subjects
    科目

    Academic Years
    学年

    Import / Export
    导入 / 导出

    Settings
    设置

    General
    通用

    Popout
    悬浮窗

    Appearance
    外观

    Data
    数据

    About
    关于

    Start
    开始

    Pause
    暂停

    Resume
    继续

    Stop
    停止

    Extend
    延长

    Add time
    添加时间

    Custom
    自定义

    Save
    保存

    Cancel
    取消

    Delete
    删除

    Archive
    归档

    Restore
    恢复

    Move
    移动

    Select all
    全选

    Hours
    小时

    Minutes
    分钟

    Seconds
    秒

    Paused
    已暂停

    Finished
    已完成


# 10. Localized duration formatting

Use one shared localized duration formatter.

English:

    21 sec
    5 min
    1 hr 15 min

Chinese:

    21 秒
    5 分钟
    1 小时 15 分钟

Do not implement duration translation separately in each page.


# 11. Localized dates

Changing language may change display formatting.

English example:

    22 Sep 2026

Chinese example:

    2026年9月22日

Do NOT change:

    stored timestamps
    Session dates
    timezone
    Analytics grouping
    streak calculation


# 12. Translation fallback

English is the fallback locale.

If a zh-CN key is missing:

    show the English translation

Never display:

    undefined
    raw translation keys
    blank labels


# 13. Translation completeness safeguard

Add a development/test check where practical to identify English translation keys missing from zh-CN.

The goal is to prevent future features from silently becoming English-only.


# 14. JSON / CSV remain language-independent

Do not localize structural backup schemas.

JSON property names remain canonical.

CSV compatibility remains unchanged.

Only the application UI is localized.


# 15. Popout approved visual design

Preserve the approved compact popout.

The following styling applies ONLY to the popout, not the main Timer.

Popout:

- compact
- frameless
- dark Focus background
- no Focus logo/title in top-left
- Subject shown only if Show Subject is enabled
- large timer
- icon-only timer controls
- fluid layout
- no rectangular boxes around Pause / Resume / Stop / Extend
- small × close control
- restrained orange accent

Main Timer:

- retains icons + text labels
- do not convert main controls to popout styling


# 16. Running / Paused / Finished status

Running:

    no "Running" text

Paused:

    show Paused

Finished:

    show Finished

Reserve the status area's vertical height even while Running so nothing shifts when status text appears.


# 17. Popout close behavior

The × control must close ONLY the popout.

It must not:

    stop
    pause
    finish
    reset
    otherwise modify

the active timer.

Alt+F4 / normal native close should behave identically.

Reopening the popout should show the current authoritative timer state.


# 18. One authoritative timer

There must be only one active timer state.

Main window and popout must remain synchronized for:

    remaining time
    running/paused/finished state
    Subject
    note
    Extend
    Custom Extend
    Stop
    Resume
    Finish

Never create an independent popout timer.


# 19. Fix popout menu resizing

Current bug:

- popout looks correct with menu closed
- opening menu causes native window to grow/expand
- blank area appears

Opening the menu must NOT change:

    native popout width
    native popout height

The outer dimensions before and after opening must be identical.


# 20. Popout menu must be an overlay

Render the menu as a true overlay/popover.

Use appropriate:

    absolute positioning
    portal
    overlay layer

Do not resize the Tauri window to accommodate it.

The menu should float over existing popout space.


# 21. Fix popout menu toggle

Current bug:

    menu opens but cannot be closed correctly

Required:

    closed → click menu → open
    open → click same menu button → closed

Also close the menu when:

    clicking outside
    pressing Escape
    selecting Open Focus
    selecting Close popout
    selecting other actions where closing makes sense

Clicks within the menu must not trigger the outside-click listener.


# 22. Menu contents

Keep the menu concise.

It may include:

    Always on top
    Dock to >
    Monitor >
    Auto-hide
    Undock
    Open Focus
    Close popout

Only show actions relevant to current state where appropriate.


# 23. Popout menu styling

Use:

    dark navy surface
    subtle border
    restrained shadow
    Focus typography
    orange accent for selected/check states

The menu itself may remain a rectangular floating panel.

The "fluid/no boxes" rule refers primarily to the core timer controls.


# 24. Make the frameless popout draggable

The popout must be movable normally in free mode.

Use the appropriate Tauri frameless-window drag mechanism.

Prefer explicit Tauri drag regions or native window dragging.

Do not build a complicated custom coordinate-drag system unless necessary.


# 25. Invisible drag region

Use empty/non-interactive popout areas as the drag surface.

Do NOT add:

    title bar
    "Drag here"
    visible drag handle

Good draggable surfaces include:

    empty top area
    background around timer
    unused background regions


# 26. Controls must remain interactive

Do not let window dragging hijack clicks on:

    ×
    menu
    Pause / Resume
    Stop
    Extend
    Extend menu
    Custom inputs
    Add time
    Cancel
    docking menu
    Always on top
    Open Focus
    Close popout
    auto-hide tab


# 27. Position persistence

If:

    Settings → Popout → Remember popout position

is enabled:

remember free-mode position after the user moves the popout.

When reopened:

    restore it

Do not restore the popout entirely off-screen.

If stored coordinates are invalid after monitor/resolution changes:

    clamp/recover it onto a visible display.


# 28. Docking setting

Under:

    Settings → Popout

add/refine a Docking section containing:

    Enable docking
    Dock monitor
    Default dock position
    Auto-hide when docked
    Remember popout position

Recommended default:

    Enable docking = Off

so normal free movement remains the default.


# 29. Dock monitor setting

Add:

    Dock monitor

Options:

    Current monitor
    Display 1
    Display 2
    Display 3
    ...

Only show displays actually detected.

If Windows/Tauri exposes useful real monitor labels, use them.

Otherwise use:

    Display 1
    Display 2
    ...

Do not invent monitor model names.


# 30. Current monitor behavior

Default:

    Current monitor

Meaning:

    dock to the monitor the popout is currently located on

Ideally display:

    Current monitor (Display 2)

where resolvable.


# 31. Explicit monitor selection

If the user selects:

    Display 2

then:

    Top Right

means:

    Top Right of Display 2

regardless of where the popout was previously located.


# 32. Quick monitor control

Also expose monitor selection through the popout menu:

    Monitor >
        Current monitor
        Display 1
        Display 2
        ...

This is the quick runtime override.

Settings stores the persistent/default choice.


# 33. Dock corners

Support:

    Top Left
    Top Right
    Bottom Left
    Bottom Right

Dock relative to the selected monitor's usable work area.

Avoid covering the Windows taskbar.


# 34. Snap behavior

When docking is enabled, dragging a free popout near a corner should snap it.

Use an appropriate threshold around:

    30–60 px

Do not snap when clearly away from a corner.


# 35. Fix Undock completely

Current bug:

    popout is docked
    user clicks Undock
    popout stays effectively locked
    it cannot be dragged

Fix this at the actual state level.

After Undock:

- clear current dock state
- clear current corner lock
- clear live auto-hide state
- remove edge tab
- reveal full popout
- restore normal drag region
- restore free movement immediately
- do not require popout restart


# 36. Preference vs runtime state

Separate:

    Enable docking preference

from:

    current window is docked

Having docking enabled does NOT mean the popout must always remain docked.

The user must be able to:

    dock
    undock
    move freely
    dock again

without changing the Settings toggle.


# 37. Free position after Undock

When undocking:

If a previous valid free position exists:

    restore it

Otherwise:

    move the window slightly inward from the former dock corner

Do not leave it stuck flush against the edge.


# 38. Wrong-monitor bug

Do NOT always dock using:

    primaryMonitor()

or equivalent.

Resolve and use the selected/current target monitor.

Audit existing code for assumptions that every screen begins at:

    0,0


# 39. Multi-monitor coordinate handling

Windows displays may have:

    negative X coordinates
    negative Y coordinates
    monitors above/below each other
    different scale factors / DPI

Handle:

    logical coordinates
    physical coordinates
    monitor position
    work area
    scale factor

consistently.

Do not mix units.


# 40. Docking between monitors

When Dock monitor is:

    Current monitor

and the user drags the free popout onto Display 2:

    docking should use Display 2

It should not jump back to the primary display.


# 41. Auto-hide is optional

Docking and auto-hide are distinct.

Docking:

    popout stays visibly anchored

Auto-hide:

    when docked, popout may slide outside screen leaving a small tab

Therefore:

    docking can be enabled without auto-hide

Recommended:

    Auto-hide when docked = Off by default


# 42. Auto-hide only while docked

If the popout is undocked:

    no edge tab
    no live auto-hide

The user's stored Auto-hide preference may remain enabled so it becomes active again if the popout docks later.


# 43. Auto-hide interaction safety

Never auto-hide while the user is:

    hovering popout
    interacting with controls
    using Extend
    editing Custom Extend
    using menu
    dragging popout
    dragging edge tab


# 44. Approved auto-hide tab design

Use the refined minimal edge-tab design.

Do NOT use a large chunky handle.

When hidden, leave only a very small understated tab with an indicator dot.


# 45. Edge-specific tab shape

LEFT / RIGHT edges:

    thin vertical pill/notch

TOP / BOTTOM edges:

    thin horizontal pill/notch

Do NOT simply rotate a tall vertical tab for top/bottom.

Top and bottom must look flatter and wider.


# 46. Auto-hide tab appearance

Use:

    dark navy / subtle translucent surface
    subtle border
    small orange indicator dot
    rounded Focus styling

No permanent text like:

    Hover to show


# 47. Draggable auto-hide tab

The tab itself must be draggable.

Support:

    move along the same edge
    move to another screen edge

Edges:

    Left
    Right
    Top
    Bottom


# 48. Tab movement threshold

Distinguish normal reveal/click from dragging.

Example logic:

small movement:
    normal hover/click

movement beyond threshold:
    begin dragging
    suppress reveal while drag is active


# 49. Tab position persistence

Store:

    edge
    normalized offset along edge

Prefer normalized offset rather than only raw pixels.

Example:

    edge: "right"
    offset: 0.42

This survives display resolution changes better.


# 50. Restoring tab position

When reopening:

    restore edge and offset

Clamp values if the display changes.

Do not let the tab become unreachable.


# 51. Tab reveals popout correctly

After repositioning the tab:

hover/click should reveal the popout adjacent to that location.

Keep the revealed popout completely inside the monitor work area.


# 52. Auto-hide animation

Use a short restrained slide.

Respect:

    prefers-reduced-motion

No elaborate animation.


# 53. Popout Extend presets

Preserve:

    +5 minutes
    +15 minutes
    +30 minutes
    +60 minutes
    Custom...

+60 replaces the old +50 preset.


# 54. Extend menu behavior

The Extend menu is also an overlay.

It must NOT resize the native popout.

Initial state shows only:

    +5
    +15
    +30
    +60
    Custom...


# 55. Custom Extend

Custom controls remain hidden until:

    Custom...

is clicked.

Then show:

    Hours : Minutes : Seconds
    Add time
    Cancel

No native up/down spinner arrows.


# 56. Custom Extend meaning

Custom duration means:

    amount to ADD

not final desired remaining time.

Example:

Remaining:

    00:17:21

Custom:

    00:20:00

Result:

    00:37:21


# 57. Custom normalization

Reuse the main Timer parser.

Examples:

    00:75:00 → 01:15:00
    00:00:90 → 00:01:30
    02:75:90 → 03:16:30

Normalize on:

    blur
    Enter
    Add time

Zero does nothing.

No negative durations.


# 58. Custom Cancel

Cancel returns to:

    +5
    +15
    +30
    +60
    Custom...

It must not affect timer state.


# 59. Custom extension preserves Session

Add time must preserve:

    Session ID
    Subject
    note
    Running/Paused state

It must synchronize main window and popout.

It must NOT change the remembered base/new-timer duration.


# 60. History bulk Move

Preserve/add explicit bulk Move for History selection mode.

Selecting Sessions must NOT automatically open a Move dialog.


# 61. Selection toolbar

When one or more Sessions are selected, show:

    X selected

    [Select all] [Move] [Delete] [Cancel]

Place Move between:

    Select all
    Delete

Move is non-destructive.

Delete remains visually destructive.


# 62. Open Move only on explicit click

The bulk Move modal opens ONLY after:

    clicking Move

Do not open it when:

    selecting a row
    entering selection mode
    Select all
    changing filters


# 63. Bulk Move hierarchy

Modal:

    Move selected sessions

Controls:

    Academic Year
    [ IB ▼ ]

    Subject
    [ Mathematics ▼ ]

Changing Academic Year filters the Subject choices to that Academic Year.


# 64. Database relationship remains Subject-based

Do NOT add a redundant Session academicYearId merely for this UI.

The actual Session relationship remains:

    session.subjectId

Academic Year is just a UI filter/helper for selecting the destination Subject.


# 65. Bulk Move changes only assignment

Moving Sessions must preserve:

    Session ID
    date
    startTime
    endTime
    focusedDurationSeconds
    note
    archived state

Update Subject/Academic Year snapshots if the existing Session architecture stores them.


# 66. Bulk Move buttons

Use contextual text:

    Move 1 session
    Move 4 sessions
    Move 124 sessions

Cancel closes the modal but leaves selection mode and selection intact.

Successful Move:

    updates selected Sessions
    closes modal
    clears selection
    exits selection mode
    updates History and Analytics immediately


# 67. No second confirmation for Move

Do not add an extra confirmation after the Move modal.

Move is reversible.

Delete remains confirmed separately.


# 68. Active destination Subjects only

Prefer showing only valid active Subjects as move destinations.

If an Academic Year has no active Subjects:

    No active Subjects in this Academic Year


# 69. Documentation

Update:

    docs/ARCHITECTURE.md

briefly for:

- i18n architecture
- supported locales
- popout native window
- free/docked runtime state
- monitor targeting
- auto-hide/tab state
- History bulk reassignment

Keep it concise.


# 70. Tests — localization

Add/update tests for:

    English default
    switching to zh-CN
    persistence
    immediate update
    popout localization
    Analytics translation
    Settings translation
    chart/tooltip translation
    localized duration
    localized date
    user content not translated
    missing-key English fallback
    JSON compatibility
    CSV compatibility


# 71. Tests — menu

Test:

    open
    toggle closed with same button
    outside click
    Escape
    action closing
    internal clicks not treated as outside


# 72. Tests — docking

Test logic for:

    docking enabled/disabled
    current dock state separate from preference
    Undock clears dock state
    free movement state restored
    monitor selection
    Current monitor resolution
    explicit Display selection
    corner calculation
    invalid/off-screen recovery


# 73. Tests — auto-hide

Where practical test:

    auto-hide only while docked
    tab hidden when undocked
    correct edge orientation
    normalized offset persistence
    drag threshold
    same-edge movement
    edge change
    clamping


# 74. Tests — Extend

Cover:

    +5
    +15
    +30
    +60
    no +50
    Custom hidden initially
    Custom reveal
    Cancel
    Enter
    Escape
    overflow normalization
    zero
    state preservation
    base duration unchanged
    main/popout synchronization


# 75. Tests — History bulk Move

Cover:

    selection does not auto-open modal
    Move appears in selection mode
    Move button opens modal
    Academic Year filters Subjects
    only selected Sessions move
    unrelated Sessions unchanged
    Session metadata preserved
    Cancel changes nothing
    Analytics updates
    transactional update


# 76. Native manual test — popout menu

Run:

    npm run tauri dev

Then:

1. open popout
2. record dimensions
3. open menu
4. verify dimensions unchanged
5. click menu button again
6. verify close
7. outside click
8. verify close
9. Escape
10. verify close


# 77. Native manual test — dragging

1. Disable docking.
2. Drag popout freely.
3. Verify normal movement.
4. Verify buttons don't initiate drag.


# 78. Native manual test — Undock

1. Enable docking.
2. Dock.
3. Click Undock.
4. Immediately drag popout.

Expected:

    fully free again

Repeat while auto-hide is active.

Expected:

    popout reveals
    tab disappears
    free dragging restored


# 79. Native manual test — monitors

With multiple monitors:

1. choose Current monitor
2. drag popout to Display 2
3. dock Top Right
4. verify Display 2
5. choose Display 1 explicitly
6. dock Bottom Left
7. verify Display 1
8. undock
9. verify free movement

Test different Windows scaling if available.


# 80. Native manual test — auto-hide

1. Dock popout.
2. Enable auto-hide.
3. move pointer away
4. verify popout hides
5. verify minimal tab
6. hover tab
7. verify reveal
8. interact
9. verify it does not disappear while interacting


# 81. Native manual test — draggable tab

1. auto-hide popout
2. drag tab along current edge
3. verify new offset
4. drag to left/right/top/bottom
5. verify orientation adapts
6. verify top/bottom are slim horizontal tabs
7. reveal after each move


# 82. Manual language audit

Switch to:

    简体中文

Visit every major page.

Pay particular attention to Analytics because it currently contains many untranslated strings.

Verify:

    no obvious English UI remains

except:

    Focus
    user-created content
    technology names
    other intentional proper nouns


# 83. Remove motivational-message remnants

Before completion, search for remnants such as:

    Small steps, big progress
    motivational
    quote
    edit message
    Reset to default

Remove obsolete UI, translation keys, and Settings code where no longer needed.

Do not remove unrelated generic quote/string utilities unless genuinely unused.


# 84. Validation commands

Run:

    npm run typecheck
    npm test
    npm run build
    cargo check --manifest-path src-tauri/Cargo.toml

Then:

    npm run tauri dev


# 85. Git

Codex is free to create commits as it sees fit throughout this task.

Use logical commit boundaries whenever a stable group of changes has been completed and validated.

Possible examples:

    fix: stabilize popout docking and monitor behavior
    feat: add popout auto-hide and draggable edge tab
    fix: complete application localization
    feat: add bulk session reassignment

These are examples only.

Codex should choose commit timing and grouping based on the actual implementation.

Requirements:

- keep commits coherent
- avoid unnecessary micro-commits
- avoid committing knowingly broken intermediate states where practical
- run appropriate checks before important checkpoints
- do not push
- do not merge
- do not rebase or rewrite existing history unless explicitly requested


# 86. Additional language support — Traditional Chinese and Japanese

Extend the localization system so Focus supports:

    English
    简体中文
    繁體中文
    日本語

Internal locale identifiers:

    en
    zh-CN
    zh-TW
    ja

English remains the default language.

Do not create separate application logic for each language.

All four languages must use the same translation architecture and translation keys.


## Language setting

Update:

    Settings → General → Language

Options:

    English
    简体中文
    繁體中文
    日本語

Changing language must:

    update the application immediately
    update the popout immediately
    persist across app restart

No restart should be required.


## Translation resources

Extend the existing i18n structure to include:

    src/i18n/
        en.ts
        zh-CN.ts
        zh-TW.ts
        ja.ts

or the equivalent current project structure.

Use the same canonical translation keys in all resources.

Do not scatter locale-specific conditional expressions throughout React components.


# 87. Traditional Chinese localization

Use:

    zh-TW

for Traditional Chinese.

Use natural Traditional Chinese interface wording rather than simply performing automated character conversion from zh-CN.

Prefer terminology appropriate for a modern desktop interface.


## Suggested Traditional Chinese terminology

Examples:

    Timer
    計時器

    Analytics
    資料分析

    History
    歷史記錄

    Subjects
    科目

    Academic Years
    學年

    Import / Export
    匯入 / 匯出

    Settings
    設定

    General
    一般

    Popout
    懸浮視窗

    Appearance
    外觀

    Data
    資料

    About
    關於

    Start
    開始

    Pause
    暫停

    Resume
    繼續

    Stop
    停止

    Extend
    延長

    Add time
    新增時間

    Custom
    自訂

    Save
    儲存

    Cancel
    取消

    Delete
    刪除

    Archive
    封存

    Restore
    還原

    Move
    移動

    Select all
    全選

    Hours
    小時

    Minutes
    分鐘

    Seconds
    秒

    Paused
    已暫停

    Finished
    已完成


## Traditional Chinese docking terminology

Examples:

    Enable docking
    啟用停靠

    Dock monitor
    停靠螢幕

    Current monitor
    目前螢幕

    Dock to
    停靠位置

    Undock
    取消停靠

    Auto-hide
    自動隱藏

    Auto-hide when docked
    停靠時自動隱藏

    Remember popout position
    記住懸浮視窗位置

    Top Left
    左上

    Top Right
    右上

    Bottom Left
    左下

    Bottom Right
    右下

    Always on top
    置於最上層

    Open Focus
    開啟 Focus

    Close popout
    關閉懸浮視窗


## Traditional Chinese duration formatting

Examples:

    21 sec
    21 秒

    5 min
    5 分鐘

    1 hr 15 min
    1 小時 15 分鐘


## Traditional Chinese date formatting

A natural display may use:

    2026年9月22日

Do not alter:

    stored timestamps
    local timezone
    Analytics grouping
    Session ownership
    streak logic


# 88. Japanese localization

Use:

    ja

for Japanese.

Use natural concise Japanese interface wording rather than literal English sentence structure.


## Suggested Japanese terminology

Examples:

    Timer
    タイマー

    Analytics
    分析

    History
    履歴

    Subjects
    科目

    Academic Years
    学年

    Import / Export
    インポート / エクスポート

    Settings
    設定

    General
    一般

    Popout
    ポップアウト

    Appearance
    外観

    Data
    データ

    About
    このアプリについて

    Start
    開始

    Pause
    一時停止

    Resume
    再開

    Stop
    停止

    Extend
    延長

    Add time
    時間を追加

    Custom
    カスタム

    Save
    保存

    Cancel
    キャンセル

    Delete
    削除

    Archive
    アーカイブ

    Restore
    復元

    Move
    移動

    Select all
    すべて選択

    Hours
    時間

    Minutes
    分

    Seconds
    秒

    Paused
    一時停止中

    Finished
    完了


## Japanese docking terminology

Examples:

    Enable docking
    ドッキングを有効にする

    Dock monitor
    ドッキング先モニター

    Current monitor
    現在のモニター

    Dock to
    ドッキング位置

    Undock
    ドッキング解除

    Auto-hide
    自動的に隠す

    Auto-hide when docked
    ドッキング時に自動的に隠す

    Remember popout position
    ポップアウトの位置を記憶

    Top Left
    左上

    Top Right
    右上

    Bottom Left
    左下

    Bottom Right
    右下

    Always on top
    常に手前に表示

    Open Focus
    Focus を開く

    Close popout
    ポップアウトを閉じる


## Japanese duration formatting

Examples:

    21 sec
    21秒

    5 min
    5分

    1 hr 15 min
    1時間15分

Avoid unnecessary spaces in Japanese duration strings.


## Japanese date formatting

A natural date display may use:

    2026年9月22日

Do not alter any underlying timestamp or date grouping.


# 89. Translation scope for all four languages

English, Simplified Chinese, Traditional Chinese, and Japanese must cover the same application surface.

Audit:

    Sidebar
    Timer
    Timer states
    Extend
    Custom Extend
    popout
    popout menu
    docking
    monitor selection
    auto-hide
    Analytics
    Overview
    Subjects Analytics
    Academic Years Analytics
    Time Trends
    Study Patterns
    History
    History selection mode
    bulk Move
    bulk Delete
    Subjects
    Academic Years
    Import / Export
    Settings
    General
    Timer settings
    Popout settings
    Appearance
    Data
    About
    confirmation dialogs
    validation messages
    empty states
    tooltips
    heatmap legends
    chart labels
    loading states
    native notifications

Do not ship obviously mixed-language screens.


# 90. User-created content remains untouched

Never translate user-created content.

This includes:

    Subject names
    Academic Year names
    Session notes
    imported values
    user-entered labels

For example:

    Mathematics

must remain:

    Mathematics

in Chinese and Japanese unless the user themselves renames it.

Likewise:

    数学

must remain:

    数学

when the interface switches to English.


# 91. Focus application name

The product name:

    Focus

remains:

    Focus

in every language.

Do not translate or transliterate the app name.


# 92. About page localization

Translate the About page explanatory UI.

Keep:

    Focus
    Tauri
    React
    TypeScript

unchanged.

Localize:

    section headings
    explanatory copy
    Version
    Platform
    Data storage
    local-first description

appropriately.


# 93. Popout localization

The popout uses the SAME global application locale.

Do not create:

    separate popout language
    separate persisted locale
    language override per window

Changing language in the main application should propagate to an already-open popout where practical.

Translate:

    status text
    Extend
    Custom Extend
    docking menu
    monitor menu
    auto-hide
    Always on top
    Open Focus
    Close popout


# 94. Analytics localization audit

Analytics currently has been an area with incomplete translation.

Perform a deliberate audit of:

    tab names
    filters
    metric headings
    chart titles
    legends
    axes where textual
    tooltips
    heatmap labels
    empty states
    session-length labels
    Study Patterns labels
    date-range controls
    Jump to latest

Verify all four languages.


# 95. Layout testing across languages

Chinese and Japanese text lengths differ from English.

Verify at:

    maximized Windows layout
    collapsed sidebar
    narrower Windows Snap widths

Pay attention to:

    tabs
    buttons
    Settings labels
    select controls
    chart legends
    metric cards
    confirmation dialogs
    popout menus
    docking menu
    monitor selector

Do not reduce font size globally just to make one translation fit.

Prefer sensible wrapping or flexible width.


# 96. Font handling

Continue using the Windows/system font stack.

Verify glyph support for:

    Simplified Chinese
    Traditional Chinese
    Japanese

Do not bundle additional font files unless there is an actual rendering problem that cannot reasonably be solved using system fonts.


# 97. Locale fallback

English remains the canonical fallback.

If a key is missing from:

    zh-CN
    zh-TW
    ja

display the English translation.

Never show:

    raw translation keys
    undefined
    null
    blank labels


# 98. Translation-key completeness

Extend the development/test completeness check.

Use English as the canonical key set.

Verify expected keys exist in:

    zh-CN
    zh-TW
    ja

The check should make it easy to detect when a future feature adds an English string but no corresponding translation.


# 99. Do not auto-convert Simplified and Traditional Chinese at runtime

Do NOT dynamically convert:

    zh-CN ↔ zh-TW

using character replacement.

Maintain separate translation resources.

Reason:

many interface terms differ in wording as well as character form.

Examples include concepts such as:

    data
    import/export
    display terminology

Use properly authored locale strings.


# 100. Locale persistence

Persist one locale setting:

    en
    zh-CN
    zh-TW
    ja

Do not create separate language databases.

Changing locale must not mutate:

    Subjects
    Sessions
    Academic Years
    notes
    Analytics data


# 101. Import / Export compatibility

Language selection must not affect persistent file structure.

Keep canonical:

    JSON keys
    backup format
    formatVersion
    CSV structure/compatibility

The UI around Import / Export may be localized.

Do not make backups language-specific.


# 102. Native notifications

Use the active locale for Focus-generated notification text.

For example:

English:

    Focus session complete

Simplified Chinese:

    专注计时已完成

Traditional Chinese:

    專注計時已完成

Japanese:

    フォーカスセッションが完了しました

Subject names remain exactly as entered by the user.


# 103. Manual Simplified Chinese verification

Switch:

    Settings → General → Language → 简体中文

Check:

    Timer
    Analytics
    History
    Subjects
    Academic Years
    Import / Export
    all Settings pages
    About
    popout
    Extend
    Custom
    docking
    monitor selector
    auto-hide
    deletion confirmation
    bulk Move

Restart Focus.

Expected:

    简体中文 remains selected.


# 104. Manual Traditional Chinese verification

Switch:

    Settings → General → Language → 繁體中文

Repeat the same application-wide audit.

Verify the UI uses genuine Traditional Chinese strings rather than a mixture of Simplified and Traditional characters.

Restart Focus.

Expected:

    繁體中文 remains selected.


# 105. Manual Japanese verification

Switch:

    Settings → General → Language → 日本語

Repeat the same application-wide audit.

Verify:

    no obvious untranslated English remains
    layout does not clip
    popout remains compact

Restart Focus.

Expected:

    日本語 remains selected.


# 106. Language switching regression

Switch in sequence:

    English
    → 简体中文
    → 繁體中文
    → 日本語
    → English

After every switch verify:

    Subjects unchanged
    Academic Years unchanged
    Sessions unchanged
    notes unchanged
    timer state unaffected
    Analytics totals unchanged

Only presentation text and locale formatting should change.


# 107. Architecture documentation

Update:

    docs/ARCHITECTURE.md

supported locales to:

    en
    zh-CN
    zh-TW
    ja

Briefly document:

    localization library/layer
    translation-resource location
    English fallback behavior

Keep this concise.


# 108. Validation commands

Run:

    npm run typecheck
    npm test
    npm run build
    cargo check --manifest-path src-tauri/Cargo.toml

Then verify native behavior in:

    npm run tauri dev


# 109. Completion report

Report:

1. motivational-message removal
2. localization architecture
3. supported locales
4. location of translation resources
5. incomplete Simplified Chinese strings found and fixed
6. Traditional Chinese implementation
7. Japanese implementation
8. untranslated content intentionally retained
9. date and duration formatting behavior
10. translation completeness-check implementation
11. popout menu resize root cause
12. popout menu toggle root cause
13. frameless drag implementation
14. Undock root cause and fix
15. monitor-selection implementation
16. multi-monitor/DPI behavior
17. docking implementation
18. auto-hide implementation
19. draggable edge-tab implementation
20. Extend/Custom status
21. History bulk Move implementation
22. tests/checks run
23. native manual tests performed
24. commits created
25. final git status
26. remaining known issues


# Final product rules

MAIN TIMER:
- no motivational message
- no message-customization setting
- normal labelled controls remain
- date may remain
- Timer stays the visual focus

POPOUT:
- compact
- frameless
- no Focus title/logo
- icon-only core controls
- no Running label
- Paused / Finished labels only
- stable status spacing
- overlays never resize native window
- × closes only popout
- freely draggable when undocked
- Undock immediately restores free movement
- docking optional
- monitor target controllable
- Current monitor supported
- auto-hide optional
- auto-hide works only while docked
- minimal draggable edge tab
- horizontal tab on top/bottom
- vertical tab on left/right
- one authoritative timer shared with main window

LANGUAGE:
- English
- Simplified Chinese
- Traditional Chinese
- Japanese
- locale IDs:
      en
      zh-CN
      zh-TW
      ja
- complete application UI translation
- English fallback
- user-created content never translated
- same locale shared by main window and popout
- no language-specific database or backup schema

HISTORY:
- selecting Sessions does not automatically open Move
- explicit Move action
- Academic Year → Subject hierarchy
- Session relationship remains subjectId-based
- bulk Move preserves Session metadata