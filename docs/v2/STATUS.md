# Kitten Nest v2 Status

Updated: 2026-08-09
Status: framework regression passed; home/weather, beach, Gomoku, memories, and scoped powder-notebook write closure implemented, not promoted

## Isolation

```text
branch: agent/v2-runtime-foundation
route: /v2/index.html
stable /cloud injection chain: unchanged
live nest_state: unchanged
/api/state and /api/set-state implementations: unchanged
/write: unchanged
```

## First vertical slice

Included:

```text
home -> coffeeCorner -> push(lapClose) -> back()
home hubbyNote current page, permanent archive, editor, favorite, and soft-delete trash
coffeeCorner 19.8 rotating bubble
coffeeCorner lap entry
coffeeCorner six-slot memories panel plus scoped device-local slot editor
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

The beach assets were verified read-only in the existing public asset bucket. No bucket, policy, database row, or state value was changed. Each large nested scene now uses an allowlisted same-origin cache endpoint before its canonical public Storage URL. Coffee corner warms the first beach image; each panorama warms the next one. The endpoint corrects the three PNG payloads stored under `.jpg` object names and never accepts an arbitrary Storage path.

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

The original transparent upper-left long press opens a separate device-local setup session. It can create the known `kittenNestLabDB/images` store and write, replace, or clear only those six photo keys. The picker rejects non-images and images above 15 MB. Nothing is uploaded to cloud storage, and v2 room assets remain manifest-owned.

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

## State of external dependencies

At implementation start, both Supabase projects were `INACTIVE`:

```text
kitten-nest-mcp
kitten-nest-lab-assets
```

The public asset project was restored separately after the foundation commit:

```text
kitten-nest-lab-assets: ACTIVE_HEALTHY
lap-close-01.jpg: verified public image, 853 x 1844
```

The private text/state project remains intentionally inactive:

```text
kitten-nest-mcp: INACTIVE
```

The preview therefore uses its explicit read-only fixture path and labels it `preview copy`. This avoids re-exposing notebook/history state through the currently public `/api/state` read path before a separate privacy plan is approved.

## Deployment checkpoint

```text
draft PR: #4
Vercel branch deployment: Ready
protected preview login: completed on Vicky's iPhone
framework browser acceptance: passed
restoration batch 0.2.0: Vercel Ready
cloud-browser self-check: Vercel Protection login wall; the active Work client exposed no user login surface
local mobile-browser acceptance: passed with the exact public asset bytes cached read-only
```

Deployment success is not visual acceptance. Continued branch construction receives automated mobile-browser acceptance; one concise iPhone pass is reserved for the eventual promotion checkpoint.

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

This currently runs 67 checks covering controller contracts, one-manifest ownership, registered or explicitly static text ports, selector exclusivity, child isolation, portrait and panorama navigation, approved beach order, failed-asset rollback, same-origin scene-asset allowlisting and content sniffing, reuse of the existing Vercel function budget, sequential beach warming, projection math, panorama bubble reveal, text mutation layout invalidation, fallback refresh serialization, compact weather presentation, invisible corner docks, global long-press dispatch, device-local six-slot write allowlisting, weather state/advice, time-of-day and manual asset resolution, connected stage-image loading, loading-veil presence, bounded best-effort image decode behavior, Gomoku legality/wins/undo and all three AI difficulty paths, absent/unsupported/existing legacy-photo database behavior, notebook normalization, save/deduplication, favorite, soft delete, request allowlisting, Nest-key failure handling, iPhone home-screen metadata, dangling scene/text action targets, coordinate ownership, supported effect types, and the absence of product-facing inspector/debug controls.

The local 393 × 852 mobile-browser pass uses an in-memory fake `/api/set-state`; it never contacts the real state project. It exercised new page -> save -> current page -> archive readback -> favorite -> unfavorite -> delete -> trash, and inspected all four requests. Every request used the QA-only token and only the six registered notebook fields. The same run then completed moon/weather, coffeeCorner, a seeded six-slot read-only memories carousel, Gomoku, all three beach scenes and dialogue, lapClose, and the final home return with zero console, page, or request errors.

## Promotion stop condition

Do not merge v2 into `/cloud` until Vicky verifies the independent preview and a separate promotion plan names:

```text
old owners retired
exact runtime files replaced
state fields preserved
full /cloud acceptance URL
rollback commit
```

The exact route, ownership, state-preservation, production acceptance, and rollback procedure is recorded in `docs/v2/PROMOTION_PLAN.md`. It remains gated: the document does not change `/cloud` by itself.
