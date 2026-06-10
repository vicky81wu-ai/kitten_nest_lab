# Current Status

Updated: 2026-06-10

## Stable workflow

1. Open `/write`.
2. Paste an update package into the top package box.
3. Generate drafts.
4. Publish all drafts.
5. Verify on `/cloud`.

## Active tags

- `[coffeeCorner]` for rotating bubble lines.
- `[windowWeather]` for two-line weather text.

## Current stable runtime

- `/cloud` is the official live nest entry.
- `/cloud` routes through `api/app-coords.js` and enables the tight 19.8 coordinate hotspot.
- `/cloud-hotspot-test` remains available as a coordinate hotspot test line.
- `/cloud-coords` remains available for coordinate marker debugging.
- `/write` remains the normal phone-friendly publishing console.

## Verified behavior

- `/write` publishes `[coffeeCorner]` lines into the bubble queue.
- `/write` publishes `[windowWeather]` into `windowTemp` and `windowDesc`.
- `/cloud` shows the updated coffee-corner bubble.
- Tapping the bubble hides it.
- Tapping 19.8 shows the current bubble or advances the queue.
- If there is only one bubble, tapping 19.8 re-shows that single bubble.
- The 19.8 hotspot now uses the approved tight coordinate position on the base image.

Approved 19.8 coordinate hotspot:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

## Vercel Hobby function limit

The project hit the Vercel Hobby limit:

```text
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

To restore successful deploys, these unused or unnecessary API functions were removed:

```text
api/room-asset.js
api/registry.js
```

`api/app-assets.js` now uses static `/assets/rooms/...` image paths rather than the removed `api/room-asset.js` proxy.

## Protected behavior

- Keep `/write` publishing stable.
- Keep `/cloud` deployable under the Vercel Hobby function limit.
- Keep the coffee-corner bubble flow stable.
- Keep the tight 19.8 coordinate hotspot stable.
- Keep window weather working.
- Do not connect future rooms yet.
- Do not add new `api/*.js` wrappers unless another function is removed or existing wrappers are consolidated.

## Next architecture direction

- First document current behavior.
- Then make coordinate/hotspot config more explicit.
- Then continue front-end controller consolidation.
- Do not add more visible rooms before the current coffeeCorner runtime is stable and documented.
