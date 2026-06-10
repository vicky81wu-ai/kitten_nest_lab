# Architecture Notes

Updated: 2026-06-10

## Current chain

```text
/write package
  -> pending drafts
  -> publish all
  -> shared state
  -> /cloud
  -> coffee-corner bubble, window weather, and coordinate-locked 19.8 hotspot
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
- `api/app-q.js`: server-side page hydration and main cloud bridge for bubbles. It owns the protective cloud bubble behavior and now supports single-bubble 19.8 re-show.
- `api/app-assets.js`: default static asset injection, fallback image handling, setup hiding, extra small scripts.
- `api/app-weather.js`: injects `state-client` and `weather-controller` around the asset stack.
- `api/app-assetctl.js`: injects `asset-controller` around the weather stack.
- `api/app-bubble.js`: injects `bubble-controller` around the asset-controller stack.
- `api/app-coords.js`: injects coordinate and hotspot scripts. It is the current `/cloud` wrapper.
- `assets/hotspot-positioner.js`: applies the tight 19.8 coordinate hotspot using base-image cover math.
- `assets/weather-patch.js`: small independent weather display updater retained as a fallback.
- `write.html`: writer console, package parsing, draft creation, publish-all workflow.
- `data/room-config.v1.json`: foundation-only room map and coordinate documentation. Not a full runtime room engine yet.

## Current coordinate state

The approved 19.8 hotspot is active on `/cloud`:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

This is locked to the base image, not to viewport percentage.

## Technical debt

The app works, but page state and display updates are spread across multiple layers.

Highest-risk areas:

- coffee-corner bubble display;
- 19.8 tattoo hotspot behavior;
- `/write` publish path;
- Vercel function-count budget.

Do not start large refactors from those areas.

## Collection order

Recommended order:

1. Keep deployment under the Vercel Hobby function limit.
2. Keep `/write` and `/cloud` stable.
3. Document current runtime and approved coordinates.
4. Make hotspot/overlay placement more configuration-driven inside existing front-end assets.
5. Continue controller consolidation only after current behavior is protected.
6. Evaluate `roomConfig` runtime connection later.

## Principle

Do not add more rooms before the current coffeeCorner runtime is stable, deployable, and documented.

Do not add new API functions for room/hotspot/image work. Use static files, front-end controllers, and config whenever possible.
