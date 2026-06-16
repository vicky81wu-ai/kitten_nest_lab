# Kitten Nest Construction Discipline

## New system, old source retirement

When a new system is promoted, the replaced old source must be retired in the same closeout unless it is explicitly registered as debt.

Required closeout checklist:

```text
1. Remove old DOM source if the new DOM/source is promoted.
2. Remove old CSS coordinates if the new positioner/overlay card is promoted.
3. Remove old default text if the field is now writable/state-driven.
4. Remove old test script loading after the test is promoted or failed.
5. Remove old manifest/test names after the promoted manifest is live.
6. Keep aliases only when they are deliberate compatibility tags; aliases must not contain active duplicate logic.
```

If an old path cannot be removed immediately, it must be documented as debt with:

```text
owner object
reason it cannot be removed
risk
removal trigger
```

## Writable text fields

Writable/state-driven text fields must behave like speech bubbles:

```text
write exactly what state says
blank means blank/loading
no old placeholder may pretend to be real content
```

This applies to:

```text
coffeeCorner.bubble
coffeeCorner.lapCloseBubble.cleanRouter
home.windowWeatherDisplay
home.hubbyNotePanel
future writable text panels / notes / captions
```

Rules:

```text
1. Do not leave old default copy in HTML once the field is state-driven.
2. Do not let button handlers write old fallback text into state-driven fields.
3. Do not mask old text with hide/show as a final fix.
4. Safety tests may temporarily gate display, but promotion must clean the old source.
```

## Coordinate ownership

Coordinate ownership belongs to one source only.

```text
overlayCards / hotspotCards / manifest-owned positioner = coordinate source
CSS = appearance / animation / visual effects only
```

CSS may define:

```text
opacity
animation
filter
box-shadow
transform effects after placement
```

CSS must not preserve replaced coordinates such as:

```text
left/top/right/bottom/width/height used as old placement source
```

unless that CSS rule is the declared source of truth for that object.

## Safety test rule

Default rule:

```text
new system promoted -> old source removed
```

Use safety testing only when:

```text
1. dependency is unclear
2. old code is cross-scene/cross-controller
3. router/state/write/manifest/main entry may be affected
4. old code still acts as a temporary guard
```

After a safety test passes:

```text
promote the clean source
remove the safety line or mark it as debt
```

Never leave a permanent stack of:

```text
old source + new source + guard + suppressor
```

That is considered incomplete construction.
