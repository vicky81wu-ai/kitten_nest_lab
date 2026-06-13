# Kitten Nest Construction Rules

Updated: 2026-06-13

These rules exist to prevent rough patching as the nest grows from a small page into a larger interactive world.

## Core rule

No identity, no binding.

Before adding or changing any event binding, hotspot, overlay, panel, text port, asset path, or room object, check the room config and object registry first.

## Stable /cloud gate rule

The main `/cloud` route is the stable nest, not an experiment area.

Any unverified feature, visual patch, asset cleanup button, hotspot change, panel change, upload-flow change, or runtime experiment must not be installed directly into `/cloud`.

Required flow:

```text
independent test route or test branch
-> Vicky verifies it
-> merge into main /cloud only after acceptance
-> if it fails, discard or roll back without polluting /cloud
```

This rule protects:

- Supabase/default image loading
- GitHub/static fallback image loading
- local upload and setup panel access
- coffeeCorner bubbles
- windowWeather and weather advice
- 19.8 tattoo hotspot
- game console hotspot
- powder notebook
- PWA/screen-nest stability

If a change has not been verified, keep it out of `/cloud`. Use a test entry such as `/cloud-hotspot-test`, `/cloud-assets-test`, or a separate branch/preview deployment.

No future construction window should ask Vicky to guard the stable route manually. The construction agent must guard it.

## STATE protection rule

Supabase `nest_state` is a protected live-content store, not a debugging field dump.

State is more dangerous than a visual hotspot because `/cloud` reads it as the current active nest content. Do not casually clear, overwrite, or reshape state while fixing layout, hotspots, panels, assets, or visual bugs.

Protected live state may include:

```text
alexBubble / alexBubbles / bubbleIndex
coffeeCornerLapCloseBubble / coffeeCornerLapCloseBubbles / coffeeCornerLapCloseBubbleIndex
windowTemp / windowDesc
hubbyNote / hubbyNoteArchive / hubbyNoteHistory / hubbyNoteFavorite / hubbyNoteTrash
pendingDrafts
lastPublishedAt / previousPublished / updatedAt
```

Hard rules:

- State is not a test route.
- Do not edit state while also changing hotspots, bubbles, `/write`, assets, or panels in the same unverified step.
- Do not clear state fields without first reading and saving a full `/api/state` backup.
- Do not overwrite the whole state object when only a few fields are intended.
- Only patch explicit fields that were named before the operation.
- Never touch unrelated protected fields such as `alexBubbles`, `hubbyNote`, `windowTemp`, `windowDesc`, or `pendingDrafts` while cleaning a different feature.
- If state cleanup fails or creates a regression, restore from the saved backup before applying more patches.

Required flow for state cleanup:

```text
1. Read current /api/state.
2. Save the full state JSON as a rollback backup.
3. Name the exact fields to change.
4. Confirm which fields must not be touched.
5. Apply a narrow patch only to those fields.
6. Verify /cloud and /write behavior.
7. If broken, restore the backup first; do not stack more patches.
```

Example: if only an old lap-close bubble corpse must be cleared, the intended patch should be limited to fields such as:

```json
{
  "coffeeCornerLapCloseBubble": "",
  "coffeeCornerLapCloseBubbles": [],
  "coffeeCornerLapCloseBubbleIndex": 0
}
```

Do not touch these during that cleanup:

```text
alexBubble / alexBubbles / bubbleIndex
hubbyNote / hubbyNoteArchive / hubbyNoteHistory
windowTemp / windowDesc
pendingDrafts
```

## Object identity card

Every active or planned interactive object should have a static identity card in `data/object-registry.v1.json` or `data/room-config.v1.json` before runtime code binds to it.

Minimum identity fields:

```text
id
roomId
kind
selector or plannedSelector
owner
role
action
exclusive
runtimeStatus
versionStatus
changePolicy
```

Recommended meaning:

```text
runtimeStatus: active | partial | future | deprecated
coordinateStatus: baseImageLocked | legacyViewport | future | none
versionStatus: canonicalCurrent | draft | legacy | experimental
changePolicy: mutableWithVersion | fixedUntilReplaced | futureDecision
```

`canonicalCurrent` means "current official truth", not "unchangeable forever".

A current official object can still change later if the change is explicit, versioned, and documented. The nest is a living map, not a stone tablet.

## Required preflight before runtime code changes

Before changing runtime code, answer these questions:

1. Which route is affected? If it is `/cloud`, has the change already passed an independent test route or preview?
2. Which state fields could be affected? If any state write/cleanup is involved, where is the full `/api/state` backup and the exact field list?
3. Which room is affected?
4. Which object, hotspot, overlay, panel, text port, or asset pipeline is affected?
5. Does it already have an identity card in `data/object-registry.v1.json` or `data/room-config.v1.json`?
6. Does the selector already have a primary owner?
7. Is the existing item `exclusive: true`?
8. Is the current object `canonicalCurrent` and `mutableWithVersion`?
9. What stable chain could this affect?
10. Is this a bug fix, a feature, architecture collection, or pure visual polish?
11. What is the rollback plan?

If the object has no identity card, create or update the registry entry first. Do not bind code by guessing.

If the change is not verified, do not put it on `/cloud`.

If state is involved, do not proceed without a backup and an exact patch list.

## Ownership rules

- Every object must have an `id`.
- Every hotspot must have a `selector` or planned selector.
- Every selector must have one primary owner.
- `exclusive: true` means the selector/action cannot be reused by another feature.
- Do not reuse an existing class or selector just because it is convenient.
- Do not build blacklist rules like "X cannot steal Y". Use ownership and exclusivity instead.
- If an object needs to share a selector, the identity card must say so explicitly with a shared owner or a deliberate `exclusive:false` policy.

## Protected stable chains

Do not casually change these without a staged plan:

- `/cloud` stable route itself
- Supabase `nest_state` live content
- `/write` update package workflow
- coffee-corner bubble publishing
- 19.8 tattoo hotspot behavior
- photo wall memories hotspot behavior
- window weather display and weather advice popup
- powder notebook current page, archive, favorite/delete, and key hiding
- game console / game menu hotspot
- local upload / setup panel access
- default static image loading

## Setup panel rule

Default hidden does not mean permanently disabled.

The setup panel may be hidden by default, but the manual entry path must remain available. Local upload and local override behavior must not be sealed off by a visual patch.

## Visual patch rule

A visual patch must not block interaction.

Do not cover a layout issue with a color band or invisible layer if it interferes with panels, buttons, or touch areas.

Visual polish should not change ownership, selector bindings, cloud state, or room navigation.

## Coordinate rule

Hotspots and overlays should be locked to base-image coordinates, not to device-specific offsets.

Do not solve Safari/PWA differences by nudging one device separately. The intended direction is:

```text
base image coordinates
-> object-fit cover crop math
-> screen coordinates
```

If a coordinate is current and approved, mark it as:

```text
coordinateStatus: baseImageLocked
versionStatus: canonicalCurrent
changePolicy: mutableWithVersion
```

This means the coordinate is the official current version, while still allowing future versioned adjustment.

## PWA rule

PWA cold-start issues are a separate testing track.

Do not mix PWA cold-start debugging with hotspot, coordinate, panel, or room-expansion work. Record network/VPN state before judging whether code is broken.

Safari success plus PWA failure does not automatically mean runtime code is broken. Check network, cache, static asset loading, and local image fallback before structural changes.

## Documentation rule

Do not write a giant incident diary for every bug.

Permanent docs should keep only:

```text
current rule
current object identity
current coordinates / selectors
current owner/exclusive policy
stable guardrail
one short example only if it teaches the rule
```

Construction logs should keep:

```text
incident sequence
failed attempts
regressions
verification notes
temporary handoff details
```

Use this split:

```text
docs/*.md = permanent rules / current architecture
docs/construction-logs/YYYY-MM-DD.md = day-specific construction history
```

When a permanent doc starts reading like a diary, move the incident details into the dated construction log and leave only the current rule behind.

## Closeout checklist

A construction task is not truly finished just because runtime code works.

Before saying a task is done, the construction agent must complete this closeout checklist:

```text
1. Runtime code changed and deployed or intentionally kept static-only.
2. Vicky verified the visible behavior, or the task is clearly marked as unverified.
3. Approved coordinates / selectors / bindings are pinned in the runtime source of truth.
4. data/object-registry.v1.json is updated for any object, hotspot, overlay, panel, text port, or pipeline identity change.
5. data/room-config.v1.json is updated for any room, scene, active hotspot, active object, text port, or coordinate-space change.
6. docs/DIRECTOR_GUIDE.md or docs/TEXT_RULES.md is updated if the change affects writing behavior, directorRef, text container rules, or scene meaning.
7. Supabase nest_assets is updated only when the change affects image assets, current slot bindings, public URLs, scene_group / scene_key, director_ref, or mood_tags.
8. Supabase nest_state was backed up before any state write/cleanup; exact touched fields were documented; unrelated live fields were not changed.
9. Vercel status is checked when a deploy is expected.
10. Any temporary test route, debug flag, or experimental patch is either removed, documented, or clearly marked as temporary.
```

Short rule:

```text
Code first, verify, then write the registry and room card before calling it done.
```

Do not make Vicky remind the construction agent to write the registry after every approved hotspot or coordinate change.

## Patch rule

Temporary patches must be documented at the level needed to prevent confusion.

Each patch should have:

- what problem it solves
- what area it touches
- whether it is temporary
- which future controller should own it
- when it can be removed

## Future architecture direction

Collect runtime logic in this order:

1. stateClient
2. weatherController
3. assetController
4. bubbleController
5. roomConfig runtime evaluation

Bubble and tattoo behavior should be collected last, because it is currently stable and high risk.
