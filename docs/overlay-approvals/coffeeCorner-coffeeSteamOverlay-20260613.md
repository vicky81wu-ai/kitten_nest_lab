# Approved Overlay - coffeeCorner.coffeeSteamOverlay

Date: 2026-06-13

Status: approved by Vicky as the current best coffee steam version before sunbeam experiments.

## Target

```text
Scene: coffeeCorner
Overlay: coffee cup steam
Selector: .steam
Kind: decorative visual overlay, not hotspot
Behavior: SVG mist steam installed by assets/coffee-steam-svg.js
Image id: gameBg
Room element id: gameRoom
Coordinate mode: lockedToBaseImage
```

## Approved runtime visual version

```text
/assets/coffee-corner-polish.css?v=20260613-steam-mist-left-1
/assets/coffee-steam-svg.js?v=20260613-mist-1
```

## Source placement before conversion

```css
.steam {
  right: 45.4%;
  top: 24.7%;
  width: 8.6%;
  height: 13.2%;
}
```

## Approved base-image coordinate card

Converted from the approved CSS placement:

```text
x = 1 - right - width / 2 = 1 - 0.454 - 0.086 / 2 = 0.503
y = top + height / 2 = 0.247 + 0.132 / 2 = 0.313
```

```json
{
  "id": "coffeeCorner.coffeeSteamOverlay",
  "roomId": "coffeeCorner",
  "kind": "decorativeOverlay",
  "selector": ".steam",
  "coordinateMode": "lockedToBaseImage",
  "imageId": "gameBg",
  "roomElementId": "gameRoom",
  "approvedCoordinate": {
    "x": 0.503,
    "y": 0.313,
    "width": 0.086,
    "height": 0.132
  },
  "runtimeStatus": "active",
  "versionStatus": "canonicalCurrent",
  "changePolicy": "mutableWithVersion"
}
```

## Notes

This overlay is not clickable. It must stay gated to `#gameRoom.active` and must not leak into the home scene.

The visual effect is intentionally soft, misty, layered, and semi-transparent. Do not revert to three rigid white vertical bars.

Future runtime migration should move `.steam` positioning into `assets/hotspot-positioner.js` as a `baseImageLocked` overlay card using the approved coordinate above. The initial runtime migration attempt was not forced because the GitHub safety layer blocked a full-file update; this card preserves the approved truth first.
