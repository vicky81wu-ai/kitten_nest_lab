# Kitten Nest Cloud Project Status

Updated: 2026-06-10

This is the top-level handoff file for the Kitten Nest Cloud project. New construction windows should read this file first, then read the detailed docs in `docs/` and the foundation config in `data/room-config.v1.json`.

Private write keys and service credentials must never be committed to this repository. Repository docs should only use placeholders such as `<NEST_TOKEN>`, `<SUPABASE_URL>`, and `<SUPABASE_SERVICE_KEY>`.

---

## 1. Repository and stable entry points

Repository:

```text
vicky81wu-ai/kitten_nest_lab
```

Public deployment:

```text
https://kitten-nest-lab.vercel.app
```

Current stable cloud nest entry:

```text
https://kitten-nest-lab.vercel.app/cloud
```

Current writer console:

```text
https://kitten-nest-lab.vercel.app/write
```

Current daily rule: use `/write` for publishing text updates and `/cloud` for checking the live nest.

---

## 2. Current deployment status

Current stable deployment has been verified after the Vercel Hobby function-limit incident.

Latest verified runtime changes:

```text
- `api/room-asset.js` was removed.
- `api/registry.js` was removed.
- `api/app-assets.js` now uses static `/assets/rooms/...` image paths instead of the removed room-asset API proxy.
- `/cloud` now routes through `api/app-coords.js`.
- The approved tight 19.8 coordinate hotspot is active on `/cloud`.
- Single-bubble publishing was fixed: tapping 19.8 can re-show the only current bubble.
```

Important Vercel constraint:

```text
Vercel Hobby deployment fails when more than 12 Serverless Functions are added.
```

Do not add new `api/*.js` wrapper files casually. Prefer static assets, front-end controllers, JSON configuration, and existing API wrappers.

---

## 3. Project goal

The project is turning the original static Kitten Nest page into a cloud-backed nest:

- Vicky can publish text updates from a phone-friendly writer console.
- Alex can prepare update packages for Vicky to paste into `/write`.
- Text state lives in cloud state.
- Local images remain user-controlled in the browser where possible.
- GitHub-hosted default images are used as static fallback assets.
- Future direct tool writing is possible, but it is not the current daily workflow.

Current important principle:

```text
Keep the existing coffeeCorner / windowWeather / 19.8 workflow stable before adding more rooms.
```

---

## 4. Stable daily workflow

The stable daily publishing chain is:

```text
Alex update package
  -> /write
  -> generate drafts
  -> pendingDrafts in cloud state
  -> publish all drafts
  -> cloud state
  -> /cloud
  -> coffeeCorner bubble / windowWeather / 19.8 coordinate hotspot behavior
```

Vicky's normal operation:

1. Open `/write`.
2. Paste the whole Alex update package into the top package box.
3. Click `生成草稿`.
4. Click `一键发布全部`.
5. Open `/cloud` and verify.

The debug direct-write sections in `/write` are not the normal daily path. They are only for fallback/debug use.

---

## 5. Current active update package tags

Only these tags are active in the current runtime:

### `[coffeeCorner]`

Each non-empty line becomes one rotating coffee-corner bubble.

Publishes to state fields:

```text
alexBubble
alexBubbles
bubbleIndex
```

### `[windowWeather]`

Line 1 becomes `windowTemp`; line 2 becomes `windowDesc`.

Publishes to state fields:

```text
windowTemp
windowDesc
```

Future room tags may exist in parser/config notes, but they should not be connected to visible front-stage runtime yet.

---

## 6. Stable and manually verified features

The following are considered stable and protected:

- `/write` writer console daily package workflow.
- `[coffeeCorner]` publishing to rotating bubble lines.
- `[windowWeather]` publishing to the small window weather text.
- `/cloud` displaying the current coffee-corner bubble queue.
- 19.8 tattoo hotspot behavior:
  - `/cloud` uses the tight coordinate hotspot.
  - tapping the bubble hides the bubble;
  - tapping the 19.8 hotspot shows the current bubble or advances the queue;
  - if only one bubble exists, tapping 19.8 re-shows that single bubble.
- Window weather display.
- Static default room images and fallback behavior for `/cloud`.
- Local user-uploaded image priority where the browser has local image data.

Approved 19.8 coordinate hotspot:

```text
x = 0.73
y = 0.345
width = 0.15
height = 0.08
```

---

## 7. Current runtime state model

The primary cloud state object currently includes active fields such as:

```text
alexBubble
alexBubbles
bubbleIndex
windowTemp
windowDesc
pendingDrafts
previousPublished
lastPublishedAt
updatedAt
```

Earlier cloud-heartbeat fields may also exist, such as:

```text
hubbyNote
moodNote
roomStatus
```

Those older fields are part of the project's history and may be useful later, but the current active front-stage text ports are `coffeeCorner.bubbles` and `coffeeCorner.windowWeather`.

---

## 8. Current important files and roles

### `index.html`

Original front-end page. Contains room DOM, setup/material upload panel, browser local image storage, base room switching, base `say()` bubble behavior, original 19.8 tattoo click behavior, clock, moon/day-night behavior, photo wall, and game menu logic.

Do not treat `index.html` as a clean module yet. It is still the original monolithic front-stage page.

### `api/app-q.js`

Server-side cloud page generator and main cloud bridge for bubbles.

It reads public state, injects the initial bubble text, injects a browser bridge for the bubble queue, and controls the stable hide/show/advance behavior for the coffee-corner bubble and 19.8 hotspot. It now handles single-bubble queues correctly.

This is a sensitive file. Do not start refactoring here without a clear rollback plan.

### `api/app-assets.js`

Wrapper around `api/app-q.js` for static default asset injection, setup-panel hiding patches, small text refresh behavior, and the weather patch script.

It now points default room images directly at static `/assets/rooms/...` files. Do not reintroduce `api/room-asset.js` just to proxy static images.

### `api/app-coords.js`

Coordinate-controller wrapper. `/cloud`, `/cloud-coords`, and `/cloud-hotspot-test` route here. On `/cloud`, it enables the tight 19.8 coordinate hotspot. On `/cloud-coords`, it can still show the coordinate marker.

### `assets/hotspot-positioner.js`

Applies the approved coordinate-locked 19.8 hotspot using base-image coordinates and `object-fit: cover` math.

### `assets/weather-patch.js`

Small independent weather updater. It reads current state, then updates `#temp` and `#desc` from `windowTemp` and `windowDesc`.

Do not delete this file until a replacement `weatherController` has been proven equivalent in the live `/cloud` route.

### `write.html`

Phone-friendly writer console. It reads current state, creates `pendingDrafts`, publishes drafts into active state fields, and supports direct debug writes only as fallback.

Do not break this workflow.

### `data/room-config.v1.json`

Foundation-only room configuration. It documents active room/text ports, current coordinate anchors, and future room intent. It is not a full runtime room engine yet.

---

## 9. Removed API functions

Removed to stay under the Vercel Hobby function limit:

```text
api/room-asset.js
api/registry.js
```

Reasoning:

- `api/room-asset.js` only proxied static room images and was replaced with direct static asset paths.
- `api/registry.js` was a future-facing registry endpoint, not required for current `/cloud`, `/write`, coffeeCorner bubbles, windowWeather, or 19.8 behavior.

Future work should avoid adding new `api/*.js` files unless an existing function is removed or multiple wrappers are consolidated first.

---

## 10. Protected areas: do not touch casually

Do not change these during status/documentation work:

- private write key handling;
- cloud state storage setup;
- `/api/state`;
- `/api/set-state`;
- `/api/mcp`;
- `/write` daily workflow;
- `api/app-q.js` bubble bridge without a rollback plan;
- 19.8 tattoo hotspot behavior;
- coffee-corner bubble publishing chain;
- window weather display chain;
- `assets/weather-patch.js` before an equivalent replacement is verified;
- future room runtime display.

---

## 11. Current technical debt

The project works, but the front-end behavior is still spread across several layers.

Main technical debt:

1. State reading is repeated.
   - `api/app-q.js` reads state server-side and in the bridge.
   - `api/app-assets.js` injects another text refresh patch.
   - `assets/weather-patch.js` reads state independently.
   - `write.html` reads state for console status.

2. Bubble ownership is split.
   - `index.html` has original `say()` and tattoo click behavior.
   - `api/app-q.js` protects cloud bubble behavior.
   - `assets/bubble-controller.js` exists as collected front-end logic.

3. Weather is working but still has redundancy.
   - `assets/weather-patch.js` is simple and stable.
   - `assets/weather-controller.js` exists, but do not remove the old patch until equivalence is proven.

4. Asset fallback is patch-based.
   - `api/app-assets.js` injects default images, fallback behavior, and setup hiding from the server wrapper.
   - `assets/asset-controller.js` exists but runtime layering still needs cleanup.

5. Coordinate hotspot is active but not fully configuration-driven.
   - 19.8 is coordinate-locked through `assets/hotspot-positioner.js`.
   - Future hotspots/overlays should move toward configuration-driven placement instead of hard-coded one-off scripts.

---

## 12. Recommended next order

Do not add new visible rooms yet.

Recommended order:

```text
1. Keep `/cloud` and `/write` stable.
2. Keep API function count under the Vercel Hobby limit.
3. Record approved 19.8 coordinates in room config.
4. Make coordinate/hotspot logic more configuration-driven inside existing front-end assets.
5. Only after coffeeCorner is stable, evaluate a roomEngine runtime.
```

Do not add new room APIs. Do not add new hotspot APIs. Do not add new image proxy APIs.

---

## 13. Future rooms policy

Future rooms are documented but not active.

Do not connect these to front-stage runtime yet:

```text
restaurant
fountain
privateRoom
bedroom
photoBooth
```

Do not add visible restaurant/fountain/privateRoom/bedroom/photoBooth text in `/cloud` until there is a real room engine and separate text ports.

---

## 14. Quick test package

Use this to verify the current stable active ports:

```text
[coffeeCorner]
0610 稳定回归验收。
小猫坐在咖啡角，奶栗看窗。

[windowWeather]
26°C
Tiny breeze
```

Expected result:

- `/write` parses the package into drafts.
- Publish all writes bubble and weather fields.
- `/cloud` shows the new coffee-corner bubble queue.
- `/cloud` shows `26°C` and `Tiny breeze` near the window.
- Bubble click hides the bubble.
- 19.8 tight coordinate hotspot shows the current bubble or advances the bubble queue.
- If only one bubble exists, 19.8 still re-shows that single bubble.
