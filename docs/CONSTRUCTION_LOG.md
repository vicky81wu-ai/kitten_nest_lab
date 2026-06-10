# Construction Log

## 2026-06-10

### Stable work completed

- `/write` now has a clearer daily package workflow.
- The main daily box is labeled as the normal entry.
- Debug and emergency direct-write areas are visually weaker.
- `[coffeeCorner]` package lines publish to the rotating bubble list.
- `[windowWeather]` package lines publish to the weather display fields.
- `[hubbyNote]` package blocks publish to the cloud powder notebook.
- Coffee-corner bubble publishing has been manually verified.
- Window weather has been manually verified.
- Powder notebook display has been manually verified.
- `assets/weather-patch.js` was added as a small independent weather updater and remains a fallback.
- `data/room-config.v1.json` was added as a foundation-only room map.
- `PROJECT_STATUS.md` was added as the top-level project handoff summary for new construction windows.
- `docs/CODEX_CLEANUP_PLAN.md` was added as the cleanup brake before future feature work.

### Controller collection completed before the deploy incident

- `assets/state-client.js` exists as a shared front-end state reader.
- `assets/weather-controller.js` exists for window weather and weather advice popup behavior.
- `assets/asset-controller.js` exists for default assets and setup hiding.
- `assets/bubble-controller.js` exists for bubble show/hide/next logic.
- `assets/hubby-note-controller.js` exists for the cloud powder notebook popup.
- These controllers have been tested in layers, but the runtime still has legacy patches that should not be removed casually.

### Coordinate hotspot work

- `assets/coordinate-controller.js` was added for coordinate marker debugging.
- `assets/hotspot-positioner.js` was added for base-image coordinate hotspot positioning.
- Vicky approved the tight 19.8 hotspot:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

- `/cloud` now routes through `api/app-coords.js`.
- The tight 19.8 coordinate hotspot is active on `/cloud`.
- `/cloud-hotspot-test` remains available as the test line.
- `/cloud-coords` remains available as the marker/debug line.

### Vercel Hobby function-limit incident

Vercel failed deployments with:

```text
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

Root lesson:

```text
Do not keep adding api/*.js wrappers.
```

Actions taken:

- Removed `api/room-asset.js`.
- Updated `api/app-assets.js` to use static `/assets/rooms/...` image paths directly.
- Removed `api/registry.js` because it was not required for current `/cloud`, `/write`, coffeeCorner bubbles, windowWeather, or 19.8 behavior.
- Deployment returned to Vercel success after these removals.

### Single-bubble hotspot fix

After `/write` published a one-line `[coffeeCorner]` package, the bubble updated but the 19.8 hotspot did not re-show it after hiding.

Cause:

```text
api/app-q.js showNext() returned false when q.length <= 1.
```

Fix:

```text
If q.length === 1, 19.8 now re-shows the current single bubble.
If q.length > 1, 19.8 advances the queue.
```

This was deployed successfully and manually verified.

### Weather advice hotspot

- The weather text area became a clickable hotspot.
- Tapping it opens a small weather advice popup.
- It uses `windowTemp` and `windowDesc` as context.
- The popup does not write cloud state and does not alter the main bubble queue.
- `assets/weather-controller.js` is the intended main owner.
- `assets/weather-patch.js` and `assets/weather-advice-hotspot.js` are currently fallback/guard layers.

Status:

```text
working, but patch-layered; first cleanup target
```

### Powder notebook / hubbyNote

- `[hubbyNote]` was added to `/write`.
- `hubbyNote` is the current notebook page.
- `hubbyNoteArchive` is the permanent archive and should not be auto-trimmed.
- `hubbyNoteHistory` remains only a compatibility/recent-summary field.
- `assets/hubby-note-controller.js` displays the notebook popup.
- `api/set-state.js` now guards against old cached `/write` pages accidentally sending `[hubbyNote]` as a bubble and reroutes that write into notebook fields.

Status:

```text
current note and permanent archive verified
UI polish/search/edit/delete should wait for future notebook art
```

### Current protected areas

- Keep the daily `/write` package workflow stable.
- Keep the coffee-corner bubble chain stable.
- Keep the tight 19.8 coordinate hotspot stable.
- Keep single-bubble 19.8 re-show behavior stable.
- Keep window weather working.
- Keep weather advice popup working.
- Keep powder notebook current note and permanent archive working.
- Keep the old cached `/write` guard in `api/set-state.js` until cache issues are no longer a risk.
- Keep the top-level handoff docs free of private keys or service credentials.
- Keep deployment under the Vercel Hobby function limit.
- Do not connect future rooms yet.

### Next recommended work

- Do not add new rooms yet.
- Do not add new `api/*.js` wrappers.
- Follow `docs/CODEX_CLEANUP_PLAN.md`.
- First cleanup target: weather line.
- Cleanup should preserve visible behavior while reducing duplicated ownership.

### New-window handoff rule

- New construction windows should read `PROJECT_STATUS.md` first.
- Then read `docs/CURRENT_STATUS.md`, `docs/ARCHITECTURE_NOTES.md`, `docs/CONSTRUCTION_LOG.md`, `docs/CODEX_CLEANUP_PLAN.md`, and `data/room-config.v1.json`.
- The nest is stable but patch-layered; protect `/write`, `/cloud`, coffeeCorner bubbles, windowWeather, weather advice, powder notebook, Vercel function count, and 19.8 hotspot behavior before refactoring.
