# TokenTrack

See your **Cursor Premium** token usage at a glance — dual **Auto** (green) and **API** (orange) progress bars in the status bar.

No API key setup. If you’re signed into Cursor, TokenTrack just works. Sign out, and it stops automatically.

## Features

- Live **Auto** and **API** usage bars in the status bar
- Hover for exact percentages, renew date, and plan notes
- Click a bar to refresh instantly
- Open your Cursor usage dashboard from the tooltip or Command Palette
- Configurable poll interval, bar width, and which bars to show

## Requirements

- [Cursor](https://cursor.com) with an active signed-in session (Premium usage data comes from your account)
- Works locally on your machine — TokenTrack does not store your session

## How to use

1. Install **TokenTrack** from the marketplace
2. Stay signed into Cursor
3. Look at the **bottom-right status bar** for the Auto / API bars

| What you see | Meaning |
|--------------|---------|
| `Auto ████░░░░ 42%` | Auto-mode usage this billing period |
| `API ██░░░░░░ 18%` | API / named-model usage this billing period |
| `Total ████░░░░ 55%` | Shown only if Auto/API split isn’t available |

### Commands

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- **TokenTrack: Refresh Usage**
- **TokenTrack: Open Usage Dashboard**

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokentrack.pollIntervalSeconds` | `15` | How often usage refreshes (5–600) |
| `tokentrack.barWidth` | `8` | Width of each progress bar |
| `tokentrack.showAuto` | `true` | Show the Auto bar |
| `tokentrack.showApi` | `true` | Show the API bar |

## Privacy

- Reads your existing Cursor session from local storage only when needed
- Does **not** save or cache your access token
- Signing out of Cursor clears access on the next refresh

## Disclaimer

TokenTrack is **not** an official Cursor product. It uses local session data and Cursor’s usage API, which may change without notice.

## License

MIT
