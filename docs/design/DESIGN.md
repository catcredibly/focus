# Focus Design Specification

This document records which supplied screenshots are authoritative and the UI decisions that are not safely inferred from a still image. Written task requirements and this document override older screenshots.

## Global Application Shell

Canonical references:

- `app-overview.png` for the shared Windows application frame and navigation.
- The screen-specific canonical image listed below for each content area.

Supplementary references:

- `analytics-all-years.png` and `timer-running-draft-1.png` show the shell at different window sizes.

Approved decisions:

- Use the dark desktop application shell, left navigation, Focus identity, and compact Windows-first layout shown in the references.
- Preserve the navigation hierarchy: Timer, Analytics, History, Subjects, Academic Years, Import / Export, and Settings.
- Keep the active navigation item clearly highlighted.
- Do not add a photographic, scenic, illustrated, or decorative page background. Use the plain application surfaces shown in the newer references.

## Timer - Idle

Canonical reference:

- `timer-idle.png` when supplied as a standalone image.

Supplementary reference:

- The Timer panel in `app-overview.png` documents the idle controls and Today panel.

Visible elements:

- Quote and date.
- Hours, minutes, and seconds inputs with labels.
- Subject selector and optional note input.
- Primary Start action and compact utility controls.
- Today summary and recent sessions while the timer is idle.

Intentionally excluded:

- The mountain photograph shown behind the timer in the overview draft.
- Any other image or decorative background treatment.

Interaction notes:

- Time values must be editable before starting.
- Starting a session switches to the running layout rather than retaining the idle summary layout.

## Timer - Running

Canonical reference:

- `timer-running-draft-1.png`.

Supplementary references:

- `popout-timer.png` only for shared timer controls and extension choices.
- The Timer panel in `app-overview.png` only for shared shell styling.

Visible elements:

- Current subject with its colour marker.
- Large hours, minutes, and seconds display with labels.
- Running status.
- Pause, Stop, and Extend controls.
- Optional note field.
- Extend menu choices for 5, 10, 25, and 50 minutes, plus a custom duration.

Explicit overrides:

- Do not use a circular progress indicator.
- Hide Today and recent-session information while running.
- Hide current streak, sessions today, and session-time summary while running.
- Extend must be available directly on the main running page.
- Do not add a photographic, scenic, illustrated, or decorative background.

Interaction notes:

- Pause toggles the active countdown state without ending the session.
- Stop ends the active session through the application's completion flow.
- Extend opens the duration menu; selecting an option immediately adds that duration.

## Analytics

Canonical reference:

- `analytics-all-years.png`.

Supplementary reference:

- `app-overview.png` may be used only for shared shell styling.

Intentionally excluded:

- The Analytics page shown inside `app-overview.png`. It is an obsolete iteration and must not guide the Analytics layout, information architecture, charts, or controls.

Visible elements:

- Analytics title and description.
- Academic-year selector, date range, range presets, and Compare control.
- Overview, Subjects, Academic Years, Time Trends, and Study Patterns tabs.
- Summary metrics for focus time, sessions, streak, daily average, most studied subject, and academic years.
- Focus-time timeline, academic-year totals, subject distribution, study patterns, key insights, activity calendar, session-length distribution, and time trends.
- Compact active-timer panel when a session is running.

Interaction notes:

- Global filters update all applicable metrics and visualisations.
- Tabs switch analytics views while retaining the selected scope where practical.
- Timeline and activity controls navigate ranges without changing the global scope unexpectedly.
- Compare opens comparison options; the screenshot does not prescribe the final menu contents.

## History

Canonical reference:

- The History panel in `app-overview.png`.

Visible elements:

- Search, academic-year, subject, and status filters.
- Session table with date, start, end, duration, subject, academic year, status, and note.
- Pagination and rows-per-page control.

Interaction notes:

- Filters combine and update the table.
- Session rows remain manageable through the application's edit/archive workflow.

## Subjects

Canonical reference:

- The Subjects panel in `app-overview.png`.
- Use `subjects-academic-years.png` if a standalone crop is supplied later.

Visible elements:

- Academic-year selector, search, filtering, and Add Subject action.
- Active and Archived tabs.
- Subject colour, name, session count, total time, and row actions.

## Academic Years

Canonical reference:

- The Academic Years panel in `app-overview.png`.
- Use `subjects-academic-years.png` if a standalone crop is supplied later.

Visible elements:

- Add Academic Year action.
- Current, future, and past/other groups with dates, subject/session totals, duration, and row actions.

## Import / Export

Canonical reference:

- The Import / Export panel in `app-overview.png`.

Visible elements:

- Export format selection and Export Data action.
- File drop area and file chooser.
- Merge and replace import options.
- Local-storage and backup reminder.

Interaction notes:

- Replacing all data requires explicit confirmation because it is destructive.

## Settings

Canonical reference:

- The Settings panels in `app-overview.png`.
- Use `settings.png` if a standalone composite is supplied later.

Visible sections:

- General, Timer, Popout, Appearance, Data, and Advanced.

Approved decisions:

- Use the compact control patterns shown: toggles for binary settings, selectors for finite choices, swatches for accent colour, and sliders for continuous values.
- The Background control visible in an older Appearance draft is excluded. Do not implement or add a background setting.

## Popout Timer

Canonical reference:

- The popout timer states in `app-overview.png`.
- Use `popout-timer.png` if a standalone crop is supplied later.

Supplementary reference:

- The compact timer in `analytics-all-years.png` shows how the timer may coexist with another page.

Visible elements and states:

- Subject marker and name, timer value, pause, stop, and overflow controls.
- Minimal default state, controls-on-hover state, and quick-actions menu.
- Extend options matching the main running timer.

Interaction notes:

- Hover reveals controls without changing the popout's outer dimensions.
- Always-on-top, open Focus, hide timer, and close popout actions belong in the quick-actions menu.
- Popout transparency and finish behaviour follow the corresponding Settings values.

## Reference Precedence

When references disagree, use this order:

1. The latest explicit written requirement.
2. This `DESIGN.md` specification.
3. The screen's canonical image.
4. Supplementary images for shared styling only.

The newer `analytics-all-years.png` supersedes every Analytics design visible in `app-overview.png`.
