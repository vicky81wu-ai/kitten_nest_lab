# Architecture Notes

Updated: 2026-06-10

## Current chain

```text
/write package
  -> pending drafts
  -> publish all
  -> shared state
  -> /cloud
  -> coffee-corner bubble, window weather, weather advice, 19.8 hotspot, and powder notebook
```

## Current live route chain

```text
/cloud
  -> api/app-coords
  -> api/app-bubble
  -> api/app-assetctl
  -> api/app-weather
  -> api/app-assets
  -> api/app-q
```

`/cloud-hotspot-test` and `/cloud-coords` also route through `api/app-coords.js`.

## Vercel Hobby constraint

The project hit the Vercel Hobby limit of 12 Serverless Functions. New construction must assume API function count is a hard budget.

Do not use this pattern anymore:

```text
one room -> one API
one hotspot -> one API
one image proxy -> one API
one wrapper experiment -> one API
```

Preferred pattern:

```text
static assets
+ front-end controllers
+ JSON room config
+ a small number of shared API functions
```

Removed functions:

```text
api/room-asset.js
api/registry.js
```

`api/room-asset.js` was replaced by direct static `/assets/rooms/...` paths. `api/registry.js` was not needed for current runtime.

## Current file roles

- `index.html`: original page structure, room DOM, local image setup, base interactions.
- `api/app-q.js`: server-side page hydration and main cloud bridge for bubbles. It owns the protective cloud bubble behavior and supports single-bubble 19.8 re-show.
- `api/set-state.js`: cloud state writer. It also guards against old cached `/write` pages accidentally sending `[hubbyNote]` as a bubble and reroutes that write into notebook fields.
- `api/app-assets.js`: default static asset injection, fallback image handling, setup hiding, legacy text/weather patch injection, and weather hotspot guard injection.
- `api/app-weather.js`: injects `state-client` and `weather-controller` around the asset stack.
- `api/app-assetctl.js`: injects `asset-controller` around the weather stack.
- `api/app-bubble.js`: injects `bubble-controller` and `hubby-note-controller` around the asset-controller stack.
- `api/app-coords.js`: injects coordinate and hotspot scripts. It is the current `/cloud` wrapper.
- `assets/hotspot-positioner.js`: applies the tight 19.8 coordinate hotspot using base-image cover math.
- `assets/weather-controller.js`: intended main weather controller for temp/desc display and weather advice popup.
- `assets/weather-patch.js`: legacy independent weather updater retained as fallback.
- `assets/weather-advice-hotspot.js`: small weather hotspot guard that keeps the weather area clickable and delegates to weather advice behavior when available.
- `assets/hubby-note-controller.js`: cloud powder notebook popup, current note display, and recent permanent archive preview.
- `write.html`: writer console, package parsing, draft creation, publish-all workflow, `[hubbyNote]` permanent archive publishing.
- `data/room-config.v1.json`: foundation-only room map and element card documentation. Not a full roomEngine runtime yet.

## Current coordinate state

The approved 19.8 hotspot is active on `/cloud`:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

This is locked to the base image, not to viewport percentage.

## Current patch ownership

The app works, but page state and display updates are spread across multiple layers.

### Bubble ownership

```text
index.html original bubble behavior
api/app-q.js cloud bridge and 19.8 bubble protection
assets/bubble-controller.js collected controller layer
```

Status: stable, but split. Do not refactor first unless bubble breaks.

### Weather ownership

```text
assets/weather-controller.js intended main owner
assets/weather-patch.js legacy fallback owner
assets/weather-advice-hotspot.js hotspot guard
api/app-weather.js controller injection
api/app-assets.js legacy patch/guard injection
```

Status: stable and verified, but most patch-layered. This should be the first cleanup line.

Goal: `assets/weather-controller.js` should eventually own temp/desc display, hotspot binding, and advice popup. Then `weather-patch.js` and `weather-advice-hotspot.js` can be removed only after equivalent behavior is verified.

### Hubby note ownership

```text
write.html publishes current note and permanent archive
api/set-state.js protects old cached writes
assets/hubby-note-controller.js displays notebook popup
```

Status: stable after cache accident. UI polish should wait for future notebook art.

## Technical debt

Highest-risk areas:

- coffee-corner bubble display;
- 19.8 tattoo hotspot behavior;
- `/write` publish path;
- weather line duplicated ownership;
- Vercel function-count budget.

Do not start large multi-line refactors.

## Collection order

Recommended order:

1. Keep deployment under the Vercel Hobby function limit.
2. Keep `/write` and `/cloud` stable.
3. Clean up one line at a time, starting with weather.
4. Keep visible behavior identical during cleanup.
5. Deploy and verify after each line.
6. Update docs and room-config.
7. Evaluate `roomConfig` runtime connection later.
8. Resume visible room expansion only after cleanup is under control.

## Principle

Do not add more rooms before the current coffeeCorner runtime is stable, deployable, and documented.

Do not add new API functions for room/hotspot/image work. Use static files, front-end controllers, and config whenever possible.

Cleanup slogan:

```text
same behavior, fewer owners, no new API, one line at a time
```
