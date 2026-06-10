# Codex-style Cleanup Plan

Updated: 2026-06-10

This file is the construction brake. Read it before adding new features.

## Current mode

The nest is stable but patch-layered.

Current verified features:

- `/cloud` opens successfully.
- `/write` publishes coffeeCorner bubbles.
- `[windowWeather]` updates window weather.
- `[hubbyNote]` saves the cloud notebook.
- `hubbyNoteArchive` is the permanent notebook archive.
- 19.8 tight coordinate hotspot works.
- Weather advice popup works.
- Vercel deploys are success and must stay under the Hobby function limit.

## Main rule

Do not add new rooms or new API functions during cleanup.

Cleanup means:

```text
same visible behavior
less duplicated ownership
clearer controller responsibility
updated docs and room-config
```

## Current patch map

### Bubble line

Current owners:

- `index.html`: original `say()` and bubble behavior.
- `api/app-q.js`: cloud bubble bridge, queue reading, hide/show/next, single-bubble fix.
- `assets/bubble-controller.js`: collected front-end bubble controller.

Status:

```text
stable, but ownership is split
```

Do not refactor this first unless bubble behavior breaks.

### Weather line

Current owners:

- `assets/weather-controller.js`: intended main controller for window weather and weather advice popup.
- `assets/weather-patch.js`: legacy state reader and weather updater retained as fallback.
- `assets/weather-advice-hotspot.js`: small guard that keeps the weather area clickable and delegates to the weather controller.
- `api/app-weather.js`: injects `state-client` and `weather-controller`.
- `api/app-assets.js`: still injects the legacy weather patch and weather hotspot guard.

Status:

```text
verified working, but most patch-layered line
```

Cleanup target:

```text
weather-controller should become the single owner of:
- temp/desc display
- weather hotspot binding
- weather advice popup
```

Then remove or demote:

```text
weather-patch.js
weather-advice-hotspot.js
```

Only do this after a safe no-visual-change refactor and deployment success.

### Hubby note line

Current owners:

- `write.html`: parses `[hubbyNote]`, creates drafts, publishes current note and permanent archive.
- `api/set-state.js`: protects against old cached `/write` mistakenly sending `[hubbyNote]` as a bubble.
- `assets/hubby-note-controller.js`: displays the cloud notebook popup and recent archive preview.

Status:

```text
stable after cache accident; has backend safety guard
```

Future UI:

```text
wait for dedicated notebook art before building date search, edit, delete, favorite, or page-turn hotspots
```

### Coordinate hotspot line

Current owners:

- `assets/hotspot-positioner.js`: active 19.8 coordinate hotspot card.
- `data/room-config.v1.json`: records hotspot and overlay cards.
- `api/app-coords.js`: injects coordinate/hotspot scripts for `/cloud`.

Status:

```text
stable
```

Future target:

```text
read more hotspot/overlay cards from config-like structures, but do not fetch or add an API yet
```

## Cleanup order

Do not clean everything at once.

Recommended order:

```text
1. Weather line cleanup
2. Hubby note docs/card sync
3. Bubble line ownership review
4. Coordinate/overlay card generalization
5. Wrapper consolidation review
6. Only then resume new rooms
```

## How to clean one line

For each line:

1. Identify current owners.
2. Pick one future owner.
3. Move behavior without changing what Vicky sees.
4. Keep old fallback temporarily.
5. Deploy and verify.
6. Remove old fallback only after the new owner is proven.
7. Update docs and room-config.

## Stop conditions

Stop and ask Vicky to verify if any of these change:

- `/cloud` does not open.
- `/write` cannot publish.
- coffeeCorner bubble does not update.
- 19.8 does not show/hide bubble.
- weather advice popup does not open.
- powder notebook does not show current note.
- Vercel is not success.

## One-line command

```text
Codex-style cleanup: same behavior, fewer owners, no new API, one line at a time.
```
