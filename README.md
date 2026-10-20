# Lesisko 🌳

*Grow your own forest, one focus session at a time.* (Polish: *lesisko*, a big, wild forest.)

A cozy, Forest-style focus timer that runs as an installable web app (PWA) on iPhone — no App Store or developer account needed.

**What's different from Forest:** you can **log time you forgot to track** (e.g. "1h of studying yesterday at 14:00"), and it counts in your stats and forest like any timed session.

## Features

- **Focus timer:** countdown (5–180 min) or stopwatch; your tree grows as you focus.
- **Tags** to see where your time goes, and **12 tree species + 5 themes** to unlock with coins (1 coin per focused minute).
- **Log or edit any session:** add forgotten time, fix mistakes, delete sessions.
- **Forest view:** your trees by day, week, month or year.
- **Stats:** total focus, comparison with the previous period, a chart per hour/day/month, time per tag, and your streak.
- **Leaving the app:** a web app can't tell "locked the phone" from "opened Instagram", so you choose:
  - **Off:** leaving never hurts.
  - **Ask me** (default): after being away longer than the grace period, you're asked whether you were still focusing.
  - **Strict:** away longer than N minutes and the tree withers.
- **Block distracting apps:** a step-by-step guide in Settings for setting up an iOS Focus mode plus a Shortcuts automation that sends you back to the Home Screen when you open a blocked app. A web app can't block other apps itself.
- **English and Polish:** picked automatically from the phone's language, and switchable in Settings.
- **Import from Forest:** Forest's CSV export (Settings → Export data in Forest).
- **Backups:** export everything as JSON (share sheet → Save to Files / iCloud Drive), and restore it later.

## Data & persistence

Everything lives in IndexedDB on the device. It survives closing the app, restarts and iOS updates. Home Screen apps are also exempt from Safari's 7-day storage cleanup, and the app requests persistent storage.

It is **lost** if you delete the app from the Home Screen or wipe website data. So export a backup now and then; the app nudges you every 14 days. Cloud sync is planned for phase 2.

The running timer is mirrored to `localStorage` so it survives iOS killing the app in the background.

## Translations

All text lives in `src/i18n/en.ts` and `src/i18n/pl.ts`. Components read it via `useI18n()`, which also provides locale-aware `date()`, `duration()` and `number()`.

- `pl` is typed as `Messages` (the shape of `en`), so a missing or misnamed key fails the type-check.
- A test also checks that list lengths match and every message renders.
- Messages with numbers are functions, so each language handles its own plurals. Polish has three forms (1 drzewo, 2 drzewa, 5 drzew) via `pluralPl`.
- Wording in Polish avoids gendered verb forms.

To add a language: create `src/i18n/xx.ts` typed as `Messages`, then register it in `DICTIONARIES`, `DATE_LOCALES` and `LANGUAGES` in `src/i18n/index.tsx`, and in the `Language` type.

## Development

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN, see below)
npm test           # unit tests (vitest)
npm run test:e2e   # end-to-end tests in WebKit + Chrome with iPhone emulation
                   # (first time: npx playwright install webkit)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

**Try it on your iPhone before hosting:** with `npm run dev` running, open the "Network" URL Vite prints (e.g. `http://192.168.1.20:5173`) in Safari on a phone on the same Wi-Fi. Over plain HTTP, offline mode is disabled and Export falls back to a download instead of the share sheet; everything else works. Data saved there stays with that address, so use Export/Restore to move it.

## Installing on iPhone (once hosted)

1. Open the site in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the Home Screen icon. It opens full-screen, works offline, and updates itself.

Hosting: Netlify builds and publishes every push to `main` (settings in `netlify.toml`), and gives each branch or pull request its own preview link. GitHub Actions (`.github/workflows/ci.yml`) runs the unit tests and a build on every push.

## Code map

| Path | What |
|---|---|
| `src/App.tsx` | Tabs, theme, and restoring a running session |
| `src/components/Running.tsx` | The live timer: visibility tracking, check-in, completion |
| `src/lib/penalty.ts` | Rules for time spent away from the app |
| `src/lib/stats.ts` | Totals, chart buckets, tag breakdown, streak |
| `src/lib/forestCsv.ts` | Lenient parser for Forest's CSV export |
| `src/lib/backup.ts` | JSON backup/restore and Forest import |
| `src/store.ts`, `src/db.ts` | Dexie (IndexedDB) schema, hooks and data actions |
| `src/i18n/` | Translations (`en.ts` defines the shape, `pl.ts` must match it), plural rules, date/number formatting |
| `src/data/` | Tree species and themes (their names live in `src/i18n/`) |
