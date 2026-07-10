# TokenTrack

Dual **Auto** (green) and **API** (orange) token-usage progress bars in the Cursor status bar.

No API key. TokenTrack reads the session Cursor already stores when you are signed in, then polls usage every 15 seconds.

## Install

### From VSIX

```bash
npm install
npm run package
```

In Cursor: **Extensions: Install from VSIX…** → select `tokentrack-0.1.0.vsix`.

### Development

```bash
npm install
npm run compile
```

Press **F5** (Run Extension) to open an Extension Development Host.

## What you see

| Item | Meaning |
|------|---------|
| `Auto ████░░░░ 42%` | Auto-mode usage (`autoPercentUsed`) |
| `API ██░░░░░░ 18%` | API / named-model usage (`apiPercentUsed`) |
| `Total ████░░░░ 55%` | Fallback when Auto/API split is not returned |

Click either bar to refresh. Hover for exact percentages, renew date, and a link to the usage dashboard.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokentrack.pollIntervalSeconds` | `15` | Refresh interval (min 5) |
| `tokentrack.barWidth` | `8` | ASCII bar width |
| `tokentrack.showAuto` | `true` | Show Auto bar |
| `tokentrack.showApi` | `true` | Show API bar |

## How it works

1. Reads `cursorAuth/accessToken` from Cursor’s local SQLite DB (`state.vscdb`) via native SQLite (not loaded fully into memory).
2. Calls `POST https://api2.cursor.sh/aiserver.v1.DashboardService/GetCurrentPeriodUsage`.
3. Renders two status-bar items from `planUsage.autoPercentUsed` and `planUsage.apiPercentUsed`.

The token is never stored by TokenTrack — each refresh re-reads Cursor’s DB, so signing out clears access automatically.

### Database paths

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| Windows | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |
| Linux | `~/.config/Cursor/User/globalStorage/state.vscdb` |

## Commands

- **TokenTrack: Refresh Usage**
- **TokenTrack: Open Usage Dashboard**

## Disclaimer

This is **not** an official Cursor product. It uses undocumented local storage keys and internal HTTPS endpoints that can change without notice.

## License

MIT
