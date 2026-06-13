# Admin Entry and Bottom Navigation

## Current rule

Scene navigation stays at the bottom of the image.

```text
bottom-right = go forward / enter next room
bottom-left = return / previous room
```

Current runtime behavior:

```text
home -> coffeeCorner: bottom-right hotspot
coffeeCorner -> home: bottom-left hotspot
```

## Admin entry

Global management should not appear as a visible permanent scene button.

The old visible `素材` button is now a transparent upper-left management hot area.

Current management trigger:

```text
upper-left transparent zone
size: 28vw x 20vh
long press: 1.8s
short tap: no action
opens: existing setup/material panel
```

## Touch guardrail

The upper-left admin zone may suppress native iOS/WebView text selection and lookup callouts.

However, this suppression must be scoped:

```text
Only touches that start inside the upper-left admin zone may be blocked.
All other hotspot touchend/click behavior must pass through.
```

Do not use a global touchend/click block for admin long-press logic.

## Paw icon rule

Use `🐾` as the general management/settings symbol for Kitten Nest.

It may appear in:

```text
key replacement button
admin mode
management menu
future management room / 素材间
```

It should not become a permanent floating button on every scene unless explicitly approved.

## Future direction

Current bridge:

```text
upper-left long press -> existing material/setup panel
```

Future target:

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

Long-term ideal:

```text
No visible global admin button in immersive scenes.
A dedicated management room / 素材间 can hold admin objects diegetically.
```

## Runtime file

```text
assets/setup-toggle.js
```

Current injected version:

```text
/assets/setup-toggle.js?v=20260613-touchfix-1
```

Detailed incident and verification notes live in:

```text
docs/construction-logs/2026-06-13.md
```
