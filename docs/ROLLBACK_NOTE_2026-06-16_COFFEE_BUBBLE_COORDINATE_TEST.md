# Rollback Note — CoffeeCorner Bubble Coordinate Test

Date: 2026-06-16

## Failed safety line

Do not promote:

```text
sceneOverlayLifecycleTest=1
```

Observed failure:

```text
coffeeCorner normal bubble jumps / repeatedly opens and closes / cannot be closed normally
```

Known broken safety commit reference:

```text
bfce2cab838486288a2369aa1d543a0a82976c93
```

## Reason

The failed line touched lifecycle/show behavior and caused conflict with the bubble controller's own show/hide state.

## New safety line

Use instead:

```text
coffeeCornerBubbleCoordinateSourceTest=1
```

Purpose:

```text
Test coordinate source cleanup only.
Do not touch bubble show/hide.
Do not advance bubble queue.
Do not call KittenNestBubble.show/hide/sync.
```

## Source of truth

Old visual position comes from inline CSS:

```text
.bubble right/top defaults in index.html
```

Correct position comes from:

```text
hotspot-positioner.js -> coffeeCorner.bubbleOverlay
```

The safety test hides the bubble until it has been claimed by:

```text
data-coordinate-overlay="coffeeCorner.bubbleOverlay"
```

## Promotion rule

Only promote if Vicky verifies:

```text
1. coffeeCorner bubble does not flash at the old face-blocking position.
2. bubble show/hide remains normal.
3. bubble does not auto open/close.
4. game console, photo wall, 19.8, lapClose, back flow remain normal.
```
