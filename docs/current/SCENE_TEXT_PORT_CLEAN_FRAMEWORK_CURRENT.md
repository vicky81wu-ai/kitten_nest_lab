# Scene TextPort Clean Framework Current Card

Updated: 2026-06-17

Status: current tested direction, not promoted into `/cloud` runtime.

## Purpose

The lap-close bubble work established the preferred architecture for scene-owned text surfaces:

```text
scene-scoped textPort
+ explicit object identity
+ canonical tag / state fields
+ one interaction owner
+ base-image coordinate placement
+ no stale first-paint fallback
```

This pattern is now being generalized for future bubbles, panels, notes, captions, hints, and other text surfaces in the Kitten Nest world.

## Current tested files

```text
assets/scene-text-port-clean-controller.js
```

Reusable test-stage controller. It is not loaded by `/cloud`.

```text
scene-text-port-clean-framework-test.html
```

Independent test route for the reusable framework.

Earlier isolated test routes:

```text
coffee-corner-bubble-clean-test.html
coffee-corner-bubble-clean-runtime-test.html
```

These proved the clean owner pattern for `coffeeCornerBubble`, first with isolated selectors and then with production selector names.

## Verified independent test URLs

```text
https://kitten-nest-lab.vercel.app/coffee-corner-bubble-clean-test.html
https://kitten-nest-lab.vercel.app/coffee-corner-bubble-clean-runtime-test.html
https://kitten-nest-lab.vercel.app/scene-text-port-clean-framework-test.html
```

Vicky verified the first two coffeeCornerBubble clean tests and verified the generic framework test after the first-paint fallback flash was fixed.

## Core rules

### 1. No identity, no binding

Every text surface must have an object identity before it is connected to runtime behavior.

Minimum identity fields:

```text
id
roomId / sceneVariantId when applicable
kind: textPort
selector
owner
role
action
exclusive
runtimeStatus
coordinateStatus when attached to art
stateFields
directorRef / directorTags when writable
```

### 2. Canonical tag naming

Writable text targets must use scene/surface names, not generic scene-only names.

Examples:

```text
[coffeeCornerBubble]
[coffeeCornerLapCloseBubble]
[windowWeather]
[hubbyNote]
```

Deprecated or forbidden short names must not be promoted as canonical names.

### 3. One interaction owner

A textPort must have exactly one owner for user interaction.

For a bubble-like surface, the same owner controls:

```text
show
hide
showNext / queue advance
user hidden state
trigger hotspot behavior
```

No other bridge, text patch, overlay coordinator, or router may also toggle the same textPort.

### 4. Position is separate from interaction

Placement can be handled by the clean textPort controller or a future overlay lifecycle coordinator, but click/queue behavior must not be mixed into the scene router or overlay placement layer.

Correct split:

```text
sceneRouterClean = navigation only
sceneTextPortCleanController = textPort interaction + configured placement for this test phase
future overlay lifecycle coordinator = placement readiness and scene-level overlay scheduling only
```

### 5. No stale fallback on first paint

State-backed textPorts must not show stale fallback text before canonical state is ready.

Correct behavior:

```text
state-backed textPort:
  wait hidden until state/configured content is ready
  then render the canonical content once

no-state demo/test textPort:
  may use initialQueue

state failure:
  fallback is allowed only if the specific surface explicitly opts into degraded fallback
```

Forbidden behavior:

```text
show old legacy sentence first
then replace it with canonical state
```

This rule prevents flashes like `come here, kitten.` before the current coffeeCornerBubble line appears.

### 6. State-backed surfaces should prefer canonical fields

`coffeeCornerBubble` should read:

```text
coffeeCornerBubble
coffeeCornerBubbles
coffeeCornerBubbleIndex
```

Legacy fallback during migration may read:

```text
alexBubble
alexBubbles
bubbleIndex
```

The fallback path is migration-only and must not become the canonical source.

`coffeeCornerLapCloseBubble` reads:

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
coffeeCornerLapCloseBubbleUpdatedAt
```

## Tested framework capabilities

The reusable controller currently supports:

```text
create(config)
stateFields / fallbackStateFields
initialQueue for no-state tests
stateUrl:false for no-state surfaces
hide / show / showNext / toggleNext
trigger hotspot binding
base-image coverBox math
bottomRight anchor
bottomFromBaseline anchor
topLeft fallback anchor
deferInitialRenderUntilState
onRender diagnostics
```

## Current limitations

This framework is not promoted into `/cloud`.

It does not yet replace:

```text
api/app-q.js bridge
app-assets cloudTextPatch
index.html native bubbleOn / say
assets/bubble-controller.js production behavior
```

It must not be wired into `/cloud` until an explicit promotion plan is written and independently tested.

## Promotion requirements

Before any promotion into `/cloud`, write a staged plan naming:

```text
exact files to change
owners to retire
owners to keep
state fields used
selectors affected
protected chains touched
rollback method
independent test route / preview URL
full /cloud acceptance URL after merge
```

Promotion must not happen through a query flag on `/cloud`.

Forbidden:

```text
/cloud?sceneTextPortClean=1
/cloud?sceneOverlayLifecycleTest=1
```

Required:

```text
independent test route or test branch
Vicky verification
then explicit merge/promote into /cloud
```

## Rollback for current test-stage work

Current test-stage work can be removed without touching `/cloud` by deleting:

```text
assets/scene-text-port-clean-controller.js
scene-text-port-clean-framework-test.html
coffee-corner-bubble-clean-test.html
coffee-corner-bubble-clean-runtime-test.html
```

Do not delete these during normal cleanup unless they are replaced by a newer accepted test route or promoted implementation.

## Accepted direction

Use the lap-close bubble architecture as the global pattern for future scene text surfaces.

Do not keep adding one-off bridges and patches around old text surfaces.

Future work should move textPorts toward:

```text
object registry identity
canonical write tag
single owner controller
base-image coordinate placement
no stale fallback first paint
independent test route before promotion
```
