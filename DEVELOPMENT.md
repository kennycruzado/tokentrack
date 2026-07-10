# Development

For contributors working on TokenTrack from this repository.

## Setup

```bash
npm install
npm run compile
```

Press **F5** (Run Extension) to open an Extension Development Host.

## Package a VSIX

```bash
npm run package
```

Then in Cursor: **Extensions: Install from VSIX…** → select the generated `.vsix`.

## Publish

1. Bump `version` in `package.json`
2. `npm run package` to verify the VSIX
3. Publish with your usual flow (`vsce publish` / Open VSX / Cursor marketplace)

Marketplace listing text comes from `README.md`. The extension icon is `icon.png` (128×128), referenced by `package.json` → `icon`.
