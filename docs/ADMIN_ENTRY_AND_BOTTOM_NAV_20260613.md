# Admin Entry and Bottom Navigation - 2026-06-13

## Decision

Scene navigation should stay at the bottom of the image.

```text
bottom-right = go forward / enter next room
bottom-left = return / previous room
```

Current runtime behavior:

```text
home -> coffeeCorner: bottom-right hotspot
coffeeCorner -> home: bottom-left hotspot
```

The old coffeeCorner return hotspot used the upper-left area. That area is now reserved for the management entry.

## Admin entry

Global management should not appear as a visible permanent scene button.

The old visible `素材` button is now a transparent upper-left management hot area.

Current rule:

```text
upper-left transparent zone
size: 28vw x 20vh
matches the bottom navigation hotspot footprint
long press 1.8s
-> open existing setup/material panel
```

Short tap does not open the material panel.

The upper-left admin zone must suppress native iOS/WebView text selection and lookup callouts:

```text
-webkit-user-select: none
user-select: none
-webkit-touch-callout: none
preventDefault on touchstart inside the admin zone
```

This prevents the blue selection handles / copy-query-translate bar from appearing during the long press.

This is a temporary bridge.

Future direction:

```text
upper-left long press -> 🐾 admin entry / management menu
```

Possible future admin items:

```text
素材面板
设置
key / auth
scene binding
asset admin
debug tools
export / import
```

## Paw icon rule

Use `🐾` as the general management/settings symbol for Kitten Nest.

It may appear in:

```text
key replacement button
admin mode
management menu
future Nest Studio / 素材间
```

But it should not become a permanent floating button on every scene unless explicitly approved.

## Why not a visible permanent button

Any permanent floating button can collide with future scene hotspots.

So the management layer should be reachable without occupying visible map space.

Current compromise:

```text
transparent upper-left long-press zone
```

Future ideal:

```text
No visible global admin button in immersive scenes.
A dedicated management room / 素材间 / Nest Studio can hold admin objects diegetically.
```

## Runtime file

Current controller:

```text
assets/setup-toggle.js
```

Current injected version:

```text
/assets/setup-toggle.js?v=20260613-admin-no-select-1
```
