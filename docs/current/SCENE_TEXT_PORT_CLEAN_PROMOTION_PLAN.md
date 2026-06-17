# Scene TextPort Clean Promotion Plan

Updated: 2026-06-17

Status: planning only. Do not execute until Vicky approves the specific implementation step.

## Plain meaning

Promotion plan means the bridge between a verified independent test and the stable `/cloud` nest.

It answers:

```text
What exactly goes into /cloud?
Which old owners retire?
Which new owner takes over?
Which files change?
How do we roll back?
What exact URL does Vicky verify?
```

The framework has been verified in independent routes, but this does not automatically mean it should be wired into `/cloud` immediately. `/cloud` is the promoted stable nest, so promotion must be staged.

## Verified basis

The following independent routes were verified by Vicky:

```text
https://kitten-nest-lab.vercel.app/coffee-corner-bubble-clean-test.html
https://kitten-nest-lab.vercel.app/coffee-corner-bubble-clean-runtime-test.html
https://kitten-nest-lab.vercel.app/scene-text-port-clean-framework-test.html
```

Verified behavior:

```text
coffeeCornerBubble can run under a single clean owner
production selector names #bubble / .tattooHot / #gameBg can be used in isolation
bubble tap hides
19.8 tap hides when visible and shows next when hidden
no flash/jump/auto-reopen
no stale first-paint fallback after deferred state render
same controller can also manage a panel-like textPort
```

## Promotion target

First real promotion target:

```text
coffeeCorner.bubble
```

Canonical text tag:

```text
[coffeeCornerBubble]
```

Canonical state fields to prefer:

```text
coffeeCornerBubble
coffeeCornerBubbles
coffeeCornerBubbleIndex
```

Migration fallback fields only if needed:

```text
alexBubble
alexBubbles
bubbleIndex
```

## Protected chains involved

This promotion touches protected behavior:

```text
/cloud promoted route
coffeeCorner main bubble queue
19.8 tattoo hotspot
bubbleController / app-q bridge / cloudTextPatch ownership
PWA / screen nest behavior
```

Therefore it must not be done as a casual runtime tweak.

## Owners

### New intended owner

```text
sceneTextPortCleanController
```

For `coffeeCorner.bubble`, this owner will control:

```text
show
hide
showNext / queue advance
user hidden state
19.8 trigger behavior
base-image coordinate placement during this phase
```

### Owners to retire from coffeeCornerBubble interaction

```text
api/app-q.js inline bridge click/touch capture for #bubble / .tattooHot
api/app-assets.js cloudTextPatch refresh/show for #bubble
index.html native bubbleOn / say ownership over coffeeCornerBubble
assets/bubble-controller.js production attachment for #bubble, if replaced by the clean controller
```

Important: retirement must be explicit. Do not leave old owners active beside the clean owner.

## Files likely involved in final promotion

The exact implementation step must name final files before writing. Candidate files:

```text
assets/scene-text-port-clean-controller.js
api/app-bubble.js
api/app-assets.js
api/app-q.js
assets/bubble-controller.js
index.html
data/object-registry.v1.json
data/write-tag-registry.v1.json
docs/current/TEXT_TARGETS_CURRENT.md
```

Promotion should prefer the smallest possible runtime change.

## Recommended staged route

### Stage 0: freeze stable route

Do not touch:

```text
/cloud default behavior
/write
/api/state
/api/set-state.js
nest_state live content
lapClose bubble
sceneRouterClean navigation
```

### Stage 1: production-parity independent route

Create one more independent route if needed:

```text
/cloud-clean-text-port-promotion-test.html
```

It should load the actual clean controller and mimic the `/cloud` coffeeCorner DOM as closely as possible, but it must not use `/cloud?flag` and must not modify `/cloud` wrappers.

Required properties:

```text
uses #bubble / .tattooHot / #gameBg
loads assets/scene-text-port-clean-controller.js
loads no app-q bridge
loads no cloudTextPatch
loads no /cloud wrapper
writes no state
shows diagnostic owner/source fields
```

### Stage 2: retire old owners in a test route only

Before touching `/cloud`, prove in the independent route that the old owners are absent:

```text
window.__kittenNestBridge is absent
window.__kittenNestTextPatch is absent
#bubble data-owner = sceneTextPortCleanController
#bubble data-canonical-tag = [coffeeCornerBubble]
```

### Stage 3: Vicky acceptance on independent route

Vicky verifies:

```text
first bubble line appears without stale fallback flash
bubble tap hides
19.8 tap hides when visible
19.8 tap shows next when hidden
long text grows/places correctly
no auto-reopen
no line jumping
panel/game/menu/photo hot areas unaffected in test scope
```

### Stage 4: write final runtime diff plan

Before writing runtime files, document:

```text
exact file diffs
old code removed
new code added
rollback commit path
full acceptance URL
```

### Stage 5: promote to /cloud

Only after Vicky accepts Stage 4, apply the minimal runtime diff.

Promotion must be direct and explicit, not via query flag.

Forbidden:

```text
/cloud?sceneTextPortClean=1
/cloud?coffeeCornerBubbleClean=1
/cloud?overlayLifecycleTest=1
```

### Stage 6: /cloud and screen nest acceptance

Full acceptance URLs:

```text
https://kitten-nest-lab.vercel.app/cloud
```

Also verify the saved PWA / screen nest entry if Vicky uses it.

Acceptance checklist:

```text
coffeeCorner first bubble line appears correctly
no stale fallback first paint
bubble tap hides
19.8 tap hides when visible
19.8 tap shows next when hidden
no repeated flashing
no auto-reopen
coffee steam still ok
photo wall still ok
game console/menu still ok
lapClose entry still ok
lapClose bubble still ok
return from lapClose to coffeeCorner still ok
home weather still ok
hubbyNote still ok
/write still publishes correct tags
```

## Rollback plan

If promotion breaks `/cloud`, first action is rollback, not guard stacking.

Rollback candidate:

```text
restore api/app-bubble.js / api/app-assets.js / api/app-q.js / assets/bubble-controller.js / index.html to pre-promotion versions
```

Do not modify state to fix a runtime promotion bug.

Do not patch around broken coffeeCornerBubble with more click/touch guards.

## State policy

No state cleanup is required for this promotion.

Do not change:

```text
nest_state
/api/state
/api/set-state.js
```

The clean controller should read canonical fields first and legacy fields only as migration fallback.

## Write tag cleanup policy

`[coffeeCornerBubble]` is the canonical tag.

`[coffeeCorner]` is legacy and should not remain the primary documented tag after promotion.

Any registry cleanup must be done carefully and tested against `/write`. Do not combine risky `/write` cleanup with the runtime promotion in the same step unless explicitly approved.

## Non-goals for first promotion

Do not solve all text surfaces in the first runtime merge.

Do not also promote:

```text
hubbyNote
windowWeather
photo captions
future panels
lapClose bubble rewrite
full overlay lifecycle coordinator
```

The first promotion is only coffeeCornerBubble ownership cleanup.

## Final rule

The tested clean framework is ready as a direction, not automatically promoted.

The next executable step must be chosen from this plan and must stay independent until Vicky explicitly approves promotion into `/cloud`.
