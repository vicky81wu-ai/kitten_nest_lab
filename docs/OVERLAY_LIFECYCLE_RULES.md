# Overlay Lifecycle Rules

Status: architecture rule
Updated: 2026-06-15

## Core rule

Overlay placement must be coordinated at scene level.

Do not keep fixing one overlay at a time with private timing patches.

## Problem class

The following symptoms belong to one shared category:

```text
cold-start overlay appears in an old position
refresh enters before image dimensions settle
overlay appears before coverBox is ready
overlay corrects itself after another hotspot is tapped
scene switch leaves an overlay stale until another action reconciles it
```

These are not separate bugs for steam, clock hands, lap bubble, photo glow, or future overlays.

They are all:

```text
scene overlay lifecycle / placement readiness problems
```

## Required future direction

Build a unified scene overlay lifecycle coordinator.

A scene should place its overlays only after these gates are settled:

```text
scene id resolved
scene image present
image loaded / decoded when applicable
coverBox ready
state loaded when overlay text/state depends on cloud data
router transition settled
scene manifest ownership resolved
```

Then the coordinator should place all registered overlays for the current scene.

## Registered overlay examples

```text
home.clockHandsOverlay
coffeeCorner.steamOverlay
coffeeCorner.photoGlowOverlay
coffeeCorner.lapCloseBubble.cleanRouter
```

## Anti-patterns

```text
Do not add a special delay only for coffee steam.
Do not add a special delay only for lapClose bubble.
Do not add a special delay only for clock hands.
Do not solve overlay timing by stacking unrelated setTimeout patches.
Do not bypass scene manifest / object registry for overlay ownership.
```

## Acceptable temporary action

A temporary local guard may be used only if:

```text
1. It is explicitly marked temporary.
2. It does not change object ownership.
3. It does not create a new parallel routing path.
4. It is logged as debt under this overlay lifecycle rule.
5. It is removed when the coordinator exists.
```

## Current note

Coffee-corner lap-close bubble cold-start position drift was accepted as non-blocking after validation.
It must be tracked under this shared overlay lifecycle category, not as a one-off lap bubble fix.
