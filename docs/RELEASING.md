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

Use a virtual machine, or Windows Sandbox rather than the only real Focus data store.

1. Install the previous version.
2. Create a synthetic Academic Year, Subject, Session, note, and changed setting.
3. Close Focus and install the new version over it.
4. Verify all synthetic data remains correct, no Sessions are duplicated, and About shows the new version.
5. Verify timer, popout, themes, accent logos, backup/export/import, restart persistence, Start menu entry, and uninstall entry.
6. Uninstall the isolated test copy when finished.

For the first release, perform a clean install and verify the empty state before adding synthetic data.

## Signing

The public updater verification key is stored in `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`, alongside the HTTPS GitHub Releases endpoint. The temporary `docs/focus.key.pub` copy has been incorporated into that configuration. This public key is safe to commit. The official Tauri 2 updater is integrated, with main-window-only check/install/restart permissions and updater artifacts enabled for future packaging.

The updater private key and its password belong only in the existing GitHub Actions secrets (`TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`), never in application configuration or frontend code.

Windows Authenticode signing is not currently configured. An unsigned private build is acceptable, but Windows may display Unknown Publisher or SmartScreen warnings.

If signing is added later, keep PFX/P12 files and passwords outside Git and inject them only from a secure release environment.

## Future Distribution

### Canonical repository and update artifacts

The canonical repository is `catcredibly/focus-app`. Project metadata and the updater use `https://github.com/catcredibly/focus-app/releases/latest/download/latest.json`.

Before a separately authorized release, confirm the repository and manifest are publicly accessible, and that the release contains signed Windows updater artifacts, signatures, and a valid `windows-x86_64` or `windows-x86_64-nsis` manifest entry. Earlier observations about the former repository do not establish the current repository's visibility or assets. Preserve the established local NSIS release method; do not assume a remote signing workflow exists.

The app distinguishes a confirmed missing manifest (public repository reachable, manifest HTTP 404) from an inaccessible repository. Both automatic failures remain silent. About shows the missing-information message only for a confirmed missing manifest; inaccessible/network/service failures retain the ordinary failure message. Development diagnostics record the category and sanitized transport details. Cryptographic verification remains with the official Tauri updater.

### Local TLS/startup correction — 25 September 2026

`cargo tree -e features -i reqwest@0.13.5` identified `tauri-plugin-updater` 2.12.0's default `rustls-tls` feature as the source of `reqwest/rustls-no-provider`. Focus's direct diagnostic client could be created before any updater client had installed/configured a provider. Focus now explicitly enables Reqwest's normal `rustls` feature, which enables its AWS-LC provider path. No second TLS backend or per-request provider installation was added. This local configuration failure is separate from the repository accessibility or missing release artifacts.

The startup check is scheduled asynchronously after restored settings and two animation frames. React mounting, main-window creation, and Tauri setup do not wait for network results. Automatic checks keep their checking state out of the UI, while manual About checks retain progress/results. An early, theme-cached application surface and native background avoid the default white WebView flash. No runtime startup measurements or tests were run for this correction, at the user's request; Cargo feature inspection only.

Release configuration is deferred until the existing release method is confirmed. Preserve that method; do not create or run a new publishing workflow merely to test updates. The v1.3.0 bootstrap release must be installed manually over v1.2.0 once. Future signed releases can then be discovered through the configured `latest.json` endpoint.

The current development pass does not bump versions or authorize a production build, installer, tag, release, or uploaded artifact. Validate using `npm run typecheck`, `npm test`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `npm run tauri dev`. End-to-end signed update installation requires a separately authorized future release.
