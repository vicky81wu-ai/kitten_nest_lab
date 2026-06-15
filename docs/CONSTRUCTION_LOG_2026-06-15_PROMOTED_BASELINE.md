# 2026-06-15 Promoted Baseline Log

Status: verified by Vicky
Scope: clean router, scene manifest isolation, home naming, lapClose bubble queue, write tag routing, overlay lifecycle discipline

## Final verified runtime

Stable entries:

```text
/cloud
/write
```

Verified promoted scene flow:

```text
home <-> coffeeCorner
coffeeCorner -> push(lapClose)
lapClose -> back() -> coffeeCorner
```

Verified behavior:

```text
lapClose does not leak coffeeCorner game console / photo wall / tattoo / panels.
lapClose bubble opens and closes from its own scene-owned target.
coffeeCornerLapCloseBubble queue publishes from /write and displays in /cloud.
```

## Naming correction

Final technical scene name:

```text
sceneId = home
```

Do not use `originalHome` as a technical scene id in the promoted runtime.
It may remain only as wording/display description for the first/default home.

Object prefix:

```text
home.*
```

Reason:

```text
A single scene must not occupy two technical namespaces such as originalHome and home.*.
```

## Write tag routing

Canonical active tags:

```text
[hubbyNote]
[coffeeCorner]
[windowWeather]
[coffeeCornerLapCloseBubble]
```

Backward-compatible alias:

```text
[coffeeCornerLapClose]
```

Rejected generic tags:

```text
[lapClose]
[lapCloseBubble]
```

Reason:

```text
Nested write tags must include parent scene + child scene + surface type.
coffeeCornerLapCloseBubble = coffeeCorner + lapClose + Bubble.
```

## Lap-close bubble queue

Publishing package:

```text
[coffeeCornerLapCloseBubble]
坐稳，小猫。
Stop wriggling in my lap.
```

Writes:

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
coffeeCornerLapCloseBubbleUpdatedAt
```

Runtime behavior:

```text
Open hotspot -> show current line.
Close bubble -> hide and advance index.
Open again -> show next line.
```

## Scene manifest isolation lesson

Correct architecture:

```text
sceneRouterClean owns navigation.
scene manifest owns scene/object membership.
```

Rules:

```text
Parent scene owns the hotspot that enters a child scene.
Child scene owns its own overlays and child-only hotspots.
Child scene inherits only explicit navigation.
Parent scene hotspots/panels must not remain active under pushed child scenes.
No selector-blacklist patch should be treated as final architecture.
```

## Overlay lifecycle lesson

Accepted imperfection:

```text
On cold refresh, lapClose bubble can briefly appear at an old/low position until layout/state/router reconciliation catches up.
```

Correct classification:

```text
scene overlay lifecycle / placement readiness
```

Do not fix by one-off timing patches for individual overlays.
Future fix must coordinate:

```text
scene id
image load / decode
coverBox
state load
router settled
manifest ownership
registered overlays
```

See:

```text
docs/OVERLAY_LIFECYCLE_RULES.md
```

## Files changed during final promoted baseline

Runtime / active files:

```text
write.html
assets/lap-close-bubble-clean.js
api/app-bubble.js
```

Routing / discipline files:

```text
PROJECT_STATUS.md
data/write-tag-registry.v1.json
docs/WRITE_TAG_ROUTING.md
docs/OVERLAY_LIFECYCLE_RULES.md
```

## Current hold line

Do not open new features immediately after this baseline.

Next safe work should be one of:

```text
1. documentation cleanup only
2. read-only checker / registry audit
3. overlay lifecycle coordinator design, not implementation
4. small follow-up verification of the promoted /write + /cloud chain
```

Do not add a new visible room until the current baseline has stayed stable.
