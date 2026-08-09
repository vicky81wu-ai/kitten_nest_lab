# Kitten Nest v2 Status

Updated: 2026-08-09
Status: framework regression passed; home/weather and beach restoration implemented, not promoted

## Isolation

```text
branch: agent/v2-runtime-foundation
route: /v2/index.html
stable /cloud injection chain: unchanged
live nest_state: unchanged
/api/state and /api/set-state: unchanged
/write: unchanged
```

## First vertical slice

Included:

```text
home -> coffeeCorner -> push(lapClose) -> back()
home hubbyNote panel
coffeeCorner 19.8 rotating bubble
coffeeCorner lap entry
coffeeCorner memories panel
coffeeCorner game menu panel
lapClose rotating bubble
home clock hands and sparkles
coffeeCorner steam
explicit state-source and asset-failure diagnostics
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

The beach assets were verified read-only in the existing public asset bucket. No bucket, policy, database row, or state value was changed.

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
cloud-browser self-check: separate Vercel Protection session requires sign-in
```

Deployment success is not visual acceptance. Each restoration batch still receives one consolidated device pass behind the existing preview login.

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

This currently runs 26 checks covering controller contracts, one-manifest ownership, registered or explicitly static text ports, selector exclusivity, child isolation, portrait and panorama navigation, approved beach order, failed-asset rollback, projection math, text mutation layout invalidation, fallback refresh serialization, weather state/advice, time-of-day and manual asset resolution, connected stage-image loading, loading-veil presence, and bounded best-effort image decode behavior.

## Promotion stop condition

Do not merge v2 into `/cloud` until Vicky verifies the independent preview and a separate promotion plan names:

```text
old owners retired
exact runtime files replaced
state fields preserved
full /cloud acceptance URL
rollback commit
```
