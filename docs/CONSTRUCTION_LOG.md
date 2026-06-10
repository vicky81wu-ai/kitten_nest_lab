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
- `data/room-config.v1.json` was added as a foundation-only room map.
- `PROJECT_STATUS.md` was added as the top-level project handoff summary for new construction windows.
- `docs/CODEX_CLEANUP_PLAN.md` was added as the cleanup brake before future feature work.

### Controller collection completed before the deploy incident

- `assets/state-client.js` exists as a shared front-end state reader.
- `assets/weather-controller.js` exists for window weather and weather advice popup behavior.
- `assets/asset-controller.js` exists for default assets and setup hiding.
- `assets/bubble-controller.js` exists for bubble show/hide/next logic.
- `assets/hubby-note-controller.js` exists for the cloud powder notebook popup.
- These controllers have been tested in layers. Current cleanup mode is to make each line own its behavior clearly and remove extra guard scripts only after verification.

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

### Weather advice hotspot and cleanup

- The weather text area became a clickable hotspot.
- Tapping it opens a small weather advice popup.
- It uses `windowTemp` and `windowDesc` as context.
- The popup does not write cloud state and does not alter the main bubble queue.
- `assets/weather-controller.js` is now the active runtime owner for window weather display, hotspot binding, and the weather advice popup.
- `assets/weather-patch.js` is retained in the repo as a legacy fallback file but is no longer loaded by `/cloud`.
- `assets/weather-advice-hotspot.js` is retained in the repo as a legacy guard file but is no longer loaded by `/cloud`.

Status:

```text
working after cleanup; weather line has fewer active owners
```

### Powder notebook / hubbyNote

- `[hubbyNote]` was added to `/write`.
- `hubbyNote` is the current notebook page.
- `hubbyNoteArchive` is the permanent archive and should not be auto-trimmed.
- `hubbyNoteHistory` remains only a compatibility/recent-summary field.
- `hubbyNoteTrash` is the soft-delete trash bucket.
- `hubbyNoteFavorite` marks the current page as favorited.
- `assets/hubby-note-controller.js` displays the notebook popup.
- `/cloud` notebook panel can directly edit and save the current page through existing `/api/set-state`.
- Current page supports edit, save, favorite, and delete.
- Archive preview items support load-to-editor, favorite, and delete.
- Deletion is soft-delete into `hubbyNoteTrash`, not permanent destruction.
- Stored Nest key is hidden in the notebook panel after authorization and only reappears when changing key.
- `api/set-state.js` guards against old cached `/write` pages accidentally sending `[hubbyNote]` as a bubble and reroutes that write into notebook fields.
- Standalone `assets/hubby-note-auth-guard.js` was removed after key hiding was folded into `assets/hubby-note-controller.js`.

Status:

```text
current note, permanent archive, in-nest editor, favorite/delete, soft-delete trash, and key hiding are working; visual polish should wait for dedicated notebook art
```

### Current protected areas

- Keep the daily `/write` package workflow stable.
- Keep the coffee-corner bubble chain stable.
- Keep the tight 19.8 coordinate hotspot stable.
- Keep single-bubble 19.8 re-show behavior stable.
- Keep window weather working.
- Keep weather advice popup working.
- Keep powder notebook current note, archive, in-nest editor, favorite/delete, soft-delete trash, and key hiding working.
- Keep the old cached `/write` guard in `api/set-state.js` until cache issues are no longer a risk.
- Keep the top-level handoff docs free of private keys or service credentials.
- Keep deployment under the Vercel Hobby function limit.
- Do not connect future rooms yet.

### Next recommended work

- Do not add new rooms yet.
- Do not add new `api/*.js` wrappers.
- Follow `docs/CODEX_CLEANUP_PLAN.md`.
- Continue cleanup one line at a time.
- Cleanup should preserve visible behavior while reducing duplicated ownership.
- Future pure UI polish for the notebook should wait for dedicated notebook art.

### New-window handoff rule

- New construction windows should read `PROJECT_STATUS.md` first.
- Then read `docs/CURRENT_STATUS.md`, `docs/ARCHITECTURE_NOTES.md`, `docs/CONSTRUCTION_LOG.md`, `docs/CODEX_CLEANUP_PLAN.md`, and `data/room-config.v1.json`.
- The nest is stable but still has wrapper-chain debt; protect `/write`, `/cloud`, coffeeCorner bubbles, windowWeather, weather advice, powder notebook, Vercel function count, and 19.8 hotspot behavior before refactoring.
