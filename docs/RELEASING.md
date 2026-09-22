# Private Windows Releases

Focus is currently distributed privately as a Windows NSIS installer. Do not commit generated installers or the `src-tauri/target/` directory.

## Stable Identity

These values are release identities and must remain stable after 1.0.0:

- Product name: `Focus`
- Tauri application identifier: `com.focus.timer`
- Dexie database name: `focus`
- Primary installer format: NSIS

Changing the identifier or database name can make an upgrade behave like a separate application or lose access to existing local study data.

## Prepare a Version

1. Choose the next semantic version.
2. Update `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and `src-tauri/tauri.conf.json` consistently.
3. Confirm the worktree contains no personal exports, IndexedDB data, timer recovery state, or signing material.
4. Export a full JSON backup before any test that could affect an existing installation.

## Validate

```powershell
npm ci
npm run typecheck
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri build
```

The intended private-distribution artifact is:

```text
src-tauri/target/release/bundle/nsis/Focus_<version>_x64-setup.exe
```

Retain the previous installer temporarily for rollback and upgrade testing. Share only the installer, not the entire target directory.

## Install and Upgrade Test

Use an isolated Windows account, virtual machine, or Windows Sandbox rather than the only real Focus data store.

1. Install the previous version.
2. Create a synthetic Academic Year, Subject, Session, note, and changed setting.
3. Close Focus and install the new version over it.
4. Verify all synthetic data remains correct, no Sessions are duplicated, and About shows the new version.
5. Verify timer, popout, themes, accent logos, backup/export/import, restart persistence, Start menu entry, and uninstall entry.
6. Uninstall the isolated test copy when finished.

For the first release, perform a clean install and verify the empty state before adding synthetic data.

## Signing

Windows Authenticode signing is not currently configured. An unsigned private build is acceptable, but Windows may display Unknown Publisher or SmartScreen warnings.

If signing is added later, keep PFX/P12 files and passwords outside Git and inject them only from a secure release environment.

## Future Distribution

Public GitHub Releases and automatic updates may be added in a later milestone. They are intentionally not part of the current private-release workflow.
