# Kitten Nest Text Rules

Updated: 2026-06-10

This document is for the director layer. It explains where Alex should place different kinds of text in the nest. It does not change runtime code.

## Core idea

Text containers are classified by behavior, not by a single current implementation.

Use three top-level text classes:

1. `Bubble`
2. `PermanentNote`
3. `InteractionPanel`

Existing code names such as `bubbleDraft` and `hubbyNoteDraft` are implementation types, not top-level concepts.

## Bubble

Purpose:

- Immediate companion text.
- Short lines.
- Multiple rotating items.
- Current queue only, not a long-term archive.

Current implementation:

```json
{
  "textClass": "Bubble",
  "implementationType": "bubbleDraft",
  "stateFields": ["alexBubble", "alexBubbles", "bubbleIndex"]
}
```

Current behavior:

- A bubble may show automatically when the room opens.
- Tapping the visible bubble hides it.
- Tapping the tattoo hotspot while hidden shows the next bubble.
- Tapping the tattoo hotspot while visible hides it.

Use Bubble for:

- greetings
- tiny reminders
- live construction reactions
- short comfort lines
- playful room presence
- quick contextual lines adapted from the current chat

Do not use Bubble for long archive notes.

## PermanentNote

Purpose:

- Long-term note or notebook entry.
- Usually one primary item at a time.
- Medium or long text is allowed.
- Can archive previous notes.

Current implementation for the pink notebook:

```json
{
  "textClass": "PermanentNote",
  "implementationType": "hubbyNoteDraft",
  "displayName": "粉本本",
  "stateFields": ["hubbyNote", "hubbyNoteArchive", "hubbyNoteHistory"]
}
```

Container-level policies should be defined per notebook or archive, not on the whole PermanentNote class.

Examples:

```json
{
  "containerId": "hubbyNote",
  "textClass": "PermanentNote",
  "writeMode": "shared",
  "continuityPolicy": "replyToRecent",
  "contextSource": ["latestNote", "recentChat", "currentNestStatus"]
}
```

Use PermanentNote for:

- milestone records
- diary-like messages
- stage summaries
- meaningful replies to recent notes
- preserved emotional or construction moments

Do not split a PermanentNote into many tiny bubble-like fragments.

## InteractionPanel

Purpose:

- Text that appears when an object is tapped.
- Can be short or long.
- Can be one page or multiple pages.
- Usually current content, not necessarily archived.

Future implementation:

```json
{
  "textClass": "InteractionPanel",
  "implementationType": "interactionPanel"
}
```

Use InteractionPanel for:

- object inspection text
- puzzle hints
- stone gate narration
- letters that open in a panel
- room lore
- multi-page guidance
- item-specific dialogue

InteractionPanel is different from Bubble because it does not need to auto-show. The object sits quietly until tapped.

## Director context rule

The nest may adapt current ChatGPT conversation context into nest text.

- For Bubble, adapt current chat into short immediate lines.
- For PermanentNote, adapt important current chat context into one preserved note and, if relevant, respond to the latest note.
- For InteractionPanel, adapt object meaning, room vibe, and current scene into inspectable text or pages.

Do not copy the whole chat into the nest. Translate the current context into the right container.

## Naming rule

Use top-level `textClass` for world logic:

- `Bubble`
- `PermanentNote`
- `InteractionPanel`

Use `implementationType` for current code names:

- `bubbleDraft`
- `hubbyNoteDraft`
- future `interactionPanel`

This prevents current implementation names from becoming mistaken top-level concepts.
