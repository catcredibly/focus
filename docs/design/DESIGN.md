# Focus Design Specification

This document records which supplied screenshots are authoritative and the UI decisions that are not safely inferred from a still image. Written task requirements and this document override older screenshots.

## Global Application Shell

Canonical references:

- `reference/app-overview.png` for the shared Windows application frame and navigation.
- The screen-specific canonical image listed below for each content area.

Supplementary references:

- `reference/analytics-all-years.png` and `reference/timer-running-draft-1.png` show the shell at different window sizes.

Approved decisions:

- Use the dark desktop application shell, left navigation, Focus identity, and compact Windows-first layout shown in the references.
- Preserve the navigation hierarchy: Timer, Analytics, History, Subjects, Academic Years, Import / Export, and Settings.
- Keep the active navigation item clearly highlighted.
- Do not add a photographic, scenic, illustrated, or decorative page background. Use the plain application surfaces shown in the newer references.

## Timer - Idle

Canonical reference:

- `reference/timer-idle.png` when supplied as a standalone image.

Supplementary reference:

- The Timer panel in `reference/app-overview.png` documents the idle controls and Today panel.

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

- `reference/timer-running-draft-1.png`.

Supplementary references:

- `reference/popout-timer.png` only for shared timer controls and extension choices.
- The Timer panel in `reference/app-overview.png` only for shared shell styling.

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

- `reference/analytics-all-years.png`.

Supplementary reference:

- `reference/app-overview.png` may be used only for shared shell styling.

Intentionally excluded:

- The Analytics page shown inside `reference/app-overview.png`. It is an obsolete iteration and must not guide the Analytics layout, information architecture, charts, or controls.

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

Final V0.4 behavior:

- Analytics contains Overview, Subjects, Academic Years, Time Trends, and Study Patterns sub-tabs. All Years is an Academic Year filter, not a tab.
- The shared Academic Year and calendar-range filters apply consistently across relevant views.
- All calculations use non-archived completed Sessions and `focusedDurationSeconds`. Wall-clock duration is not used as focus duration.
- Date, day, month, and streak grouping use local calendar boundaries. Weeks run Monday through Sunday.
- Subjects with the same display name remain separate records when they belong to different Academic Years.
- Overlapping curriculum and Independent Study periods are additive. A Session's stored Subject and Academic Year association is authoritative; Academic Year date ranges are never used to infer ownership.
- Long monthly timelines, cumulative trends, rolling-average trends, and daily activity heatmaps retain readable minimum widths and scroll horizontally.
- Long timelines and activity heatmaps open at the latest available period and provide a compact Jump to latest action for returning after historical review.
- The continuous All Years activity heatmap uses one consistent scale calculated from all currently filtered Sessions. Academic Year detail heatmaps calculate their scale independently and display the true P90 and clean interval.
- Heatmap P90 uses active days only; zero-study days are excluded. Calculate `rawStep = P90 / 4`, then snap that single step to the nearest 5 minutes when under 30 minutes or the nearest 15 minutes otherwise. Thresholds are exactly 1x, 2x, 3x, and 4x the clean step; values above 4x remain at maximum intensity.
- Heatmap cells expose local date, actual focused duration, and Session count. Visual intensity never replaces the authoritative duration shown in the tooltip.
- Activity heatmaps show aligned month/year markers. Selecting or focusing a cell reveals the same date, duration, and Session count available on hover, with at most three Subject rows and a compact remaining-count indicator.
- Analytics tables use bounded internal scrolling for large Subject collections, while long Subject and Academic Year names remain distinguishable through their paired labels and native title text.
- Rolling 7-day and 30-day averages use calendar days, including zero-study days.
- Time-of-day patterns distribute focused duration proportionally across each wall-clock bucket a Session crosses. This is an approximation because pause locations are not stored.
- Analytics is read-only and presents factual measurements only; it does not generate productivity scores, advice, or subjective rankings.

## History

Canonical reference:

- The History panel in `reference/app-overview.png`.

Visible elements:

- Search, academic-year, subject, and status filters.
- Session table with date, start, end, duration, subject, academic year, status, and note.
- Pagination and rows-per-page control.

Interaction notes:

- Filters combine and update the table.
- Session rows remain manageable through the application's edit/archive workflow.

## Subjects

Canonical reference:

- The Subjects panel in `reference/app-overview.png`.
- Use `reference/subjects-academic-years.png` if a standalone crop is supplied later.

Visible elements:

- Academic-year selector, search, filtering, and Add Subject action.
- Active and Archived tabs.
- Subject colour, name, session count, total time, and row actions.

## Academic Years

Canonical reference:

- The Academic Years panel in `reference/app-overview.png`.
- Use `reference/subjects-academic-years.png` if a standalone crop is supplied later.

Visible elements:

- Add Academic Year action.
- Current, future, and past/other groups with dates, subject/session totals, duration, and row actions.

## Import / Export

Canonical reference:

- The Import / Export panel in `reference/app-overview.png`.

Visible elements:

- Export format selection and Export Data action.
- File drop area and file chooser.
- Merge and replace import options.
- Local-storage and backup reminder.

Interaction notes:

- Replacing all data requires explicit confirmation because it is destructive.

## Settings

Canonical reference:

- The Settings panels in `reference/app-overview.png`.
- Use `reference/settings.png` if a standalone composite is supplied later.

Visible sections:

- General, Timer, Popout, Appearance, Data, and Advanced.

Approved decisions:

- Use the compact control patterns shown: toggles for binary settings, selectors for finite choices, swatches for accent colour, and sliders for continuous values.
- The Background control visible in an older Appearance draft is excluded. Do not implement or add a background setting.

## Popout Timer

Canonical reference:

- The popout timer states in `reference/app-overview.png`.
- Use `reference/popout-timer.png` if a standalone crop is supplied later.

Supplementary reference:

- The compact timer in `reference/analytics-all-years.png` shows how the timer may coexist with another page.

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

The newer `reference/analytics-all-years.png` supersedes every Analytics design visible in `reference/app-overview.png`.
