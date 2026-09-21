# Focus development rules

- Target Windows first.
- Do not replace the approved UI design without explicit instruction.
- Prefer TypeScript for application logic.
- Rust should only handle native Tauri/Windows functionality.
- Keep the database local-first.
- Use Dexie/IndexedDB for persistent study data.
- Avoid unnecessary dependencies.
- Run typecheck/build tests after meaningful changes.
- Do not delete or migrate existing user data without an explicit migration.
- Keep completed sessions backwards-compatible.

## Design References

- Always inspect `docs/design/DESIGN.md` before changing UI.
- Use the canonical reference images in `docs/design/`.
- Do not redesign approved screens without explicit instruction.
- Written requirements and `docs/design/DESIGN.md` override obsolete visual drafts.
