# Kitten Nest Cloud Project Status

Updated: 2026-06-10

This is the top-level handoff file for the Kitten Nest Cloud project. New construction windows should read this file first, then read the detailed docs in `docs/` and the foundation config in `data/room-config.v1.json`.

Private write keys and service credentials must never be committed to this repository. Repository docs should only use placeholders such as `<PRIVATE_NEST_KEY>`.

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

Current daily rule: use `/cloud` for checking the live nest and `/write` for publishing text updates.

---

## 2. Project goal

The project is turning the original static Kitten Nest page into a cloud-backed nest:

- Vicky can publish text updates from a phone-friendly writer console.
- Alex can prepare update packages for Vicky to paste into `/write`.
- Text state lives in cloud state.
- Local images remain user-controlled in the browser where possible.
- GitHub-hosted default images are used as fallback when no local image is available.
- Future direct tool writing is possible, but it is not the current daily workflow.

Current important principle:

```text
Keep the existing coffeeCorner / windowWeather workflow stable before adding more rooms.
```

---

## 3. Stable daily workflow

The stable daily publishing chain is:

```text
Alex update package
  -> /write
  -> generate drafts
  -> pendingDrafts in cloud state
  -> publish all drafts
  -> cloud state
  -> /cloud
  -> coffeeCorner bubble / windowWeather / 19.8 hotspot behavior
```

Vicky's normal operation:

1. Open `/write`.
2. Paste the whole Alex update package into the top package box.
3. Click `生成草稿`.
4. Click `一键发布全部`.
5. Open `/cloud` and verify.

The debug direct-write sections in `/write` are not the normal daily path. They are only for fallback/debug use.

---

## 4. Current active update package tags

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

## 5. Stable and manually verified features

The following are considered stable and protected:

- `/write` writer console daily package workflow.
- `[coffeeCorner]` publishing to rotating bubble lines.
- `[windowWeather]` publishing to the small window weather text.
- `/cloud` displaying the current coffee-corner bubble queue.
- 19.8 tattoo hotspot behavior:
  - tapping the bubble hides the bubble;
  - tapping the 19.8 hotspot shows or advances the bubble;
  - this chain should not be casually refactored.
- Window weather display.
- GitHub default room images and fallback behavior for `/cloud`.
- Local user-uploaded image priority where the browser has local image data.

---

## 6. Current runtime state model

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

## 7. Current important files and roles

### `index.html`

Original front-end page. Contains room DOM, setup/material upload panel, browser local image storage, base room switching, base `say()` bubble behavior, original 19.8 tattoo click behavior, clock, moon/day-night behavior, photo wall, and game menu logic.

Do not treat `index.html` as a clean module yet. It is still the original monolithic front-stage page.

### `api/app-q.js`

Server-side cloud page generator and main cloud bridge for bubbles.

It currently reads public state, injects the initial bubble text, injects a browser bridge for the bubble queue, and controls the stable hide/show/advance behavior for the coffee-corner bubble and 19.8 hotspot.

This is a sensitive file. Do not start refactoring here unless the earlier lower-risk architecture collection steps are stable.

### `api/app-assets.js`

Wrapper around `api/app-q.js` for `/cloud`.

It currently injects default room assets, image fallback behavior, setup-panel hiding patches, small text refresh behavior, and the weather patch script.

This file works, but it is also where several patches are collected. It should eventually become or delegate to an `assetController` rather than accumulating more unrelated front-end patches.

### `assets/weather-patch.js`

Small independent weather updater. It reads current state, then updates `#temp` and `#desc` from `windowTemp` and `windowDesc`.

Do not delete this file until a replacement `weatherController` has been built and verified.

### `write.html`

Phone-friendly writer console. It reads current state, creates `pendingDrafts`, publishes drafts into active state fields, and supports direct debug writes only as fallback.

Do not break this workflow.

### `data/room-config.v1.json`

Foundation-only room configuration. It documents active room/text ports and future room intent. It is not wired into runtime yet.

---

## 8. Protected areas: do not touch casually

Do not change these during status/documentation work:

- private write key handling;
- cloud state storage setup;
- experimental direct tool endpoints;
- write endpoints;
- read endpoints unless explicitly doing API maintenance;
- `/write` daily workflow;
- `/cloud` stable route without a clear rollback plan;
- `api/app-q.js` bubble bridge;
- 19.8 tattoo hotspot behavior;
- coffee-corner bubble publishing chain;
- window weather display chain;
- `assets/weather-patch.js` before an equivalent replacement is verified;
- future room runtime display.

---

## 9. Current technical debt

The project works, but the front-end behavior is spread across several layers.

Main technical debt:

1. State reading is repeated.
   - `api/app-q.js` reads state server-side and in the bridge.
   - `api/app-assets.js` injects another text refresh patch.
   - `assets/weather-patch.js` reads state independently.
   - `write.html` reads state for console status.

2. Bubble ownership is split.
   - `index.html` has original `say()` and tattoo click behavior.
   - `api/app-q.js` protects cloud bubble behavior.
   - `api/app-assets.js` injects additional text refresh behavior.

3. Weather is working but separate.
   - `assets/weather-patch.js` is simple and stable, but it does not share a common state client.

4. Asset fallback is patch-based.
   - `api/app-assets.js` injects default images, fallback behavior, and setup hiding from the server wrapper.
   - This is effective, but it should eventually be formalized as an asset controller.

5. Future room metadata exists before a room engine exists.
   - `data/room-config.v1.json` is useful as a map, but it should not become runtime until the core active room is modularized.

---

## 10. Recommended architecture collection order

Do not add new visible rooms yet. Collect the current stable behavior first.

Recommended order:

```text
stateClient
  -> weatherController
  -> assetController
  -> bubbleController
  -> roomConfig runtime evaluation
```

### Phase 1: `stateClient`

Collect state reading into a single front-end state client. Initial version should be low-risk and read-only: fetch state, cache current state, compute a stable change stamp, and provide subscribe/onChange style hooks.

Do not start by changing the 19.8 hotspot or bubble bridge.

### Phase 2: `weatherController`

Move the window weather display behind a clear controller. It should consume state, update `#temp` from `windowTemp`, and update `#desc` from `windowDesc`.

Do not delete `assets/weather-patch.js` until the new controller is proven equivalent.

### Phase 3: `assetController`

Formalize default image and fallback handling. Preserve local browser image priority, GitHub default images as fallback, setup-panel hiding behavior for `/cloud`, and safe behavior in Safari/PWA views.

Do not redesign coordinates or room rendering in this phase.

### Phase 4: `bubbleController`

Only after earlier phases are stable, collect coffee-corner bubble behavior. Preserve initial cloud bubble render, rotating `alexBubbles`, `bubbleIndex` reset behavior, bubble tap hide, 19.8 tap show/advance, and protection against old local `say()` calls overriding cloud text.

This is the highest-risk phase.

### Phase 5: roomConfig runtime connection evaluation

Evaluate how `data/room-config.v1.json` should be used by runtime. Do not connect future rooms yet.

---

## 11. Future rooms policy

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

Do not build coordinate systems, room navigation engines, or new room UIs as part of the current architecture collection task.

---

## 12. Quick test package

Use this to verify the current stable active ports:

```text
[coffeeCorner]
0610 架构收编前验收。
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
- 19.8 hotspot shows or advances the bubble.

---

## 13. New construction window instructions

When starting a new construction window:

1. Read `PROJECT_STATUS.md` first.
2. Then read:
   - `docs/CURRENT_STATUS.md`
   - `docs/ARCHITECTURE_NOTES.md`
   - `docs/CONSTRUCTION_LOG.md`
   - `data/room-config.v1.json`
3. Do not ask Vicky to re-explain the whole project.
4. Do not request private keys unless an operation truly requires Vicky-side authorization.
5. Do not write private keys to the repository.
6. If the task is architecture collection, start with read-only evaluation.

Default stance for the next phase:

```text
The nest is not broken. It is stable but patch-layered.
Protect the working coffeeCorner, windowWeather, /write, and 19.8 hotspot flows.
Collect architecture before adding new rooms.
```
