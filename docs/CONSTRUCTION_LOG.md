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

## 2026-08-09 v2 production promotion closeout

The promotion-ready branch was merged without squashing so the route switch remains independently reversible:

```text
promotion source commit: b1867dcce2ec31ce65c2d3f27dc894fbbf874fb0
production merge commit: b6dbf054746e70e87551d39f51c31cf829c46771
Vercel production deployment: success
```

Read-only production smoke result:

```text
/cloud: HTTP 200, Kitten Nest document
manifest: status=production, promoted=true, route=/cloud
/api/state: HTTP 200
three optimized beach WebP assets: HTTP 200 image/webp
```

No text target, `nest_state` value, archive item, local-media slot, Storage object, policy, or schema was changed during promotion verification. Sparkle/light-point tuning begins only as a later independent visual-polish batch.

## 2026-08-11 panorama dialogue camera

The three beach Alex/Vicky pairs now use manifest-owned `dialogueGroups` with one `groupLock` focus per scene. The first member reveal centers that authored image focus once; subsequent speaker changes, copy-width changes, and manual panning cannot trigger member-level recentering. Bubbles remain pinned to the base image, and ungrouped panorama ports retain the existing safe-edge reveal fallback.

Manifest 0.3.3 validation and 86/86 automated checks passed. The change does not alter navigation, six writable beach target ids, live state, Supabase, Storage, or the production route owner. Full details are in `docs/construction-logs/2026-08-11.md`.

## 2026-08-11 panorama dialogue anchor polish

Manifest 0.3.4 calibrates the first beach conversation to the accepted crop (`focusX .436`) and introduces reusable `bottomCenter` / `topCenter` image anchors. The handhold Alex bubble pins its lower edge above the face; bracelet and stall Alex bubbles pin their upper edges below the face. Longer published copy can now grow only into the approved direction. Generic bubble copy is unified at the compact weather-title size (`15px`) with normal weight.

The six writable speaker targets, navigation stack, hotspots, images, live state, Supabase, Storage, and MCP envelopes are unchanged. Manifest validation rejects unknown coordinate anchors, and 87/87 checks pass.

## 2026-08-11 shared seaside dialogue timeline

Manifest 0.4.0 separates exploration hierarchy, named story beats, and ordered dialogue turns. Each beach scene now owns one semantic `dialogueScript` target and one shared runtime turn index. Consecutive turns by the same speaker update one bubble; speaker changes switch members; a short input lock absorbs accidental double taps; completion closes the group and the next action restarts it. `/write`, `/api/set-state`, and MCP share the same `@alex` / `@vicky` parser. The six earlier per-speaker queues remain compatibility/ambient channels, so no state migration was required. Validation and 98/98 checks passed.

## 2026-08-12 immersive runtime polish

Manifest 0.5.0 supersedes automatic panorama dialogue focus with `camera.policy: manual`. Grouped dialogue never changes horizontal camera position; bubbles remain pinned to image coordinates and the visitor's pan is authoritative from scene entry. Standalone bubbles now remember line/open/closed state only inside the current runtime and reset on changed content or full app restart. Ordinary standalone bubbles default closed; coffeeCorner and lapClose remain explicit greeters.

Home restores the legacy translucent floating weather copy and an independent 32-particle pebble-jar field. The moon toggle now uses two retained images so only the room art crossfades while hotspots/effects stay mounted. Powder-notebook entries gain the seventh registered field `hubbyNoteAuthor`: browser writes stamp Vicky, MCP stamps Alex, known archive authors persist, and legacy unknown pages are not guessed. The author colors share one CSS token pair with dialogue bubbles.

No production route, text content, Supabase state, schema, RLS, bucket, Storage object, hotspot, or base-image coordinate changed. Manifest validation, 107/107 automated checks, and `git diff --check` pass. Public branch-preview interaction remains the release gate because the cloud browser cannot access the workspace loopback server.

## 2026-08-12 explicit legacy notebook attribution

Vicky identified the live powder-notebook archive by visible page number plus opening-text checks. A guarded one-time data operation classified Vicky pages `1, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18`, Alex pages `2, 3, 5, 11, 16, 19`, and the current page as Vicky. Preflight and independent read-back both proved that all 19 canonical entries still matched all 19 history entries and that only author metadata changed. Text, timestamps, favorites, trash, other state, schema, policies, buckets, and Storage were untouched. The general code contract still refuses to guess an unknown historical author.

## 2026-08-12 immersive-runtime production acceptance

PR #11 promoted manifest 0.5.0 at `953714c`: manual beach dialogue cameras; visit-scoped ambient-bubble continuity and default-closed ordinary bubbles; explicit Vicky/Alex notebook ownership and shared ink tokens; translucent floating weather; 32 independent pebble-jar particles; and a retained-image Day/Night crossfade. PR #12 closed the installed-PWA follow-up at `e7cdaf8`: the outgoing image now remains composited through final handoff, fixed stage shading remains above both image layers, and the daytime weather trapezoid is removed.

Vicky accepted all six rule groups in the installed iPhone PWA. Manifest validation reports zero warnings and 108/108 checks pass. No hotspot, coordinate, scene hierarchy, live copy, MCP target, Supabase state, schema, policy, bucket, Storage object, or image asset changed during the handoff follow-up.
