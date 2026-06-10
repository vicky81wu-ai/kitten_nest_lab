# Kitten Nest Construction Rules

Updated: 2026-06-10

These rules exist to prevent rough patching as the nest grows from a small page into a larger interactive world.

## Core rule

No identity, no binding.

Before adding or changing any event binding, hotspot, overlay, panel, or text port, check the room config and object registry first.

## Required preflight before code changes

Before changing runtime code, answer these questions:

1. Which room is affected?
2. Which object, hotspot, overlay, panel, or text port is affected?
3. Does it already have an identity card in `data/object-registry.v1.json`?
4. Does the selector already have a primary owner?
5. Is the existing item `exclusive: true`?
6. What stable chain could this affect?
7. Is this a bug fix, a feature, or architecture collection?
8. What is the rollback plan?

If the object has no identity card, create or update the registry entry first. Do not bind code by guessing.

## Ownership rules

- Every object must have an `id`.
- Every hotspot must have a `selector` or planned selector.
- Every selector must have one primary owner.
- `exclusive: true` means the selector/action cannot be reused by another feature.
- Do not reuse an existing class or selector just because it is convenient.
- Do not build blacklist rules like "X cannot steal Y". Use ownership and exclusivity instead.

## Protected stable chains

Do not casually change these without a staged plan:

- `/write` update package workflow
- coffee-corner bubble publishing
- 19.8 tattoo hotspot behavior
- window weather display
- local upload / setup panel access

## Setup panel rule

Default hidden does not mean permanently disabled.

The setup panel may be hidden by default, but the manual entry path must remain available. Local upload and local override behavior must not be sealed off by a visual patch.

## Visual patch rule

A visual patch must not block interaction.

Do not cover a layout issue with a color band or invisible layer if it interferes with panels, buttons, or touch areas.

## Coordinate rule

Hotspots and overlays should be locked to base-image coordinates, not to device-specific offsets.

Do not solve Safari/PWA differences by nudging one device separately. The future direction is:

```text
base image coordinates
-> object-fit cover crop math
-> screen coordinates
```

## PWA rule

PWA cold-start issues are a separate testing track.

Do not mix PWA cold-start debugging with hotspot, coordinate, or panel changes. Record network/VPN state before judging whether code is broken.

## Patch rule

Temporary patches must be documented.

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
