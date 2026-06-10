# Construction Log

## 2026-06-10

### Stable work completed

- `/write` now has a clearer daily package workflow.
- The main daily box is labeled as the normal entry.
- Debug and emergency direct-write areas are visually weaker.
- `[coffeeCorner]` package lines publish to the rotating bubble list.
- `[windowWeather]` package lines publish to the weather display fields.
- Coffee-corner bubble publishing has been manually verified.
- Window weather has been manually verified.
- `assets/weather-patch.js` was added as a small independent weather updater.
- `data/room-config.v1.json` was added as a foundation-only room map.
- `PROJECT_STATUS.md` was added as the top-level project handoff summary for new construction windows.

### Controller collection completed before the deploy incident

- `assets/state-client.js` exists as a shared front-end state reader.
- `assets/weather-controller.js` exists for window weather.
- `assets/asset-controller.js` exists for default assets and setup hiding.
- `assets/bubble-controller.js` exists for bubble show/hide/next logic.
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

### Current protected areas

- Keep the daily `/write` package workflow stable.
- Keep the coffee-corner bubble chain stable.
- Keep the tight 19.8 coordinate hotspot stable.
- Keep single-bubble 19.8 re-show behavior stable.
- Keep window weather working.
- Keep the top-level handoff docs free of private keys or service credentials.
- Keep deployment under the Vercel Hobby function limit.
- Do not connect future rooms yet.

### Next recommended work

- Do not add new rooms yet.
- Do not add new `api/*.js` wrappers.
- Finish documenting the current stable runtime.
- Keep coordinate/hotspot work configuration-driven inside existing front-end assets.
- Only after coffeeCorner is stable and documented should a roomEngine runtime be evaluated.

### New-window handoff rule

- New construction windows should read `PROJECT_STATUS.md` first.
- Then read `docs/CURRENT_STATUS.md`, `docs/ARCHITECTURE_NOTES.md`, `docs/CONSTRUCTION_LOG.md`, and `data/room-config.v1.json`.
- The nest is stable but patch-layered; protect `/write`, `/cloud`, coffeeCorner bubbles, windowWeather, Vercel function count, and 19.8 hotspot behavior before refactoring.
