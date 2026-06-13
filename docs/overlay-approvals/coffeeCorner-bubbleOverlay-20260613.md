# Approved Overlay - coffeeCorner.bubbleOverlay

Date: 2026-06-13

Status: approved by Vicky after visual inspection.

## Target

```text
Scene: coffeeCorner
Overlay: rotating speech bubble
Selector: .bubble
Kind: text overlay, not hotspot
Behavior: display rotating coffeeCorner bubble lines
Growth rule: bottom edge stays pinned; longer text grows upward
```

## Approved placement

```css
body.cloudDefaultAssets #gameRoom.active .bubble{
  top: auto !important;
  right: 9.5% !important;
  bottom: 77% !important;
  max-width: 48% !important;
  min-width: 118px;
  transform-origin: 100% 100%;
}
```

## Runtime source

```text
assets/coffee-corner-polish.css
```

Injected version after approval:

```text
/assets/coffee-corner-polish.css?v=20260613-bubble-up-2
```

## Coordinate note

This is not a clickable hotspot and does not use base-image x/y coordinates yet.

Current coordinate mode:

```text
viewport/room overlay placement by CSS percent
```

Future possible upgrade:

```text
baseImageLocked text overlay anchored near Alex hair/face area
```

Do not change this placement silently. Future changes must be versioned and visually re-approved.
