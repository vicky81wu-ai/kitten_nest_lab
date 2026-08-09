# Kitten Nest v2 Status

Updated: 2026-08-08  
Status: implementation in isolated branch, not visually accepted, not promoted

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
browser acceptance: blocked by Vercel Deployment Protection login
```

Deployment success is not visual acceptance. The branch must still be opened behind the preview login and walked through the acceptance loop.

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

This loader simplification remains isolated and requires one fresh deployed iPhone pass before the home step is accepted.

## Automated acceptance

Run:

```text
npm run check:v2
```

This validates controller contracts, one-manifest ownership, registered text targets, selector exclusivity, child isolation, navigation stack behavior, cover math, text-field precedence, time-of-day asset resolution, and bounded best-effort image decode behavior.

## Promotion stop condition

Do not merge v2 into `/cloud` until Vicky verifies the independent preview and a separate promotion plan names:

```text
old owners retired
exact runtime files replaced
state fields preserved
full /cloud acceptance URL
rollback commit
```
