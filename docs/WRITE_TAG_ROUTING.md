# Write Tag Routing Rules

Status: active rule
Scope: `/write`, future writable scene objects, and any assistant-generated nest message intended for cloud write-in.

## Core rule

```text
No tag, no write.
One tag, one destination.
Every writable place must have a registered tag before it is connected to /write.
```

This prevents messages from leaking into the wrong panel, bubble, notebook, room, or future scene group.

## Tag naming rule

```text
New complex tags must include scene path and surface type.
For nested scenes, include parent scene + child scene + surface type.
Do not use a generic state name alone.
```

Example:

```text
Good: [coffeeCornerLapCloseBubble]
Alias: [coffeeCornerLapClose]
Bad:  [lapCloseBubble]
Bad:  [lapClose]
```

## Current active tags

### `[coffeeCorner]`

Destination:

```text
coffeeCorner.bubble
```

Use for:

```text
Coffee-corner rotating short bubble lines.
```

Rules:

```text
Short lines only.
Belongs to coffeeCorner normal scene.
Must not affect coffeeCornerLapCloseBubble.
Must not affect home notebook.
```

### `[hubbyNote]`

Destination:

```text
home.hubbyNotePanel
```

Use for:

```text
Home powder notebook / nest message / longer daily note.
```

Rules:

```text
Use this when another chat window writes a nest message for the home notebook.
This is the default tag for 猫窝留言 unless the user clearly asks for another writable surface.
Must not be sent to coffeeCorner bubble.
```

### `[windowWeather]`

Destination:

```text
home.windowWeatherDisplay
home.windowWeatherAdvicePanel
```

Use for:

```text
Home window weather text and window-side advice.
```

Rules:

```text
Belongs to home.
Do not name or route it under coffeeCorner.
Do not use this tag for general notebook messages.
```

## Reserved / next tags

These are not all active write routes yet. They are reserved so future work has a clean naming lane.

### `[coffeeCornerLapCloseBubble]`

Destination:

```text
coffeeCorner.lapCloseBubble.cleanRouter
```

Use for:

```text
Coffee-corner lap-close child-scene bubble text.
```

Rules:

```text
Belongs to lapClose under coffeeCorner.
Must not share queue with [coffeeCorner].
Must hide outside lapClose.
Must be registered in scene manifest before cloud write is connected.
This is the preferred canonical future tag.
```

Backward-compatible alias:

```text
[coffeeCornerLapClose]
```

Deprecated generic tag:

```text
[lapCloseBubble]
```

### `[moodNote]`

Destination:

```text
home.moodNote
```

Use for:

```text
Short mood note, if moodNote is re-exposed in the UI.
```

Rules:

```text
Do not use unless the current UI has an active moodNote target.
```

### Seaside story conversations

Canonical ordered-dialogue tags:

```text
[seasideWalkHandholdSunsetMainDialogue]
[seasideWalkBraceletPromiseMainDialogue]
[seasideWalkStallOrderMainDialogue]
```

These three tags write one complete `conversation` script per named story beat. The body must use explicit speaker markers:

```text
@alex
First authored turn.

@alex
Alex may speak again without forcing a Vicky turn.

@vicky
Then Vicky replies.
```

Do not infer dialogue order from the scene parent chain or from numbers in an id. `stories.seasideWalk.beats` owns scene order and the array produced by the script owns turn order. The six `coffeeCornerBeach...Bubble` tags remain valid `ambient`/compatibility queues; use them only when independent per-speaker rotation is intended. Publishing one canonical MainDialogue makes it authoritative for that group while leaving the legacy queues untouched.

## Automatic workflow rule

Whenever a new writable object is created, do this in order:

```text
1. Create object information card.
2. Assign ownerScene.
3. Assign one unique write tag.
4. Add the tag to this file.
5. Add the object to scene manifest / registry.
6. Only then connect it to /write.
7. Test that a tagged message goes only to its own destination.
```

## Assistant behavior rule

When the assistant writes text intended for the nest, it must include the tag explicitly.

Default routing:

```text
猫窝留言 / home notebook / longer note -> [hubbyNote]
coffee-corner short bubble -> [coffeeCorner]
home weather/window advice -> [windowWeather]
coffee-corner lap-close bubble -> [coffeeCornerLapCloseBubble]
seaside ordered conversation -> one exact [seasideWalk...MainDialogue] tag
```

If live `/write` does not yet support the canonical long tag, use the registered alias `[coffeeCornerLapClose]` until the parser change is tested and promoted.

If the requested destination is ambiguous, do not invent a new route. Use `[hubbyNote]` for general nest messages, or ask which writable place should receive it.

## Anti-patterns

```text
Do not write untagged messages into /write.
Do not reuse [coffeeCorner] for lapClose.
Do not route home weather under coffeeCorner.
Do not add a writable panel without a tag.
Do not make one tag update multiple unrelated destinations.
Do not use [lapCloseBubble] as a canonical tag because it lacks parent scene.
```
