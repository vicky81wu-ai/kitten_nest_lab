# Hotspot Runtime Final Notes - 2026-06-12

## Final pinned hotspot

Current finalized home pink notebook hotspot:

```text
id: home.hubbyNoteHot
roomId: home
imageId: homeOn
selector: .hubbyNoteButton
coordinateMode: lockedToBaseImage
x: 0.800
y: 0.605
width: 0.22
height: 0.18
rotation: 7.1deg
transformOrigin: 0 0
visual: transparent
behavior: hubbyNote.open
```

Meaning:

```text
The hotspot is anchored to the base image coordinate system, not to viewport pixels.
It follows the covered home background image and stays on the physical pink notebook object.
```

## Source of truth

Runtime hotspot coordinates currently live in GitHub:

```text
assets/hotspot-positioner.js
```

Supabase currently remains the source of truth for asset library data:

```text
nest_assets
room_asset_slots
```

Do not treat Supabase asset metadata as the hotspot/dialogue source yet.

## Director notes rule

Until a dedicated Supabase table exists for interactive object notes, director-facing hotspot intent should be read from GitHub hotspot cards / docs.

Current rule:

```text
GitHub = code, hotspot geometry, directorNotes, protected construction memory
Supabase = image assets, scene_group metadata, current slot bindings, upload/publish registry
```

Future migration target:

```text
public.hotspots
public.scene_notes
public.hotspot_dialogue_lines
```

Only after those tables exist and are wired into runtime/admin tools should director dialogue metadata move from GitHub docs into Supabase.

## Rotation support

Hotspot cards support:

```text
rotation
transformOrigin
```

This allows future slanted objects to have aligned transparent click areas without creating irregular polygon hitboxes.

## Protected behavior

Do not break:

```text
clock overlay coordinates
coffeeCorner tattoo hotspot
home notebook button behavior
canvas-fill / 100lvh layout
```
