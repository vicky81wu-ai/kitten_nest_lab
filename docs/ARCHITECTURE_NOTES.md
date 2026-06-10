# Architecture Notes

Updated: 2026-06-10

## Current chain

```text
/write package
  -> pending drafts
  -> publish all
  -> shared state
  -> /cloud
  -> coffee-corner bubble and window weather
```

## Current file roles

- `index.html`: original page structure, room DOM, local image setup, base interactions.
- `api/app-q.js`: server-side page hydration and the main cloud bridge for bubbles.
- `api/app-assets.js`: default asset injection, fallback image handling, setup hiding, extra small scripts.
- `assets/weather-patch.js`: small independent weather display updater.
- `write.html`: writer console, package parsing, draft creation, publish-all workflow.
- `data/room-config.v1.json`: future room map. Foundation only. Not runtime yet.

## Technical debt

The app works, but page state and display updates are spread across multiple places.

Highest-risk area:

- coffee-corner bubble display
- tattoo hotspot behavior

Do not start refactoring from that area.

## Collection order

Recommended order:

1. `stateClient`: collect state reading first.
2. `weatherController`: collect weather display second.
3. `assetController`: collect default assets and setup hiding third.
4. `bubbleController`: collect bubble and hotspot behavior last.
5. `roomConfig`: only evaluate runtime connection after the above are stable.

## Principle

Do not add more rooms before collecting the current working patches into clearer modules.
