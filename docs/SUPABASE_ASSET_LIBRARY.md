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

## Local image reset test entry

Standalone test entry:

```text
/local-reset
```

Purpose:

```text
Clear current-device IndexedDB local image overrides without touching /cloud runtime code.
```

Validated behavior:

```text
In normal Safari or screen-home/PWA, /local-reset can clear the coffee-corner local override and return to /cloud so the Supabase default coffee-corner image appears.
```

Important testing rule:

```text
Do not use private/incognito browsing to judge local image upload or local reset behavior.
Private browsing has separate/temporary storage and is only useful for checking cloud defaults as a clean-browser simulation.
```

Current merge status:

```text
Keep local reset as a standalone test/utility entry for now.
Do not merge reset controls into the main /cloud setup panel until deliberately requested and re-tested.
```

## Admin asset upload test

Standalone admin upload test entry:

```text
/assets-upload-edge
```

Current backend route:

```text
Supabase Edge Function: nest-asset-upload-form
```

Upload flow:

```text
Browser form
-> Edge Function receives access_token in FormData
-> Edge Function validates the Supabase Auth user
-> Edge Function checks public.nest_admins admin whitelist
-> Edge Function uploads to Storage using service_role
-> Edge Function inserts one public.nest_assets registry record using service_role
```

Validated behavior:

```text
Admin upload can upload a test image to Supabase Storage and register a draft asset row in public.nest_assets.
```

Validated draft asset example:

```text
asset_id: room.coffeeCorner.background-main.20260612T090613Z
room_id: coffeeCorner
asset_type: roomBackground
storage_path: assets/rooms/coffeeCorner/uploads/background-main-20260612T090613Z.png
status: draft
```

Known orphan from first registry-permission test:

```text
assets/rooms/coffeeCorner/uploads/background-main-20260612T090104Z.png
```

Reason:

```text
Storage upload succeeded before service_role had INSERT permission on public.nest_assets.
The registry insert then failed, leaving one unregistered Storage object.
```

Current orphan prevention:

```text
nest-asset-upload-form v2 attempts to delete the just-uploaded Storage object if the registry insert fails.
```

Do not wire this upload test into /cloud runtime until the publish/bind flow is separately tested.

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
