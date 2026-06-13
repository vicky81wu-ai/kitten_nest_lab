# Approved Hotspot - coffeeCorner.gameConsoleHotspot

Date: 2026-06-13

Status: approved by Vicky after debugHotspot visual inspection.

## Target

```text
Scene: coffeeCorner
Object: visible handheld game console on the lower-left table
Selector: .consoleHot
Behavior: openGameMenu
Coordinate mode: lockedToBaseImage
Image id: gameBg
Room element id: gameRoom
```

## Approved coordinate

```json
{
  "x": 0.205,
  "y": 0.700,
  "width": 0.310,
  "height": 0.125
}
```

## Runtime source

```text
assets/hotspot-positioner.js
```

Runtime version after approval:

```text
/assets/hotspot-positioner.js?v=20260613-console-up-1
```

## Notes

The previous visible debug frame was too low and covered lower table area instead of the console.

Vicky approved the final upward move with:

```text
好，就这样。定了
```

Do not change this coordinate silently. Future changes must be versioned and visually re-approved.
