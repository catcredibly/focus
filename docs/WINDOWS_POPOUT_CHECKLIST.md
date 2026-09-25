# Windows popout regression checklist

Use a development build and synthetic timer data. Test both Regular and Compact layouts with running and paused timers.

- [ ] Single monitor: all four dock corners and both adjacent Reveal edge choices; Floating uses its nearest edge without corner flipping.
- [ ] Two monitors: move the floating timer between them, including a secondary display left of the primary (negative X) and above it (negative Y).
- [ ] Mixed 100%, 125%, and 150% scaling: tab stays on the timer's actual monitor, stays within its usable work area, and retains sensible size.
- [ ] All practical taskbar edges, taskbar resizing, and taskbar auto-hide: change work area while the reveal tab is visible.
- [ ] Change resolution and scaling while the reveal tab is visible; disconnect/reconnect a monitor and rearrange displays.
- [ ] While auto-hidden, change corner, Reveal edge, selected monitor, tab size, and layout: tab updates without revealing or focusing the timer.
- [ ] While closed, repeat Settings and display changes: no timer, menu, or reveal tab reappears.
- [ ] Close while a geometry refresh is pending: all popout windows disappear; the timer continues in Focus and can be reopened manually.
- [ ] Completion, Stop and save, and Void close the timer/menu/tab. Pausing keeps the popout available.
- [ ] Moving, docking, changing layouts, and revealing never reset the active timer or change its elapsed time.
- [ ] Compact: hover and keyboard focus reveal all controls to the right; Extend, Stop, Void, More, Close, and pin remain usable.

Development-only logs identify display refresh reasons, timer physical bounds/work area/scale, selected edge, and native tab placement. Ordinary drag movement does not reposition a hidden tab continuously. No production diagnostics UI or polling loop is added.

Automated tests cover geometry calculations and lifecycle invariants. Physical multi-monitor, taskbar, resolution, disconnect/reconnect, and Windows DPI transitions require this manual pass; a compile or browser test does not verify them.

Validation for this change (25 September 2026): frontend typecheck and all 136 existing/new frontend tests passed, followed by all 12 native-bridge tests after the final hidden-state adjustment (137 frontend cases total). Headless Edge exercised both Academic Year panels in Light/Dark mode, all corner/edge choices, conditional settings, and goal keyboard/commit/persistence behavior. The earlier Compact pass checked all three sizes, hover shrink, right-side controls, pause/resume, and external menu routing.

`cargo check` passed and `cargo tree -e features -i reqwest@0.13.5` retained the provider-enabled `rustls` / AWS-LC path. Rust unit-test linking was blocked by unavailable MSVC `link.exe`. No native display/taskbar/mixed-DPI manual scenario above is claimed as verified. No production build, installer, tag, release, or updater artifact was created. The normal Node installation on H: became unavailable; frontend checks ran using VS Code's bundled Node runtime.
