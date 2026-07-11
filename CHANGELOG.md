# Changelog

All notable changes to TokenTrack are documented here.

## [0.1.5] - 2026-07-11

### Changed
- Status bar shows **FPM** (First-party models) and **API** only — removed the Total meter
- Documented that **FPM** means **First-party models** (README, settings, tooltips, package description)
- Compact **5-block** usage bars (`FPM: ██░░░ 41%`), with each block ≈ 20%
- Tooltips show percentages and renew date only (dropped Cursor API display copy that could show misleading “usage limit” messages)
- FPM meter uses a fixed green (`#3DDC97`); API stays orange (`#F5A623`)

### Fixed
- Progress-bar fill math so blocks match percentage bands correctly
- Status-bar colors not applying reliably via custom theme color IDs

## [0.1.4] - 2026-07-11

### Changed
- Marketplace README rewritten for end users; developer setup lives in `DEVELOPMENT.md`
- Changelog added for marketplace release notes

## [0.1.3] - 2026-07-10

### Changed
- Compact 3-block meters with blue Total / green FPM / orange API colors

## [0.1.2] - 2026-07-10

### Changed
- Renamed Auto → **FPM** in the status bar
- Switched briefly to chip-style status text before returning to block meters

## [0.1.1] - 2026-07-10

### Added
- Extension icon and gallery banner
- User-facing marketplace README

### Changed
- Auth reads Cursor’s `state.vscdb` via native SQLite (no full-file sql.js load)

## [0.1.0] - 2026-07-10

### Added
- Initial release: status-bar Auto/API usage meters for Cursor Premium
- Local session read (no API key), polling refresh, dashboard link
