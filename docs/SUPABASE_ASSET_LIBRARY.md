# Supabase Asset Library

This document records the first Supabase asset-library foundation for Kitten Nest.

## Project

```text
Project name: kitten-nest-lab-assets
Project ref: pmkxzmogolxllijzqnfr
Project URL: https://pmkxzmogolxllijzqnfr.supabase.co
```

## Storage

Public bucket:

```text
nest-public-assets
```

Public asset base path:

```text
/storage/v1/object/public/nest-public-assets/
```

## Path rule

Supabase public asset paths mirror the existing GitHub static asset paths under `assets/`.

This keeps future migration from GitHub static fallback images to Supabase public assets simple and predictable.

Current public asset paths:

```text
assets/rooms/home/day.jpg
assets/rooms/home/night.jpg
assets/rooms/coffee-corner/morning-evening.jpg
```

To construct a public URL, combine:

```text
Project URL + public asset base path + storage_path
```

Example shape:

```text
https://<project-ref>.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/morning-evening.jpg
```

## Database registry tables

Created in Supabase:

```text
public.nest_assets
public.room_asset_slots
```

`nest_assets` stores asset identity and storage location.

`room_asset_slots` stores which room slot currently uses which asset.

## Current registered assets

```text
room.home.background.day
- room_id: home
- asset_type: roomBackground
- bucket: nest-public-assets
- storage_path: assets/rooms/home/day.jpg
- status: published

room.home.background.night
- room_id: home
- asset_type: roomBackground
- bucket: nest-public-assets
- storage_path: assets/rooms/home/night.jpg
- status: published

room.coffeeCorner.background.main
- room_id: coffeeCorner
- asset_type: roomBackground
- bucket: nest-public-assets
- storage_path: assets/rooms/coffee-corner/morning-evening.jpg
- status: published
```

## Current room asset slots

```text
home / background.day -> room.home.background.day
home / background.night -> room.home.background.night
coffeeCorner / background.main -> room.coffeeCorner.background.main
```

## Current /cloud integration status

`api/app-assets.js` now uses Supabase public asset URLs as the first default image source.

GitHub static `/assets/rooms/...` images remain the direct fallback source.

No new Vercel API was added.

The 100lvh canvas baseline, `.bg` image class, `object-fit: cover` behavior, hotspot coordinate code, bubble code, weather code, and `/write` workflow were not changed for this integration.

Current runtime image order:

```text
Supabase public asset
-> GitHub static fallback
-> fallbackPaint
```

User-facing intended asset priority still remains:

```text
local upload override
-> Supabase public default asset
-> GitHub static fallback
```

## Migration principle

```text
GitHub remains the code, config, documentation, and fallback source.
Supabase Storage becomes the high-resolution asset library.
Supabase database tables become the runtime asset registry.
Do not delete GitHub fallback images until /cloud can safely read Supabase assets first and fall back to GitHub static paths if Supabase lookup fails.
Do not add a new Vercel API for asset lookup unless there is a deliberate future security reason.
```

## Intended future loading order

```text
local upload override
-> Supabase published asset
-> GitHub static fallback
```

## Protected rule

Do not change the Supabase path convention casually. For migrated default assets, keep the Supabase storage path aligned with the GitHub static asset path.

Do not touch canvas-fill.css, 100lvh, `.bg`, object-fit cover, or hotspot coordinate math when changing asset sources.
