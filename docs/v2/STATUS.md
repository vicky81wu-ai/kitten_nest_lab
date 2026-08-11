# Kitten Nest v2 Status

Updated: 2026-08-11
Status: production `/cloud`; stable beach dialogue-group camera prepared on an isolated branch

## Production route

```text
production branch: main
production merge: b6dbf054746e70e87551d39f51c31cf829c46771
isolated promotion source: b1867dcce2ec31ce65c2d3f27dc894fbbf874fb0
production route: /cloud -> /v2/index.html
direct compatibility route: /v2/index.html
legacy rollback route: /cloud-coords -> /api/app-coords
live nest_state: unchanged until an explicit target publish
/api/state: unchanged
/api/set-state: registry-scoped beach bubble envelope support added
/write: six beach speaker tags added to the existing package/draft workflow
```

## First vertical slice

Included:

```text
home -> coffeeCorner -> push(lapClose) -> back()
home hubbyNote current page, permanent archive, editor, favorite, and soft-delete trash
coffeeCorner 19.8 rotating bubble
coffeeCorner lap entry
coffeeCorner six-slot memories panel plus scoped three-room/six-photo device-local editor
coffeeCorner game menu and interactive Gomoku panel
lapClose rotating bubble
home clock hands and sparkles
coffeeCorner steam
degraded-preview disclosure and fail-closed asset handling
```

The lap-close body trigger coordinate is imported as a preview candidate and remains visually unverified. It is marked `candidateFromLegacyCard`, not `baseImageLocked`.

## Framework regression result

Vicky accepted all four post-fix checks on iPhone Safari:

```text
room image waits behind the loading veil
coffeeCorner bubble changes height without a one-frame position jump
lapClose bubble hide/show-next cycle
lapClose -> coffeeCorner -> home full back chain
```

## Restoration batch 0.2.0

Implemented inside the isolated v2 runtime:

```text
home moon lamp toggles the canonical day/night asset pair
home weather reads windowTemp/windowDesc and opens the shared weather-advice panel
preview weather is explicitly marked 28℃ / Cloudy · preview when private state is asleep
generic bubble triangle tail removed
coffeeCorner top-photo beach entry restored
three approved beach panoramas restored in handhold -> bracelet -> stall order
approved beach talk/next/back coordinates and both dialogue queues restored
one scene world now supports portrait cover and horizontal panorama presentation
```

The beach assets were verified read-only in the existing public asset bucket. No bucket, policy, database row, or state value was changed. The three original 3.4–3.75 MB payloads now have repository-owned 1536 × 1024 WebP delivery variants of about 0.21–0.26 MB. Each nested scene uses its same-origin static variant first and retains the canonical public Storage object as a fallback. Coffee corner warms the first beach image; each panorama warms the next one. This removes the timed-out Vercel proxy/function hop while preserving the source images and full panorama dimensions.

## Interactive panel batch

The game-console hotspot no longer ends at a placeholder. Its manifest-owned menu now opens a complete 15 × 15 Gomoku session inside the same PanelController layer:

```text
kitten plays black and moves first
Alex replies with white
Soft / Normal / Wolf difficulty reset
undo removes the latest complete round
restart and back-to-menu controls
all pending AI timers die when the panel closes or switches
```

Game rules and AI selection live in a pure core module. PanelController owns only the panel stack and the scoped DOM session, so this restoration adds neither a ninth lifecycle controller nor a second click-delegation system. It performs no network or state writes.

## Device-local memories batch

The photo-wall hotspot checks for the six old device-local slots (`photo0` through `photo5`) and renders the original carousel behavior when they exist. The normal carousel path remains deliberately read-only:

```text
requires IndexedDB.databases() safe enumeration
does not call open() when the old database is absent
opens the exact existing database version only
uses a readonly transaction
revokes temporary object URLs when the panel closes
```

The original transparent upper-left long press opens a separate device-local setup session with three explicit tabs. `房间` owns only the historical `homeOn`, `homeOff`, and `gameRoom` keys; `照片墙` owns only `photo0` through `photo5`; `其他` explains the source boundary. A room image resolves in this order: device-local override, optimized same-origin delivery, published Supabase original, then repository-original fallback. Clearing a room override restores that default chain. Photo-wall slots remain device-local because no six independent published defaults exist. The picker rejects non-images and images above 15 MB, and nothing is uploaded to cloud storage.

The upper-left 1.8 second gesture suppresses selection/callout only while that zone is armed, so iOS does not expose blue text-selection handles and unrelated scene gestures remain untouched. Lower-corner navigation captures its pointer at press time and tolerates up to 28 px of finger drift; the larger invisible zones remain fixed to explicit grid columns and paint no icon. Explicit columns matter because an unavailable sibling uses `hidden` and must not cause the remaining dock to auto-flow into the wrong half of the screen.

Browser same-origin rules still apply. If the old photos live under another origin, or the browser does not support safe enumeration, v2 leaves them untouched and shows the existing three memory cards instead.

## Product-surface cleanup

The temporary runtime inspector has been retired at code level. Its manifest objects, center `V2` control, controller-status pills, hotspot-outline switch, diagnostic panel branch, and diagnostic-only styles no longer ship in the preview. Weather and notebook panels also no longer expose internal `source:` metadata.

Internal lifecycle status remains available to the runtime and automated tests. The only passive source disclosure is `PREVIEW COPY`, shown when and only when StateController is actually serving the explicit degraded fixture. Asset, runtime, and fatal cards remain because they fail closed instead of presenting the wrong room.

## Scoped powder notebook batch 0.3.0

The home notebook now closes its full MVP loop under the existing PanelController: write a separate new page, save it as both current and permanent archive, load an archive page into the editor, favorite/unfavorite an archive row, and soft-delete a row into `hubbyNoteTrash`. Current-page preview and editor draft stay separate, and saving identical text does not duplicate the permanent archive.

The write boundary is explicit rather than global:

```text
manifest policy: registeredTargetOnly -> hubbyNote
endpoint: existing /api/set-state
browser credential: X-Nest-Token only
allowed fields: hubbyNote, hubbyNoteUpdatedAt, hubbyNoteFavorite,
                hubbyNoteArchive, hubbyNoteHistory, hubbyNoteTrash
delete meaning: remove from archive and prepend to trash
degraded preview: read-only; mutation controls disabled
```

The Supabase service credential remains server-side. The device Nest key is accepted only by the existing server endpoint and is remembered locally after a successful response; an unauthorized response forgets the local copy and asks for a replacement. The stable `/write`, `/cloud`, and `/api/set-state` implementations were not edited.

## Production PWA hardening 0.3.1

The promoted runtime retains its scene, action, coordinate, and state-write contracts while correcting three delivery defects found in the installed iPhone app:

```text
canvas: accepted fixed 100vh / 100dvh / 100lvh chain
first paint: visual lifecycle runs beside initial state refresh
top-level delivery: same-origin WebP -> public Storage original -> repository original
scene warming: bounded fetch Blob -> retained stage image
detached Image warmers: zero
```

Home day, home night, and coffeeCorner delivery variants are each below 300 KB. The public Storage objects remain canonical recovery sources and were not mutated. Until the first image is ready, the shell shows a small passive `猫窝醒来中…` status instead of an unexplained maroon wait.

## Image-world navigation and beach text targets 0.3.2

The former stage-level lower-corner docks have been retired. Home Go, coffeeCorner Back, lapClose Back, and all beach Back/Push routes are transparent scene-owned Hotspot objects projected through the same base-image coordinate system as every other authored interaction. On a panorama they move with the art instead of staying glued to the phone viewport. Pointer capture and the 28 px drift tolerance now apply to every `scene.go`, `scene.push`, `scene.back`, and `scene.jumpTo` hotspot.

Viewport-fixed navigation is reserved for a future, separately named rescue layer. It is not an active second route owner.

The three established beach scenes now each own two registered bubble targets, one for Alex and one for Vicky:

```text
coffeeCornerBeachHandholdSunsetBubble
coffeeCornerBeachHandholdSunsetVickyBubble
coffeeCornerBeachBraceletPromiseBubble
coffeeCornerBeachBraceletPromiseVickyBubble
coffeeCornerBeachStallOrderBubble
coffeeCornerBeachStallOrderVickyBubble
```

Each target has its own current, queue, index, and timestamp fields. Every port uses its existing approved scene copy as a degraded/no-state fallback. `/api/mcp`, the `/api/set-state` envelope, `/write`, the tag registry, and the runtime manifest all read the same exact target ids. No Supabase table, policy, bucket, or Storage object is changed by registration.

## Panorama dialogue-group camera 0.3.4

The three beach pairs are now explicit conversation groups rather than six unrelated reveal targets. Each group owns one base-image focus selected from the scene artwork:

```text
handhold:  focusX 0.436
bracelet:  focusX 0.48
stall:     focusX 0.56
policy:    groupLock
```

Both Alex and Vicky bubbles remain image-locked at their group's X coordinate and keep their independent Y positions, queues, tags, and writable target ids. The first member opened after scene entry centers that focus only after Layout has measured the bubble. The controller then suppresses every later member-level reveal correction for that group, so different copy widths cannot cause horizontal oscillation. A user drag after the first focus remains authoritative. Re-entering the scene resets only the one-focus lifecycle, not dialogue content or state.

The handhold focus is calibrated to the accepted portrait crop. Its Alex bubble uses a lower-edge anchor at image Y `.248`, so longer copy grows into the sky rather than down across his face. Bracelet and stall Alex bubbles use upper-edge anchors at Y `.396` and `.33`, so longer copy grows below the marked neck/shoulder boundaries. All generic dialogue TextPorts use the compact weather-title text size (`15px`) at normal weight (`400`); weather temperature/description retain their dedicated typography.

The manifest validator rejects unknown policies, dangling groups, cross-scene members, missing back-references, duplicate members, and a `groupLock` member whose X differs from its group focus. A deliberately distant future speaker exchange must use a new explicit policy; `speakerFollow` is not silently accepted.

## State of external dependencies

At implementation start, both Supabase projects were `INACTIVE`:

```text
kitten-nest-mcp
kitten-nest-lab-assets
```

Both projects are now healthy:

```text
kitten-nest-lab-assets: ACTIVE_HEALTHY
kitten-nest-mcp: ACTIVE_HEALTHY
lap-close-01.jpg: verified public image, 853 x 1844
```

The live-state promotion gate was checked read-only on 2026-08-09:

```text
installed 猫窝 MCP read_nest_state: passed
installed 猫窝 MCP update_text_target(dryRun): passed, writesState=false
Supabase nest_state/main: required v2 text fields present
production /api/state: HTTP 200 with the live state
```

No state value, text target, archive entry, Storage object, policy, or database schema was changed by this gate. The explicit read-only fixture remains a failover only; `PREVIEW COPY` still appears whenever the live state request fails and notebook mutation remains disabled in that mode.

## Deployment checkpoint

```text
draft PR: #4
Vercel branch deployment: Ready
protected preview login: completed on Vicky's iPhone
framework browser acceptance: passed
restoration batch 0.2.0: Vercel Ready
cloud-browser self-check: Vercel Protection login wall; the active Work client exposed no user login surface
local mobile-browser acceptance: passed with the optimized static delivery assets and canonical read-only fallbacks
final Home-right first-tap correction: accepted on Vicky's iPhone
production Vercel deployment: success
production /cloud read-only smoke check: passed
```

Deployment success is not visual acceptance. The concise iPhone promotion pass is recorded below and closes the remaining device gate.

## Final iPhone promotion checkpoint

Vicky completed the remaining device pass on 2026-08-09. Accepted on the same protected branch deployment:

```text
home day/night and compact weather card
transparent upper-left long press without persistent iOS selection UI
three named room overrides and six named device-local photo slots
home -> coffeeCorner on the corrected lower-right first tap
coffeeCorner -> lapClose -> coffeeCorner -> home
coffeeCorner -> three beach scenes with optimized assets
fixed invisible lower-corner docks and beach back/forward route
no beach asset timeout after the static WebP delivery correction
```

The remaining sparkle/light-point comments are visual tuning, not a routing, ownership, asset, state, or write-path defect. They are deliberately deferred to a separate post-promotion polish batch so the accepted runtime checkpoint stays independently reversible.

## First iPhone checkpoint

The protected preview was opened on iPhone Safari. The runtime reached the home scene but reported:

```text
Asset timeout: /assets/rooms/home/day.jpg
```

The canonical image blob is present on the remote branch. The first fix removed a real readiness bug: `HTMLImageElement.decode()` had been coupled to the same hard eight-second network deadline. Safari can leave that optional decode promise pending after the load event, so v2 now separates the two gates:

```text
network load: required, explicit 20 second deadline
decode hint: best effort, bounded at 1.2 seconds
natural image dimensions: required before Layout readiness
```

The second iPhone pass displayed `asset · loading` and then the new, more precise `Asset network timeout` message. Direct checks showed:

```text
production-domain static image: available
protected branch static image: redirected to Vercel login
public Supabase image: available
```

The three top-level room images now use their verified public Supabase objects as canonical sources and retain the same-repository paths as production fallbacks. No Storage object, bucket policy, or live state was changed.

A third iPhone pass then timed out on both the public Supabase URL and the repository fallback even though both objects were independently readable. The shared failure point was the detached `new Image()` preloader. AssetController now loads exactly once through the retained, connected stage `<img>`, validates its natural dimensions, and treats decode as a bounded optional hint. The detached preload plus second stage assignment has been removed.

This loader simplification remained isolated and passed the next deployed iPhone home check.

## First iPhone vertical slice result

After the connected stage-image loader deployed, the following chain passed on iPhone Safari:

```text
home image -> hubby-note panel
home -> coffeeCorner
19.8 bubble hide -> next line
memories panel -> close
game panel -> close
coffeeCorner -> lapClose
lapClose image and child-scene visual isolation
```

Three framework polish defects were recorded without blocking the vertical slice:

1. The connected image painted partial JPEG rows while the asset was still loading.
2. A changed coffeeCorner line could appear for one frame at its previous text height before Layout moved it.
3. A lifecycle refresh over the explicit preview fallback could briefly report `state · stale`.

The isolated follow-up fixes add a loading veil, invalidate TextPort layout before every visible text mutation, serialize state refreshes, suspend Layout during transitions, and prevent failed assets from committing navigation or child ownership.

## Automated acceptance

Run:

```text
npm run check:v2
```

This currently runs 87 checks covering controller contracts, paired preview/production route metadata, one-manifest ownership, registered text ports, selector exclusivity, child isolation, portrait and panorama navigation, image-locked transparent Go/Back/Push routes, approved beach order, six isolated beach speaker target envelopes, three dialogue-group camera contracts, edge-growth dialogue anchors, one-focus scene-entry lifecycle, manual-pan preservation, writer/MCP registry agreement, failed-asset rollback, full-size optimized static WebP delivery with canonical Storage fallback, fetch/Blob sequential warming without detached image elements, single-consumer warm requests, stalled-warm cancellation, the fixed full-screen `100lvh` PWA canvas, state readiness beside visual bootstrap, projection math, grouped and ungrouped panorama bubble reveal, text mutation layout invalidation, fallback refresh serialization, compact weather presentation, drift-tolerant navigation, scoped iOS-safe long-press dispatch, exact three-room/six-photo local write allowlisting, device-local room-source priority, weather state/advice, time-of-day and manual asset resolution, connected stage-image loading, loading-veil presence, bounded best-effort image decode behavior, Gomoku legality/wins/undo and all three AI difficulty paths, absent/unsupported/existing legacy-photo database behavior, notebook normalization, save/deduplication, favorite, soft delete, request allowlisting, Nest-key failure handling, iPhone home-screen metadata, dangling scene/text action targets, coordinate ownership, supported effect/dialogue camera types, and the absence of product-facing inspector/debug controls.

The local 393 × 852 mobile-browser pass uses an in-memory fake `/api/set-state`; it never contacts the real state project. It exercised new page -> save -> current page -> archive readback -> favorite -> unfavorite -> delete -> trash, and inspected all four requests. Every request used the QA-only token and only the six registered notebook fields. The same run then completed moon/weather, coffeeCorner, a seeded six-slot read-only memories carousel, Gomoku, all three beach scenes and dialogue, lapClose, and the final home return with zero console, page, or request errors.

## Production activation and rollback

The documented route-switch diff is live. Vercel reported success and the production route completed its read-only smoke check.

```text
production acceptance URL: https://kitten-nest-lab.vercel.app/cloud
promotion source: b1867dcce2ec31ce65c2d3f27dc894fbbf874fb0
production merge: b6dbf054746e70e87551d39f51c31cf829c46771
pre-promotion production baseline: 5723fd592188583e3d366cf3550882f8c04d3927
rollback: revert the isolated promotion commit and redeploy main
```

The exact state-preservation, owner retirement, production acceptance, and rollback procedure remains recorded in `docs/v2/PROMOTION_PLAN.md`.
