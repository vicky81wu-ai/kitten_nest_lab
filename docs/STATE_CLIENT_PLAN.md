# State Client Collection Plan

Updated: 2026-06-10

This document defines the first low-risk architecture collection step for Kitten Nest Cloud.

Scope of this plan:

```text
Create a shared front-end state reading pattern.
Do not change the current runtime yet.
Do not touch the coffeeCorner bubble bridge first.
Do not touch the 19.8 hotspot first.
```

The current nest is stable but patch-layered. The first architecture move should reduce repeated state reads without taking over sensitive behavior.

---

## 1. Why stateClient comes first

Current front-end state reading is spread across several places:

- `api/app-q.js` reads public state server-side and its injected browser bridge reads state again.
- `api/app-assets.js` injects a small text refresh patch that also reads state.
- `assets/weather-patch.js` independently reads state for `windowTemp` and `windowDesc`.
- `write.html` reads state for writer-console status and draft display.

This works, but it creates repeated polling, repeated change detection, and multiple places that decide how state should be interpreted.

A shared `stateClient` should become the single front-end reader for runtime display modules.

---

## 2. First version must be read-only and low-risk

The first version should not write state and should not own any display behavior by itself.

It should only:

- fetch `/api/state`;
- cache the last successful state;
- compute a stable change stamp;
- notify subscribers when state changes;
- support explicit refresh on load, focus, and visibility restore;
- optionally support polling through one central timer.

It must not:

- write to `/api/set-state`;
- parse update packages;
- control bubble display;
- control the 19.8 hotspot;
- hide or show setup panels;
- connect future rooms;
- read private keys.

---

## 3. Proposed module shape

Future file candidate:

```text
assets/state-client.js
```

Possible public API:

```js
window.KittenNestState = {
  getState(),
  getStamp(),
  refresh(reason),
  subscribe(fn),
  startPolling(options),
  stopPolling()
};
```

Behavior notes:

- `getState()` returns the last cached state object or `null`.
- `getStamp()` returns a computed stamp for current state freshness.
- `refresh(reason)` fetches `/api/state` with `cache: 'no-store'`.
- `subscribe(fn)` registers a listener and returns an unsubscribe function.
- Subscribers receive `{ state, previousState, stamp, previousStamp, reason }`.
- Polling should be conservative and centralized, not copied into every controller.

---

## 4. Suggested change stamp

The stamp should be stable enough for active display fields.

Initial stamp fields:

```text
updatedAt
alexBubble
alexBubbles
bubbleIndex
windowTemp
windowDesc
```

Possible implementation idea:

```js
function stateStamp(state) {
  return [
    state && state.updatedAt || '',
    state && state.alexBubble || '',
    JSON.stringify(state && state.alexBubbles || []),
    String(state && state.bubbleIndex || 0),
    state && state.windowTemp || '',
    state && state.windowDesc || ''
  ].join('|');
}
```

Do not include `pendingDrafts` in the first runtime stamp unless a front-stage module needs it. `pendingDrafts` belongs mainly to `/write`.

---

## 5. First safe integration target

Do not integrate stateClient into the bubble bridge first.

Recommended order:

1. Add `assets/state-client.js` without loading it anywhere.
2. Load it only in `/cloud` after confirming the file is served correctly.
3. Let it run in passive debug mode and expose `window.KittenNestState`.
4. Move weather display to consume it, while keeping `assets/weather-patch.js` as the wrapper or compatibility entry.
5. Only after weather is stable, consider asset and bubble modules.

The first real consumer should be weather, not bubble.

---

## 6. Weather integration sketch

After stateClient exists, `weatherController` can subscribe to it:

```js
window.KittenNestState.subscribe(({ state }) => {
  const temp = document.getElementById('temp');
  const desc = document.getElementById('desc');
  if (temp && state.windowTemp) temp.textContent = String(state.windowTemp);
  if (desc && state.windowDesc) desc.textContent = String(state.windowDesc);
});
```

During transition, `assets/weather-patch.js` should not be deleted. It can either:

- continue working as-is until the new controller is verified; or
- become a thin compatibility wrapper that loads/uses stateClient.

---

## 7. Bubble and 19.8 protection rule

The bubble chain is protected.

Do not touch these until stateClient, weatherController, and assetController are stable:

- server-side initial bubble hydration;
- `alexBubbles` queue interpretation;
- `manualHidden` behavior;
- bubble tap-to-hide;
- 19.8 hotspot show/advance behavior;
- MutationObserver protection against older local `say()` calls.

Bubble work belongs to a later `bubbleController` phase.

---

## 8. Future room policy

stateClient must not connect future rooms.

It may read all state fields returned by `/api/state`, but it should not display future room content or route it into new DOM.

Future rooms in `data/room-config.v1.json` remain documentation/foundation only until a room engine exists.

---

## 9. Acceptance checks for phase 1

When stateClient is first added in passive mode:

- `/cloud` opens.
- No visible UI changes are required.
- No console-breaking errors.
- Current coffeeCorner bubble still displays.
- Bubble click still hides bubble.
- 19.8 hotspot still shows or advances bubble.
- windowWeather still displays through the existing path.
- `/write` workflow is unchanged.

When weather later uses stateClient:

- `[windowWeather]` package publishes correctly.
- `/cloud` shows the new `windowTemp` and `windowDesc`.
- focus/visibility restore still refreshes weather.
- `assets/weather-patch.js` is not removed until equivalent behavior is verified.

---

## 10. Rollback rule

If anything about bubble display, 19.8 hotspot behavior, `/write`, or windowWeather regresses, rollback the integration and return to the current patch-layered stable state.

The current nest is not broken. Architecture collection must be smaller than the risk it removes.
