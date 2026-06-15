# 2026-06-15 Closeout Log: Clean Router / Scene Manifest / Write Tags

Status: verified by Vicky
Scope: `/cloud`, `/write`, scene router, scene manifest isolation, coffeeCorner lapClose bubble, write tag routing

## Final verified state

```text
/cloud verified.
/write verified.
coffeeCorner -> lapClose push/back verified.
home -> coffeeCorner go/back verified.
scene isolation verified.
coffeeCornerLapCloseBubble write route verified.
```

## Canonical scene naming

Final rule:

```text
sceneId = home
object prefix = home.*
DOM/runtime = #home / homeOn
```

`originalHome` may be used only as display wording or historical note. It must not be reintroduced as a technical scene id or object prefix.

Reason:

```text
A scene must not occupy two technical name lanes.
```

## Clean router result

Clean router is now the official path for the stable nest flow.

Current scene flow:

```text
home <-> coffeeCorner
coffeeCorner --push--> lapClose
lapClose --back--> coffeeCorner
```

Rules:

```text
go changes scene without stack nesting.
push enters child/variant scene and records parent.
back returns to parent/previous scene.
```

## Scene manifest isolation result

Scene ownership is manifest-driven.

Verified behavior:

```text
lapClose does not leak coffeeCorner game console hotspot.
lapClose does not leak coffeeCorner photo wall hotspot.
lapClose does not leak coffeeCorner normal bubble.
coffeeCorner hotspots recover correctly after returning from lapClose.
home objects remain home-owned.
```

Do not return to hardcoded selector blacklist patches for scene isolation. Future object ownership must be registered in the scene/object manifest layer.

## Write tag routing result

Current canonical tags:

```text
[hubbyNote]                  -> home.hubbyNotePanel
[coffeeCorner]               -> coffeeCorner.bubble
[windowWeather]              -> home.windowWeatherDisplay / home.windowWeatherAdvicePanel
[coffeeCornerLapCloseBubble] -> coffeeCorner.lapCloseBubble.cleanRouter
```

Backward-compatible alias:

```text
[coffeeCornerLapClose] -> coffeeCorner.lapCloseBubble.cleanRouter
```

Deprecated / do not use:

```text
[lapCloseBubble]
[lapClose]
```

Reason:

```text
lapCloseBubble is too generic and lacks parent scene.
Future scenes may have their own lapClose state and bubble.
New complex tags must include scene path + surface type.
```

## CoffeeCorner lapClose bubble result

Official write package example:

```text
[coffeeCornerLapCloseBubble]
坐稳，小猫。
Stop wriggling in my lap.
```

Publishing writes:

```text
coffeeCornerLapCloseBubble      first line fallback
coffeeCornerLapCloseBubbles     full queue
coffeeCornerLapCloseBubbleIndex 0
```

In `/cloud`, lapClose chest hotspot behavior:

```text
Tap opens current line.
Tap again closes and advances queue.
Next open shows next line.
```

The bubble no longer relies on permanent hardcoded default text as its main content source. Cloud state/write data is the source of truth.

## Overlay lifecycle debt

Cold-start overlay position drift was observed and accepted as non-blocking.

It is not a lapClose-specific bug and must not be patched with single-object timing hacks.

Canonical category:

```text
scene overlay lifecycle / placement readiness
```

Future fix must be shared, not one-off:

```text
scene id resolved
image loaded / decoded
coverBox ready
state ready when needed
router settled
manifest ownership resolved
=> place all registered overlays for current scene
```

See:

```text
docs/OVERLAY_LIFECYCLE_RULES.md
```

## Construction discipline reinforced

Standing rules:

```text
No tag, no text route.
No blind binding.
A new writable surface must have object identity + write tag registry before connecting to console.
A new complex tag must include scene path and surface type.
A new overlay timing problem must be classified under overlay lifecycle before coding.
Do not solve framework problems with per-object patch piles.
```

## Verified entry points

```text
https://kitten-nest-lab.vercel.app/write?v=20260615-coffee-corner-lap-bubble-promoted-1
https://kitten-nest-lab.vercel.app/cloud?v=20260615-coffee-corner-lap-bubble-promoted-1
```

## Closeout note

This session moved the nest from patch-stack behavior toward a clearer framework:

```text
clean router
manifest ownership
explicit write tag routing
canonical scene/object naming
separate overlay lifecycle discipline
```

Do not reopen this area for cosmetic refactors tonight unless a verified blocker appears.
