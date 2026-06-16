# Current Text Targets Truth Card

Updated: 2026-06-16

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
- The official `/write` console now uses `[coffeeCornerBubble]` and `[coffeeCornerLapCloseBubble]` in its visible package examples and parsing path.
- Older docs may still contain historical tag names. This card overrides them until the full documentation cleanup is completed.
