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

## 2026-06-14 shadow runtime owner map

New file:

```text
data/object-owner-runtime-shadow.v1.json
```

Purpose:

```text
Make the existing no blind binding / object information-card rule machine-readable
without changing runtime behavior yet.
```

Safety:

```text
runtimeMode = shadowOnly
enforcement = none
```

This file records the current clean `/cloud` split after the status-watermark removal. It is a backup and planning map, not an active controller.

Recorded current owners:

```text
sceneRouterClean -> go / push / back / jumpTo navigation only
consoleHot / #console -> gameMenu only
bubbleController -> #bubble / .tattooHot queue behavior only
coffeeCleanLeaveGuard -> steam/photoGlow hide only during coffeeCorner exit
clockHandsGuard -> home clock hands only
hubbyNoteController -> home 粉本本 only
```

Important boundary:

```text
Do not turn this shadow map into enforcement in the same step.
Next safe step is read-only registry checking under a test-only query parameter.
Only after that passes should future binders consult the registry before adding handlers.
```

## 2026-06-15 clean router + scene manifest checkpoint

High point:

```text
Vicky caught the real framework issue:
push(lapClose) must isolate the parent scene instead of letting coffeeCorner hotspots leak through the lap image.
```

Final tested direction:

```text
sceneRouterClean owns navigation only:
- go
- push
- back
- jumpTo

scene manifest owns scene/object relationship:
- currentScene decides allowed objects
- pushed child scene may use only its own objects plus explicit inherits
- parent scene hotspots and panels must not stay clickable inside a child scene
```

Naming discipline:

```text
Use originalHome for the scene id.
Use home.* for home-owned object ids.
Do not casually mix PrettyHome / Home / originalHome as scene ids.
Do not name home weather objects under coffeeCorner.
```

Current scene naming:

```text
originalHome = the first / default home scene
coffeeCorner = right-dock scene from originalHome
lapClose = pushed child scene under coffeeCorner
nestAtlas = future world hub placeholder, not the current default
```

Current clean behavior verified by Vicky:

```text
originalHome <-> coffeeCorner is smooth.
coffeeCorner -> push(lapClose) works.
lapClose -> back() returns to coffeeCorner.
lapClose no longer leaks coffeeCorner game console / photo wall / tattoo / weather / panel hotspots.
lapClose bubble opens and closes correctly from its own scene-owned target.
coffee steam / photoGlow are locked to coffeeCorner base image coordinates.
Home window weather advice belongs to originalHome and opens correctly.
```

Scene manifest test files:

```text
data/scene-manifest.test.v1.json
assets/scene-manifest-isolation-test.js
```

Manifest rule that must survive promotion:

```text
Parent scene owns the hotspot that enters a child scene.
Child scene owns its own overlays and child-only hotspots.
Child scene inherits only explicit navigation, such as dock.left.back.
No selector blacklist is allowed as final architecture.
```

Object ownership lessons from today:

```text
1. Entry hotspot ownership:
   coffeeCorner.lapCloseEnterHot.cleanRouter belongs to coffeeCorner, because it is clicked before entering lapClose.

2. Child scene ownership:
   coffeeCorner.lapCloseScene, coffeeCorner.lapCloseBubble.cleanRouter, and lapClose-only target belong to lapClose.

3. Home weather ownership:
   home.windowWeatherDisplay, home.windowWeatherAdviceHotspot, home.windowWeatherAdvicePanel belong to originalHome.

4. Coffee scene ownership:
   coffeeCorner.gameConsoleHotspot, photoWallHot, tattoo19_8, bubble, steamOverlay, photoGlowOverlay, setupPanel, setupToggleButton, gameMenu.panel, memories.panel belong to coffeeCorner.
```

Do not repeat these failed moves:

```text
- Do not test a framework issue with a hardcoded selector blacklist and call it architecture.
- Do not leave parent-scene hotspots alive under a pushed child scene.
- Do not put home weather objects under coffeeCorner just because the old controller name says windowWeather.
- Do not put a child-entry hotspot inside the child scene owns list.
- Do not promote test-only manifest enforcement into default /cloud until screen-home PWA and real /cloud both pass.
```

Current known tiny imperfection, not a current target:

```text
After using originalHome controls such as light switch or weather advice, entering coffeeCorner can make the 19.8 tattoo bubble hotspot slow to respond for about 2-3 seconds. Other hotspots are fine, and touching another hotspot appears to wake the bubble path. Do not chase this unless it becomes a repeatable blocker.
```

Current naming cleanup status:

```text
data/scene-manifest.test.v1.json is clean: home.windowWeather* is used.
data/object-owner-runtime-shadow.v1.json records home.windowWeatherAdvice and forbids coffeeCorner naming for home weather.
data/object-registry.v1.json is long and still needs a script-level safe rename pass if coffeeCorner.windowWeather* remains there. Do not hand-copy the 569-line registry file.
```

Promotion rule:

```text
Before any future scene group / nested scene / roleplay scene is added:
1. create or update the scene card
2. create object information cards
3. declare ownerScene / selectors / panels / overlays / inherited navigation
4. test with manifest isolation
5. only then promote
```

## 2026-08-09 v2 promotion-ready checkpoint

The isolated v2 rebuild completed its device acceptance loop without touching the stable `/cloud` route:

```text
home day/night moon toggle and compact window weather
home -> coffeeCorner -> lapClose -> coffeeCorner -> home
coffeeCorner -> beach handhold -> bracelet -> stall and back
transparent fixed lower-corner docks
upper-left device-local room/photo setup
photo wall, Gomoku, powder notebook, bubbles, clock, steam, and sparkles
```

The last repeated-tap defect was not a router failure. On Home, the unavailable left dock was hidden and CSS Grid auto-flow moved the live right dock into the first column. Both invisible docks now have explicit columns, so availability cannot move their physical hit zones.

Beach delivery no longer depends on the Vercel scene proxy or the multi-megabyte Storage originals as the first source. Repository-owned 1536 x 1024 WebP variants load first, and the canonical public Storage objects remain read-only fallbacks.

Live write-path readiness was checked without publishing test content:

```text
kitten-nest-mcp Supabase project: ACTIVE_HEALTHY
kitten-nest-lab-assets Supabase project: ACTIVE_HEALTHY
installed 猫窝 MCP read: passed
registered text-target dryRun: passed, writesState=false
nest_state/main required v2 fields: present
production /api/state: HTTP 200
```

Promotion decision:

```text
Freeze this accepted runtime as the functional checkpoint.
Promote through one isolated /cloud route-switch commit with the documented rollback.
Tune sparkle/light-point timing afterward in a separate reversible polish batch.
Do not hold the functional release open for subjective effect tuning.
```
