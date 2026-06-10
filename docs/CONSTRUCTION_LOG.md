# Construction Log

## 2026-06-10

### Stable work completed

- `/write` now has a clearer daily package workflow.
- The main daily box is labeled as the normal entry.
- Debug and emergency direct-write areas are visually weaker.
- `[coffeeCorner]` package lines publish to the rotating bubble list.
- `[windowWeather]` package lines publish to the weather display fields.
- Coffee-corner bubble publishing has been manually verified.
- Tattoo hotspot behavior has been manually verified.
- Window weather has been manually verified.
- `assets/weather-patch.js` was added as a small independent weather updater.
- `data/room-config.v1.json` was added as a foundation-only room map.
- `PROJECT_STATUS.md` was added as the top-level project handoff summary for new construction windows.

### Current protected areas

- Keep the daily `/write` package workflow stable.
- Keep the coffee-corner bubble chain stable.
- Keep tattoo hotspot behavior stable.
- Keep window weather working.
- Keep the top-level handoff docs free of private keys or service credentials.
- Do not connect future rooms yet.

### Next recommended work

- Do not add new rooms yet.
- First document and collect architecture.
- Start with state reading.
- Then weather display.
- Then asset fallback.
- Touch bubble and hotspot behavior last.

### New-window handoff rule

- New construction windows should read `PROJECT_STATUS.md` first.
- Then read `docs/CURRENT_STATUS.md`, `docs/ARCHITECTURE_NOTES.md`, `docs/CONSTRUCTION_LOG.md`, and `data/room-config.v1.json`.
- The nest is stable but patch-layered; protect `/write`, `/cloud`, coffeeCorner bubbles, windowWeather, and 19.8 hotspot behavior before refactoring.
