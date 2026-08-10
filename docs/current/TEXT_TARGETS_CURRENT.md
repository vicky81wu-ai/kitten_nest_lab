# Current Text Targets Truth Card

Updated: 2026-08-10

Status: current source-of-truth card for `/write` package tags and text target naming.

## Canonical rule

All writable text package tags must include:

```text
roomOrScene + textType
```

Do not use visual scene names alone as text targets.

## Current canonical package tags

```text
[coffeeCornerBubble]
```

Writes the normal coffee corner bubble queue.

```text
[coffeeCornerLapCloseBubble]
```

Writes the sitting-on-lap close-up bubble queue.

```text
[coffeeCornerBeachHandholdSunsetBubble]
```

Writes the first beach scene Alex bubble queue.

```text
[coffeeCornerBeachHandholdSunsetVickyBubble]
```

Writes the first beach scene Vicky bubble queue.

```text
[coffeeCornerBeachBraceletPromiseBubble]
```

Writes the second beach scene Alex bubble queue.

```text
[coffeeCornerBeachBraceletPromiseVickyBubble]
```

Writes the second beach scene Vicky bubble queue.

```text
[coffeeCornerBeachStallOrderBubble]
```

Writes the third beach scene Alex bubble queue.

```text
[coffeeCornerBeachStallOrderVickyBubble]
```

Writes the third beach scene Vicky bubble queue.

```text
[windowWeather]
```

Writes the window weather text.

```text
[hubbyNote]
```

Writes the powder notebook permanent note.

## Deprecated / forbidden short tags

```text
[coffeeCorner]
```

Deprecated because `coffeeCorner` is a scene, not a text type. Use `[coffeeCornerBubble]`.

```text
[coffeeCornerLapClose]
```

Deprecated because `coffeeCornerLapClose` is a scene variant, not a text type. Use `[coffeeCornerLapCloseBubble]`.

```text
[lapClose]
[lapCloseBubble]
[lapBubble]
```

Forbidden because short lap names are ambiguous. Future scenes may have their own lap-close variants.

## Runtime state fields currently used

Coffee corner bubble target:

```text
alexBubble
alexBubbles
bubbleIndex
```

Coffee corner lap-close bubble target:

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
```

Each beach target repeats the same explicit four-field shape using its full target id:

```text
<targetId>
<targetId with Bubble -> Bubbles>
<targetId>Index
<targetId>UpdatedAt
```

Weather target:

```text
windowTemp
windowDesc
```

Hubby note target:

```text
hubbyNote
hubbyNoteArchive
hubbyNoteHistory
```

## Deployment notes

- The safety test page `/write-text-targets-test.html` verified that `[coffeeCornerLapCloseBubble]` writes into `coffeeCornerLapCloseBubbles` and is visible in the PWA / screen nest.
- The official `/write` console now exposes the coffeeCorner, lapClose, and six beach speaker targets in its visible package examples, drafts, bulk publish path, and emergency direct-write selector.
- Each beach scene has separate Alex and Vicky targets, so either voice can be updated without touching the other.
- Older docs may still contain historical tag names. This card overrides them until the full documentation cleanup is completed.
