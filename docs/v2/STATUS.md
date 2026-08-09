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

## Automated acceptance

Run:

```text
npm run check:v2
```

This validates controller contracts, one-manifest ownership, registered text targets, selector exclusivity, child isolation, navigation stack behavior, cover math, text-field precedence, and time-of-day asset resolution.

## Promotion stop condition

Do not merge v2 into `/cloud` until Vicky verifies the independent preview and a separate promotion plan names:

```text
old owners retired
exact runtime files replaced
state fields preserved
full /cloud acceptance URL
rollback commit
```
