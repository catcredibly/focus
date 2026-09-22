<p align="center">
  <img src="src/assets/focus-logo-orange.png" alt="Focus leaf logo" width="112" />
</p>

# Focus

**Time well spent.**

Focus is a Windows desktop focus timer and study tracker. It combines a clean countdown with Subjects, Academic Years, history, study goals, and long-term analytics without requiring a Focus account or cloud service.

## Features

- Focus timer with pause, extend, recovery, notes, and completion notifications
- Compact always-on-top timer popout with docking and auto-hide
- Subjects grouped into Academic Years
- Searchable, editable Session history
- Daily and weekly study goals
- Analytics for trends, streaks, Subjects, Academic Years, and study patterns
- Dark and light themes with six accent colours
- English, Simplified Chinese, Traditional Chinese, and Japanese interfaces
- Full JSON backup/restore and CSV Session import/export

## Privacy

Focus is local-first. Academic Years, Subjects, Sessions, settings, and notes are stored in IndexedDB on the device where Focus runs. The application does not upload study data to a Focus account or bundled cloud service.

Export regular backups if the data matters to you. Removing the application or its WebView storage may remove local data.

## Availability

Focus currently targets Windows. Version 1.0.0 is being prepared for limited private distribution as an NSIS installer; there is no public download yet.

## Development

### Prerequisites

- Node.js LTS and npm
- Rust stable with the MSVC toolchain
- Visual Studio Build Tools with Desktop development with C++ and a Windows SDK
- Microsoft Edge WebView2 Runtime

### Setup

```powershell
npm ci
npm run tauri dev
```

### Checks

```powershell
npm run typecheck
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

### Windows installer

```powershell
npm run tauri build
```

Generated installers and executables belong outside source control.

## Technology

- Tauri 2 and Rust
- React and TypeScript
- Vite
- Dexie and IndexedDB
- Recharts

See [Architecture](docs/ARCHITECTURE.md) for implementation details and [Releasing](docs/RELEASING.md) for the private release workflow.

## Security

Never commit personal Focus backups, signing keys, certificates, or credentials. See [SECURITY.md](SECURITY.md) for reporting and handling guidance.

## License

Focus is available under the [MIT License](LICENSE).
