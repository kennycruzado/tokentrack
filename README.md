# TokenTrack

See your **Cursor Premium** token usage at a glance — compact **FPM** (green) and **API** (orange) meters in the status bar.

**FPM** means **First-party models** (Cursor’s included / auto models). **API** is usage for API and named models.

No API key setup. If you’re signed into Cursor, TokenTrack just works. Sign out, and it stops automatically.

## Features

- Live **FPM** (First-party models) and **API** usage meters in the status bar
- Compact 5-block bars: `FPM: ■■□□□ 41%`
- Hover for exact percentages and renew date
- Click a meter to refresh instantly
- Open your Cursor usage dashboard from the tooltip or Command Palette
- Configurable poll interval and which meters to show

## Requirements

- [Cursor](https://cursor.com) with an active signed-in session (Premium usage data comes from your account)
- Works locally on your machine — TokenTrack does not store your session

## How to use

1. Install **TokenTrack** from the marketplace
2. Stay signed into Cursor
3. Look at the **bottom-right status bar** for the meters

| What you see | Meaning |
|--------------|---------|
| `FPM: ■■□□□ 41%` | First-party models usage this billing period |
| `API: ■□□□□ 20%` | API / named-model usage this billing period |

### Commands

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- **TokenTrack: Refresh Usage**
- **TokenTrack: Open Usage Dashboard**

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokentrack.pollIntervalSeconds` | `20` | How often usage refreshes (5–600) |
| `tokentrack.showFpm` | `true` | Show the FPM (First-party models) meter |
| `tokentrack.showApi` | `true` | Show the API meter |

## Privacy

- Reads your existing Cursor session from local storage only when needed
- Does **not** save or cache your access token
- Signing out of Cursor clears access on the next refresh

## Disclaimer

TokenTrack is **not** an official Cursor product. It uses local session data and Cursor’s usage API, which may change without notice.

## License

MIT
