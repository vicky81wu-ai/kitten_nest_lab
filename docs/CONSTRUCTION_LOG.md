# Construction Log

## 2026-06-10 / 2026-06-11 core construction record

This log is not a full incident diary. It keeps the important construction path, failed paths that should not be repeated, and the current protected baseline.

## Stable foundation

- `/write` remains the phone-friendly publishing console.
- Active update tags:

```text
[coffeeCorner]  -> rotating bubble queue
[windowWeather] -> windowTemp / windowDesc
[hubbyNote]     -> cloud powder notebook current page + archive
```

- `/cloud` is the official live nest entry.
- `/cloud-hotspot-test` remains available for hotspot testing.
- `/cloud-coords` remains available for coordinate marker debugging.
- `PROJECT_STATUS.md` is the read-first handoff file for new construction windows.
- `docs/CODEX_CLEANUP_PLAN.md` is the brake before future feature expansion.

## Vercel Hobby function-limit incident

Vercel failed with:

```text
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

Root lesson:

```text
Do not keep adding api/*.js wrappers.
```

Actions taken:

- Removed `api/room-asset.js`.
- Replaced the static image proxy with direct `/assets/rooms/...` paths.
- Removed `api/registry.js` because runtime did not need it.

Current direction:

```text
static assets + front-end controllers + JSON config + few shared APIs
```

## Controller collection state

Current controller foundation:

```text
assets/state-client.js
assets/weather-controller.js
assets/asset-controller.js
assets/bubble-controller.js
assets/hubby-note-controller.js
```

Cleanup principle:

```text
same behavior
fewer owners
no new API
one line at a time
```

## 19.8 coordinate hotspot

Approved tight 19.8 hotspot:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

Status:

```text
runtimeStatus: active
coordinateStatus: baseImageLocked
versionStatus: canonicalCurrent
changePolicy: mutableWithVersion
```

Meaning: this is the current official version, but it can be adjusted later through an explicit versioned change.

Important: future clock/overlay/hotspot coordinate tuning must use the successful `100lvh` canvas baseline, not older black-edge states.

## Single-bubble 19.8 fix

Problem:

```text
After a one-line [coffeeCorner] package, tapping 19.8 did not re-show the hidden bubble.
```

Cause:

```text
api/app-q.js showNext() returned false when q.length <= 1.
```

Fix:

```text
if one bubble: re-show current bubble
if multiple bubbles: advance queue
```

Status: working and protected.

## Weather line

Current state:

- Window weather displays from `windowTemp` / `windowDesc`.
- Weather area is clickable.
- Tapping it opens a small weather advice popup.
- Weather advice does not write cloud state and does not alter the main bubble queue.
- `assets/weather-controller.js` is the active owner.
- Legacy `assets/weather-patch.js` and `assets/weather-advice-hotspot.js` are retained in repo but not loaded by `/cloud` after cleanup.

Status: working; keep behavior stable.

## Powder notebook / hubbyNote

Current state:

- `[hubbyNote]` writes the current powder notebook page.
- `hubbyNoteArchive` is the permanent archive and should not be auto-trimmed.
- `hubbyNoteTrash` is soft-delete trash.
- Current page supports edit/save/favorite/delete inside `/cloud`.
- Archive items support load-to-editor/favorite/delete.
- Stored Nest key is hidden after authorization and only reappears when changing key.
- `api/set-state.js` guards against old cached `/write` pages accidentally sending `[hubbyNote]` as a bubble.
- Standalone `assets/hubby-note-auth-guard.js` was removed after key hiding moved into `hubby-note-controller`.

Status: working; future notebook visual polish should wait for dedicated notebook art.

## Object identity rule

Static identity layer:

```text
data/object-registry.v1.json
data/room-config.v1.json
```

Long-term rule:

```text
No identity, no binding.
```

Do not build blacklists like "X cannot steal Y". Use:

```text
id
selector
owner
exclusive
runtimeStatus
versionStatus
changePolicy
```

Short specimen: a notebook entry once reused the game console selector and took over the game menu. The long-term fix is selector ownership and `exclusive:true`, not a growing casebook.

## PWA black-edge fix

Symptom:

```text
Screen-home PWA showed a persistent bottom black edge.
It happened with default assets and locally uploaded horizontal images.
```

Failed paths that should not be repeated blindly:

```text
bottom overscan / extending the canvas downward
warm-color visual fallback strip
html/body background-image safe-area fallback
```

Confirmed:

```text
viewport-fit=cover was already present in index.html
```

Successful path:

```text
assets/canvas-fill.css uses viewport-height ownership:
height: 100vh
height: 100dvh
height: 100lvh
```

Successful test:

```text
https://kitten-nest-lab.vercel.app/cloud?v=0611-canvas-lvh-test
```

Result:

```text
Old screen-home PWA became full-screen and visually clean.
```

Current protected baseline:

```text
PWA / screen-home /cloud uses 100lvh canvas baseline.
Do not break this for Safari-web polish.
```

## Safari/web canvas attempt

Observation:

```text
Safari web may show a bottom browser-toolbar / address-bar artifact while the PWA is clean.
```

Likely reason:

```text
Safari browser UI participates in dynamic viewport calculation and can overlay the bottom of the page.
```

Attempted fix:

```text
Use browser-only 100dvh split while keeping PWA at 100lvh.
```

Result:

```text
Failed. It brought back a black bottom edge in the screen-home PWA and only changed the Safari artifact into a black edge.
```

Decision:

```text
Restore pure 100lvh PWA baseline.
Do not keep experimenting on the main /cloud canvas for Safari-web polish.
If Safari-web needs perfection later, create a separate route such as /cloud-web with its own canvas rules.
```

## Current protected areas

Protect these before refactoring:

```text
/write publishing workflow
/cloud deployability under Vercel Hobby limit
coffeeCorner bubble queue
single-bubble 19.8 re-show behavior
19.8 tight coordinate hotspot
successful 100lvh PWA canvas baseline
windowWeather display
weather advice popup
powder notebook current page/archive/favorite/delete/trash/key hiding
game console / GAME MENU hotspot ownership
setup/materials panel manual access
local image upload override pipeline
object identity registry
```

## Next recommended work

- Do not add new rooms yet.
- Do not add new `api/*.js` wrappers.
- Do not tune clock/overlay coordinates until the `100lvh` baseline remains stable.
- If Safari-web canvas polish is needed, use a separate route instead of touching the main `/cloud` PWA canvas.
- Continue cleanup one line at a time, preserving visible behavior.

## New-window handoff rule

New construction windows should read:

```text
PROJECT_STATUS.md
docs/CURRENT_STATUS.md
docs/ARCHITECTURE_NOTES.md
docs/CONSTRUCTION_LOG.md
docs/CONSTRUCTION_RULES.md
docs/CODEX_CLEANUP_PLAN.md
data/room-config.v1.json
data/object-registry.v1.json
```
