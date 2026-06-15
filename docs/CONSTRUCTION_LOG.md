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

## 2026-06-14 clean scene router / lapClose checkpoint

Stable backup point:

```text
clean-router-3-clock
```

Verified test entry:

```text
/cloud?sceneRouterClean=1&v=20260614-clean-router-3-clock
```

Purpose:

```text
Stop repairing the old lap/coffee patch pile symptom by symptom.
Rebuild the lapClose nesting flow from a clean sceneRouter test line.
```

Clean test line loads:

```text
assets/scene-router-clean.v1.js
assets/console-hot-clean-restore.js
assets/coffee-clean-leave-guard.js
assets/clock-hands-guard.js
assets/bubble-controller.js?v=20260614-guard-1
assets/coffee-steam-svg.js
cloud state / cloud asset loading
```

Clean test line intentionally does not load:

```text
assets/coffee-corner-variant.js
assets/console-hot-restore.js full old bundle
lapFinal old transition patch
leavingCoffeeCorner old defense chain
```

Verified good in `clean-router-3-clock`:

- `originalHome -> coffeeCorner` works.
- `coffeeCorner -> originalHome` works.
- `coffeeCorner -> lapClose` works.
- `lapClose -> coffeeCorner` works.
- Coffee steam is mostly smooth / immediate. Occasional 0.2s-0.3s delay remains acceptable for now.
- Bubble queue is stable. It no longer breaks when panels/hotspots are opened.
- Game console hotspot opens `gameMenu` again, not the powder notebook.
- Coffee-corner return-to-home black block flash is gone.
- Home clock hands are protected by a clock-only guard.

Important lesson from the failed patch line:

```text
Do not keep chasing local symptoms inside the old lapFinal patch pile.
The old chain mixed router, transition, coffee steam, bubble visibility, console restore,
leavingCoffeeCorner, and iOS click/touch guards into one unstable patch stack.
```

Binding lesson repeated:

```text
no blind binding
```

Before binding any hotspot, check the object's owner / ID information card. The `consoleHot` case is the reference lesson: the visual game console must have exactly one owner and action.

Approved clean owner mapping:

```text
#console / consoleHot -> gameMenu
```

Do not reintroduce as-is:

```text
console-hot-restore.js full old bundle
lapFinal old patch
leavingCoffeeCorner old chain
global overlay repaint guard that touches home clock / clock hands / coffee hotspots together
```

Current acceptable imperfection:

```text
Coffee steam can occasionally appear with a tiny 0.2s-0.3s delay.
Do not reopen the whole patch pile just to chase this unless a clean, narrow, tested fix exists.
```

Next safe path:

```text
If promoting clean-router-3-clock into normal /cloud, preserve the clean split:
- clean sceneRouter owns go / push / back
- clean console restore owns only #console -> gameMenu
- clean coffee leave guard owns only steam/photoGlow hiding during coffee exit
- clock guard owns only home clock hands
- bubble controller owns bubble queue and hidden/advance guard
```
