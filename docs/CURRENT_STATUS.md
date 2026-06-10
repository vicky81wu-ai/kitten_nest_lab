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
- `[hubbyNote]` for the cloud powder notebook.

## Current stable runtime

- `/cloud` is the official live nest entry.
- `/cloud` routes through `api/app-coords.js` and enables the tight 19.8 coordinate hotspot.
- `/cloud-hotspot-test` remains available as a coordinate hotspot test line.
- `/cloud-coords` remains available for coordinate marker debugging.
- `/write` remains the normal phone-friendly publishing console.
- The weather text area is now also a clickable weather advice hotspot.
- The powder notebook has a cloud-backed current page and permanent archive.

## Verified behavior

- `/write` publishes `[coffeeCorner]` lines into the bubble queue.
- `/write` publishes `[windowWeather]` into `windowTemp` and `windowDesc`.
- `/write` publishes `[hubbyNote]` into `hubbyNote` and appends older pages to `hubbyNoteArchive`.
- `/cloud` shows the updated coffee-corner bubble.
- Tapping the bubble hides it.
- Tapping 19.8 shows the current bubble or advances the queue.
- If there is only one bubble, tapping 19.8 re-shows that single bubble.
- The 19.8 hotspot uses the approved tight coordinate position on the base image.
- Tapping the window weather area opens the weather advice popup.
- Tapping the powder notebook entry opens the cloud notebook popup.
- Old cached `/write` pages that accidentally send `[hubbyNote]` as a bubble are protected by `api/set-state.js`, which reroutes the write into the notebook fields instead of polluting the bubble queue.

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
- Keep weather advice popup working.
- Keep powder notebook current note and permanent archive working.
- Do not connect future rooms yet.
- Do not add new `api/*.js` wrappers unless another function is removed or existing wrappers are consolidated.

## Current cleanup mode

The project is stable but patch-layered.

Next work should follow `docs/CODEX_CLEANUP_PLAN.md`:

```text
same behavior
fewer owners
no new API
one line at a time
```

The first cleanup target is the weather line, because it currently has `weather-controller`, `weather-patch`, and `weather-advice-hotspot` cooperating.

Do not add more visible rooms before this cleanup pass is under control.
