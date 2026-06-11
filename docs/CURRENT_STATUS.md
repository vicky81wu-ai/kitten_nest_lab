# Current Status

Updated: 2026-06-11

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
- `/write` remains the phone-friendly publishing console.
- The weather text area is a clickable weather advice hotspot.
- The powder notebook has a cloud-backed current page, permanent archive, in-nest editor, favorite/delete controls, soft-delete trash, and stored-key hiding.
- The game console hotspot remains the GAME MENU entry.
- The setup/materials panel is hidden by default but has a manual entry button and must remain available.
- Local image upload remains an active protected override pipeline.
- The screen-home PWA canvas black-edge issue is fixed by the `100lvh` canvas baseline in `assets/canvas-fill.css`.

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
- The powder notebook entry is `#hubbyNoteButton`; it must not reuse the game console selector.
- Tapping the game console opens GAME MENU through the console hotspot.
- The powder notebook can be edited and saved directly inside `/cloud` through existing `/api/set-state`.
- The powder notebook supports current-page edit, favorite, delete, archive-item load/edit, archive-item favorite, and archive-item delete.
- Notebook deletion is soft-delete into `hubbyNoteTrash`, not permanent destruction.
- Stored Nest key is hidden in the notebook panel after authorization; the panel shows an authorized chip and only reveals key input when changing key.
- The setup/materials panel can be opened manually and closed; default hiding must not seal local upload.
- The old screen-home PWA now renders the coffee-corner canvas full-screen with the `100lvh` canvas test path.
- Safari/web may still show browser-toolbar overlay artifacts near the bottom; the primary target is the screen-home PWA.
- Old cached `/write` pages that accidentally send `[hubbyNote]` as a bubble are protected by `api/set-state.js`, which reroutes the write into the notebook fields instead of polluting the bubble queue.

Approved 19.8 coordinate hotspot:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

The approved coordinate is current official truth, not permanent immutability:

```text
coordinateStatus: baseImageLocked
versionStatus: canonicalCurrent
changePolicy: mutableWithVersion
```

## Canvas baseline

The current screen-home PWA canvas baseline is:

```text
assets/canvas-fill.css
height: 100vh
height: 100dvh
height: 100lvh
```

Successful test path:

```text
https://kitten-nest-lab.vercel.app/cloud?v=0611-canvas-lvh-test
```

Do not tune clock/overlay coordinates against older black-edge canvas states. Future coordinate work should use the `100lvh` baseline.

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
- Keep the successful `100lvh` PWA canvas baseline stable.
- Keep window weather working.
- Keep weather advice popup working.
- Keep powder notebook current note, permanent archive, in-nest editor, favorite/delete controls, trash, and key hiding working.
- Keep game console / GAME MENU hotspot ownership stable.
- Keep setup/materials panel manual access available.
- Keep local image upload override available.
- Do not connect future rooms yet.
- Do not add new `api/*.js` wrappers unless another function is removed or existing wrappers are consolidated.

## Current cleanup mode

The project is stable but patch-layered.

Next work should follow `docs/CODEX_CLEANUP_PLAN.md` and `docs/CONSTRUCTION_RULES.md`:

```text
same behavior
fewer owners
no new API
one line at a time
no identity, no binding
```

Weather line has been partially cleaned: `weather-controller` is now the runtime owner of display and advice hotspot behavior, and the legacy weather patch/guard are no longer loaded by `/cloud`.

Powder notebook line has been partially cleaned: `hubby-note-controller` owns display, edit/save, favorite/delete, soft-delete trash, and stored-key hiding. The standalone notebook auth guard was removed.

Object identity is now documented in static configuration:

```text
data/object-registry.v1.json
data/room-config.v1.json
```

Do not add more visible rooms before these cleaned lines remain stable through normal use.
