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
- `api/app-assets.js`: default static asset injection, fallback image handling, setup hiding, and legacy text patch injection. It no longer loads the legacy weather patch or weather hotspot guard.
- `api/app-weather.js`: injects `state-client` and `weather-controller` around the asset stack.
- `api/app-assetctl.js`: injects `asset-controller` around the weather stack.
- `api/app-bubble.js`: injects `bubble-controller` and `hubby-note-controller` around the asset-controller stack.
- `api/app-coords.js`: injects coordinate and hotspot scripts. It is the current `/cloud` wrapper.
- `assets/hotspot-positioner.js`: applies the tight 19.8 coordinate hotspot using base-image cover math.
- `assets/weather-controller.js`: current runtime owner for temp/desc display, weather hotspot binding, and weather advice popup.
- `assets/weather-patch.js`: legacy fallback file retained in the repo but not loaded by `/cloud` after weather cleanup.
- `assets/weather-advice-hotspot.js`: legacy guard file retained in the repo but not loaded by `/cloud` after weather cleanup.
- `assets/hubby-note-controller.js`: current runtime owner for the cloud powder notebook popup, current note display, in-nest edit/save, archive preview, favorite/delete controls, soft-delete trash, and stored-key hiding.
- `write.html`: writer console, package parsing, draft creation, publish-all workflow, `[hubbyNote]` publishing, and backup publishing path.
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

## Current ownership after cleanup

The app works and has fewer duplicated owners than before.

### Bubble ownership

```text
index.html original bubble behavior
api/app-q.js cloud bridge and 19.8 bubble protection
assets/bubble-controller.js collected controller layer
```

Status: stable, but still split. Do not refactor first unless bubble breaks.

### Weather ownership

```text
assets/weather-controller.js owns active weather runtime
api/app-weather.js injects it
assets/weather-patch.js retained but not loaded
assets/weather-advice-hotspot.js retained but not loaded
```

Status: stable after cleanup. Visible behavior must remain: weather text displays and tapping weather opens the advice popup.

Future cleanup: after longer stability, remove unused legacy weather files if no rollback need remains.

### Hubby note ownership

```text
assets/hubby-note-controller.js owns active notebook runtime
write.html remains backup/package publishing path
api/set-state.js protects old cached writes and handles cloud writes
```

Status: stable after cleanup. `hubby-note-controller` owns display, edit/save, favorite/delete, archive preview, soft-delete trash, and stored-key hiding. The standalone notebook auth guard was removed.

Future UI polish should wait for dedicated notebook art. Entry point/hotspot can change later without changing save/archive logic.

## Technical debt

Highest-risk areas:

- coffee-corner bubble display;
- 19.8 tattoo hotspot behavior;
- `/write` publish path;
- Vercel function-count budget;
- old wrapper chain depth.

Do not start large multi-line refactors.

## Collection order

Recommended order:

1. Keep deployment under the Vercel Hobby function limit.
2. Keep `/write` and `/cloud` stable.
3. Clean up one line at a time.
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
