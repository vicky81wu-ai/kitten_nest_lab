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

The preview therefore has an explicit read-only fixture path. This does not replace the requirement to restore and verify real cloud state and the lap-close asset before visual acceptance.

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
