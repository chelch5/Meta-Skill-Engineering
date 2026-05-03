---
name: screenshot
description: "Capture desktop screenshots (full screen, app window, or pixel region) on macOS, Linux, and Windows. Triggers on: 'take a screenshot', 'capture my screen', 'screenshot of app', 'screen region', 'window capture'."
version: 1.0
lifecycle: unverified
tags: [screenshot, screen-capture, macos, linux, windows, desktop]
triggers:
  - "take a screenshot"
  - "capture my screen"
  - "screenshot of app"
  - "screen region"
  - "window capture"
  - "capture the screen"
---

> Source: https://github.com/openai/skills/tree/main/skills/.curated skills/.curated/screenshot

# Screenshot Capture

## When to use

- User explicitly asks for a desktop, system, or app screenshot
- Tool-specific capture is unavailable for the target application
- Comparing a design view (e.g., Figma) against a running application
- Inspecting a visual UI state that cannot be conveyed in text

## When NOT to use

- A dedicated capture tool exists for the target (e.g., Figma MCP, Playwright, agent-browser tools)
- The request is for a screenshot of a web page or browser content (use browser-devtools or equivalent)
- Only text/status information is needed (no visual comparison required)
- The user wants a recording (video), not a still image

## Tool priority

1. Tool-specific screenshot capabilities first (Figma MCP, Playwright, browser tools)
2. This skill for whole-system desktop captures
3. OS-level commands as fallback when helpers are unavailable

## Save-location rules

1. User-specified path: save there
2. User asked without a path: save to the OS default screenshot location
3. Agent visual inspection: save to the temp directory

## Output contract

Each invocation prints one output path per capture. Multiple windows or displays produce one path per line with `-w<windowId>` or `-d<display>` suffixes. Report every printed path in the response.

## Procedure

### Preflight: macOS Screen Recording permission

Run once before window or app capture on macOS:

```bash
bash <path-to-skill>/scripts/ensure_macos_permissions.sh
```

To combine preflight and capture in one command:

```bash
bash <path-to-skill>/scripts/ensure_macos_permissions.sh && \
python3 <path-to-skill>/scripts/take_screenshot.py --app "<AppName>"
```

### Cross-platform helper (macOS and Linux)

```bash
python3 <path-to-skill>/scripts/take_screenshot.py [options]
```

| Option | Description |
|--------|-------------|
| `--path <path>` | Output file path or directory |
| `--mode default\|temp` | `default` saves to OS screenshot folder; `temp` saves to temp dir |
| `--app "<name>"` | macOS only: capture all windows matching app name (substring) |
| `--window-name "<title>"` | macOS only: filter by window title (use with `--app`) |
| `--list-windows --app "<name>"` | macOS only: list matching window ids and exit |
| `--window-id <id>` | Capture a specific window id |
| `--active-window` | Capture the focused/frontmost window |
| `--region x,y,w,h` | Capture a pixel region (x, y, width, height) |
| `--interactive` | Use OS interactive selection picker |
| `--format png\|jpg\|...` | Image format (default: png) |

**Common patterns:**

- Default (OS screenshot folder):
  `python3 <path-to-skill>/scripts/take_screenshot.py`
- Temp dir for agent inspection:
  `python3 <path-to-skill>/scripts/take_screenshot.py --mode temp`
- Explicit path:
  `python3 <path-to-skill>/scripts/take_screenshot.py --path output/screen.png`
- App window capture (macOS):
  `python3 <path-to-skill>/scripts/take_screenshot.py --app "Codex"`
- Specific window within app (macOS):
  `python3 <path-to-skill>/scripts/take_screenshot.py --app "Codex" --window-name "Settings"`
- List window ids before capturing (macOS):
  `python3 <path-to-skill>/scripts/take_screenshot.py --list-windows --app "Codex"`
- Pixel region:
  `python3 <path-to-skill>/scripts/take_screenshot.py --mode temp --region 100,200,800,600`
- Active/focused window:
  `python3 <path-to-skill>/scripts/take_screenshot.py --mode temp --active-window`
- Specific window id:
  `python3 <path-to-skill>/scripts/take_screenshot.py --window-id 12345`

### Windows helper

```powershell
powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1 [options]
```

| Parameter | Description |
|-----------|-------------|
| `-Path "<path>"` | Output file path |
| `-Mode default\|temp` | Save destination |
| `-Region x,y,w,h` | Pixel region |
| `-ActiveWindow` | Capture focused window |
| `-WindowHandle <id>` | Capture specific window handle |

**Common patterns:**

- Default:
  `powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1`
- Temp dir:
  `powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1 -Mode temp`
- Explicit path:
  `powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1 -Path "C:\Temp\screen.png"`
- Pixel region:
  `powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1 -Mode temp -Region 100,200,800,600`
- Active window:
  `powershell -ExecutionPolicy Bypass -File <path-to-skill>/scripts/take_screenshot.ps1 -Mode temp -ActiveWindow`

### Direct OS commands (fallback only)

Use when bundled helpers cannot be run.

**macOS:**

- Full screen to path:
  `screencapture -x output/screen.png`
- Pixel region:
  `screencapture -x -R100,200,800,600 output/region.png`
- Specific window id:
  `screencapture -x -l12345 output/window.png`
- Interactive selection:
  `screencapture -x -i output/interactive.png`

**Linux:**

- Full screen via scrot:
  `scrot output/screen.png`
- Full screen via gnome-screenshot:
  `gnome-screenshot -f output/screen.png`
- Full screen via ImageMagick:
  `import -window root output/screen.png`
- Pixel region via scrot:
  `scrot -a 100,200,800,600 output/region.png`
- Pixel region via ImageMagick:
  `import -window root -crop 800x600+100+200 output/region.png`
- Active window via scrot:
  `scrot -u output/window.png`
- Active window via gnome-screenshot:
  `gnome-screenshot -w -f output/window.png`

### Linux tool selection

The helper auto-selects available tools in this order: `scrot` → `gnome-screenshot` → ImageMagick `import`. If none are available, ask the user to install one and retry.

### Multi-display behavior

- **macOS**: Full-screen captures save one file per display.
- **Linux/Windows**: Full-screen captures use the virtual desktop (all monitors in one image). Use `--region` to isolate a specific display.

## Failure handling

| Symptom | Resolution |
|---------|------------|
| macOS "screen capture blocked in sandbox" | Rerun with escalated permissions |
| macOS "could not create image from display" | Rerun `ensure_macos_permissions.sh` with elevated permissions |
| Swift ModuleCache permission errors | Rerun with escalated permissions; the helper routes module cache to `$TMPDIR/codex-swift-module-cache` |
| macOS app/window capture returns no matches | Run `--list-windows --app "<AppName>"`, verify app is on screen, retry with `--window-id` |
| Linux region/window capture fails | Check tool availability: `command -v scrot`, `command -v gnome-screenshot`, `command -v import` |
| Linux no screenshot tool found | Ask user to install `scrot`, `gnome-screenshot`, or `ImageMagick` |
| Permission error saving to OS default location | Rerun with escalated permissions |
| `--app`/`--window-name`/`--list-windows` on non-macOS | These flags are macOS-only; use `--active-window` or `--window-id` on Linux/Windows |

Report every saved file path in the response.

## Next steps

- **Compare designs**: After capturing a Figma or design tool view, use this skill to capture the running app for pixel comparison.
- **Browser content**: If the target is a web page, consider a browser-devtools MCP or Playwright capture instead of this skill.
- **Visual inspection workflow**: Capture to temp, view each printed path with an image viewer, then decide if manipulation is needed.

## References

- [macOS screencapture man page](https://ss64.com/mac/screencapture.html)
- [scrot documentation](https://github.com/dreamer/scrot)
- [ImageMagick import](https://imagemagick.org/script/import.php)
