# Kitten Nest World Tree

Updated: 2026-06-10

This document describes the intended world structure. It is a planning map, not runtime code.

## Current active world

```text
Kitten Nest
└── indoor
    ├── home / landing room        [partial]
    └── coffeeCorner               [active]
        ├── rotating bubble port    [active]
        ├── window weather          [active]
        ├── 19.8 tattoo hotspot     [active]
        ├── game console hotspot    [active / protected]
        ├── setup panel             [active / manual entry must remain]
        └── local image upload      [active / must remain]
```

## Future rooms

```text
Kitten Nest
├── indoor
│   ├── restaurant                  [future]
│   └── bedroom                     [future]
├── outdoor
│   └── fountain                    [future]
├── secret
│   └── privateRoom                 [future]
└── fun
    └── photoBooth                  [future]
```

Future rooms must not be wired into the live front end until the room engine and coordinate system are ready.

## World-building principle

The nest should grow through configuration, not new API files.

Rooms, hotspots, overlays, and text ports should live in static configuration files, such as:

- `data/room-config.v1.json`
- `data/object-registry.v1.json`

Runtime code should read the configuration later, after the current coffee-corner chain is collected into clear modules.

## Director principle

Objects are not just buttons. They have meaning, vibe, and director use.

A hotspot may include:

- technical identity
- visual location
- owner
- action
- exclusivity
- mood
- director use
- sample lines

This lets future dialogue and interaction be guided by the world map rather than by ad-hoc selectors.
