# Director Data Architecture - 2026-06-12

## Core rule

Do not keep two full director books.

```text
GitHub = world rules, director guide, structure registry, construction discipline
Supabase = current asset pool, runtime binding, public URLs, light hooks back to GitHub
```

## Source of truth split

Use GitHub for:

```text
world rules
DIRECTOR_GUIDE
TEXT_RULES
CONSTRUCTION_RULES
room-config scene cards
object-registry object/hotspot identity cards
hotspot coordinates and directorNotes while no Supabase hotspot table exists
```

Use Supabase for:

```text
current published assets
storage_path / public_url
which slot uses which asset
scene_group / scene_key
light director_ref hook
mood_tags
```

## Do not duplicate long director prose in Supabase

Supabase assets should not copy full `DIRECTOR_GUIDE` sections.

Use a pointer instead:

```text
director_ref: director.scenes.coffeeCorner
mood_tags: ["coffeeCorner", "domestic", "intimate", "dailyCare"]
```

Then the director flow is:

```text
1. Read current asset from Supabase.
2. Read scene_group / scene_key / director_ref / mood_tags from that asset.
3. Use director_ref to find the longer guide in GitHub docs/DIRECTOR_GUIDE.md.
4. Use docs/TEXT_RULES.md to choose Bubble / PermanentNote / InteractionPanel.
5. Output the matching nest text.
```

## Current Supabase hook fields

`public.nest_assets` now has:

```text
director_ref text
mood_tags text[]
```

Current backfill:

```text
room.home.background.day
-> director.scenes.home
-> [landing, day, soft, entry]

room.home.background.night
-> director.scenes.home
-> [landing, night, moonlit, soft]

room.coffeeCorner.background.main
-> director.scenes.coffeeCorner
-> [coffeeCorner, domestic, intimate, dailyCare]
```

## Future scene draw example

For a future dream garden scene pack:

Supabase stores:

```text
asset_id: dream_garden_pool_01
scene_group: dream.garden
scene_key: pool
director_ref: director.scenes.dreamGardenPool
mood_tags: ["dreamy", "garden", "poolside", "intimate"]
public_url: <current image URL>
status: published
```

GitHub stores:

```text
docs/DIRECTOR_GUIDE.md
-> director.scenes.dreamGardenPool
-> meaning / vibe / writing direction / sample lines

data/room-config.v1.json
-> scene thin card and active text ports

data/object-registry.v1.json
-> objects / hotspots / panels / directorRef hooks
```

## Future migration target

If editor/admin features need cloud-editable hotspot/dialogue metadata, create dedicated Supabase tables later:

```text
public.hotspots
public.scene_notes
public.hotspot_dialogue_lines
```

Until then, do not treat Supabase as the full director book.
