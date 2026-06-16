# Source of Truth Gate Rules

Status: architecture rule
Created: 2026-06-16

## Problem class

The nest has had repeated symptoms where an old fallback value or old CSS position appears briefly before the real runtime source takes over.

Examples:

```text
coffeeCorner bubble flashes at old CSS position before coffeeCorner.bubbleOverlay applies
home weather displays old temperature/description before cloud state arrives
clock hands appear at old/default position before overlay/guard stabilizes
```

These are not separate one-off bugs.

They are all:

```text
old fallback source visible before official source of truth is applied
```

## Core rule

If an object has a declared runtime source of truth, old fallback/default DOM or CSS must not be visible before that source has applied.

```text
No source ready => no display.
Source applied => display normally.
```

## Source examples

```text
coffeeCorner.bubbleOverlay
  source: hotspot-positioner overlayCards
  target: #bubble

home.windowWeatherDisplay
  source: cloud state fields windowTemp/windowDesc
  target: #temp / #desc

home.clockHandsOverlay
  source: overlay positioner / clock hands runtime
  target: #home .clock, #hourHand, #minuteHand, #secondHand
```

## Anti-patterns

```text
Do not leave old CSS coordinates visible while waiting for positioner.
Do not leave old hardcoded weather text visible while waiting for cloud state.
Do not rely on a per-object guard forever if the object belongs in a registry/lifecycle system.
Do not promote a test line while its file names, manifest status, or runtimeMode still say test.
```

## Required future mechanism

A central source-of-truth gate should know, from registry/manifest/object cards:

```text
object id
selector(s)
owner scene
source type: state / positioner / controller / generated runtime
ready marker: data-positioner-applied, data-state-applied, data-runtime-applied, etc.
```

Before the ready marker exists, the object is hidden or neutralized.
After the ready marker exists, it displays normally.

## Current rollout rule

Use safety tests before promotion.

Do not fix future instances as isolated patches. Add the object to this source-of-truth gate class.
