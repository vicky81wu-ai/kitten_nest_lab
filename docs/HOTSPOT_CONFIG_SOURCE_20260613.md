# Hotspot Config Source Plan - 2026-06-13

## Current rule

Runtime hotspot geometry currently lives in:

```text
assets/hotspot-positioner.js
```

Registry / scene identity lives in:

```text
data/object-registry.v1.json
data/room-config.v1.json
```

Do not use CSS patches as canonical hotspot position sources.

## Why the old photoHot CSS patch was removed

The old temporary injection in `api/app-coords.js` contained a `.photoHot` CSS size/position patch.

That created two competing truths:

```text
CSS patch says one position.
hotspot-positioner.js says another position.
```

After the photo wall hotspot was approved and moved into the base-image coordinate card, the CSS patch was removed.

Current official photo wall hotspot:

```text
id: coffeeCorner.photoWallHot
selector: .photoHot
roomElementId: gameRoom
imageId: gameBg
x: 0.250
y: 0.215
width: 0.340
height: 0.200
```

## Room gate rule

Hotspots must not leak across rooms.

Current runtime gate:

```text
coffeeCorner hotspots -> only when #gameRoom.active
home hotspots -> only when #home.active
```

This prevents home notebook hotspots from appearing in coffeeCorner and prevents coffeeCorner hotspots from appearing on home.

## Next configuration target

The desired future shape is:

```text
assets/hotspot-positioner.js = generic coordinate engine
data/object-registry.v1.json = object/hotspot identity and ownership
data/room-config.v1.json = active room scene cards
future data/hotspots-runtime.v1.json = runtime-safe coordinate cards, if needed
```

Do not rush this refactor while /cloud is stable.

Migration should happen in a short-lived test route or test branch first.

## Migration steps

```text
1. Keep current JS cards as canonical runtime truth for now.
2. Keep object-registry and room-config updated after every approved hotspot change.
3. When there are enough hotspots to justify it, create a static data/hotspots-runtime.v1.json file.
4. Teach hotspot-positioner.js to load that static JSON with fetch, with built-in fallback cards if the fetch fails.
5. Test outside /cloud first.
6. Only merge into /cloud after visual verification.
```

## Closeout reminder

After every approved hotspot or coordinate change:

```text
runtime code
-> Vicky verification
-> object-registry
-> room-config
-> director guide/text rules only if writing behavior changed
-> Supabase only if image assets or director_ref/mood_tags changed
-> Vercel status check
```
