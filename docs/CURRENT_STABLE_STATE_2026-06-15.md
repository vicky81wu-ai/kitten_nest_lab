# Current Stable State — 2026-06-15

Status: verified

## Official stable entries

```text
/cloud
/write
```

Useful cache-bump links:

```text
https://kitten-nest-lab.vercel.app/cloud?v=20260615-coffee-corner-lap-bubble-promoted-1
https://kitten-nest-lab.vercel.app/write?v=20260615-coffee-corner-lap-bubble-promoted-1
```

## Stable architecture

```text
sceneId: home
objectPrefix: home.*
cleanRouter: promoted
sceneManifestIsolation: promoted
coffeeCornerLapCloseBubble: promoted
```

## Scene flow

```text
home <-> coffeeCorner
coffeeCorner -> push lapClose
lapClose -> back coffeeCorner
```

## Write tags

Use these canonical tags:

```text
[hubbyNote]
[coffeeCorner]
[windowWeather]
[coffeeCornerLapCloseBubble]
```

Alias kept:

```text
[coffeeCornerLapClose]
```

Do not use:

```text
[lapCloseBubble]
[lapClose]
```

## Write-all preset

When asked to write all nest text places, include:

```text
[hubbyNote]
[coffeeCorner]
[windowWeather]
[coffeeCornerLapCloseBubble]
```

## Lap-close bubble queue

`/write` package:

```text
[coffeeCornerLapCloseBubble]
Line 1
Line 2
Line 3
```

State fields:

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
coffeeCornerLapCloseBubbleUpdatedAt
```

## Important debt

Cold-start overlay position drift belongs to:

```text
scene overlay lifecycle / placement readiness
```

Do not patch individual overlays one by one. See:

```text
docs/OVERLAY_LIFECYCLE_RULES.md
```

## Do not break

```text
Do not reintroduce originalHome as a technical scene id.
Do not route lapClose text through [coffeeCorner].
Do not add a writable text surface without data/write-tag-registry.v1.json.
Do not hardcode scene isolation selector blacklists when manifest ownership can solve it.
```
