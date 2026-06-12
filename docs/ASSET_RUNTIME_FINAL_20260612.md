# Asset Runtime Final Summary - 2026-06-12

## Final state

Supabase asset-library phase 1 is complete.

Official `/cloud` now uses this priority order:

```text
IndexedDB local override
-> Supabase active room_asset_slots + published nest_assets public_url
-> GitHub static fallback
```

## Correct resolver location

The resolver is a static browser file:

```text
/lib/asset-resolver.js
```

Do not put resolver logic under:

```text
/api
```

Reason:

```text
Vercel Hobby has a Serverless Function count limit.
Browser-only asset resolving, public image reads, scene switching, and CSS transitions must stay static.
```

The accidental API resolver was removed:

```text
/api/asset-resolver.js
```

## Local key mapping

```text
home / background.day -> homeOn
home / background.night -> homeOff
coffeeCorner / background.main -> gameRoom
```

## Supabase registry

Current slot bindings:

```text
home / background.day -> room.home.background.day
home / background.night -> room.home.background.night
coffeeCorner / background.main -> room.coffeeCorner.background.main
```

Current storage paths:

```text
assets/rooms/home/day.jpg
assets/rooms/home/night.jpg
assets/rooms/coffee-corner/morning-evening.jpg
```

## Test entries

```text
/cloud
/dynamic-preview.html
/asset-resolver-test
/asset-runtime-test
/local-reset
/assets-upload-edge
```

`/cloud-dynamic-test` is deprecated. Use `/dynamic-preview.html` instead.

## API budget rule

Do not add a new Vercel `/api` function for:

```text
public image lookup
scene switching
CSS animation
fade in / fade out
public Supabase asset reads
```

If function budget gets tight, the first shrink candidate is weather, because the current weather feature is text/controller behavior, not a hard backend requirement.

## Protected areas

Do not casually touch:

```text
canvas-fill.css
100lvh layout
.bg object-fit behavior
hotspot coordinate math
bubble click behavior
/write workflow
```

## Completion marker

Phase 1 is complete when:

```text
/cloud loads normally
local images still win when present
Supabase slot binding works when local image is absent
GitHub fallback remains available
Vercel deploy is success
```
