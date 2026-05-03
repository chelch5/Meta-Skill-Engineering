# Meta Skill Studio - Windows Build Guide

Meta Skill Studio's supported Windows delivery path is the Tauri 2 application in this repository root.

## Supported Build Path

**Location:** `src-tauri/` with the TypeScript/Vite frontend in `src/`.

This is the cross-platform desktop application backed by the existing Python skill engine.

## Requirements

- Windows 10/11 (64-bit)
- Rust stable toolchain
- Node.js 22+
- Python 3.11 or 3.12+
- Microsoft Visual Studio C++ build tools
- WebView2 runtime

## Build and Test

```powershell
npm install
npm run build
cd src-tauri
cargo check
```

## Run the App

```powershell
npm run tauri -- dev
```

## Build the Desktop App

```powershell
npm run tauri -- build
```

Expected output:

- `src-tauri\target\release\meta-skill-studio.exe`
- installer artifacts under `src-tauri\target\release\bundle\`

## Distribution Notes

- The published executable bundles the Tauri shell, but the Python backend is still required for skill execution workflows.
- Installer artifacts are produced by the Tauri bundler.
- GitHub Actions workflows in `.github/workflows/` are the canonical automation path for CI and release packaging.
