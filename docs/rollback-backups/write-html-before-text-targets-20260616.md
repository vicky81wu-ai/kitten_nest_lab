# Rollback backup - write.html before textTargets test

Date: 2026-06-16

Scope: `/write` console before the textTargets registry safety test.

Current production file:

```text
write.html
```

Current blob sha at backup time:

```text
41ed583bc05ce5d14c80ec89c3f8dfa1b2e25d46
```

Important: the safety-test stage does **not** replace `write.html`. It creates a separate test page first, so rollback for production `/write` is simply: leave `write.html` unchanged, or restore the blob above if a later merge modifies it.

Protected state fields that must not be casually changed while testing parser logic:

```text
alexBubble / alexBubbles / bubbleIndex
coffeeCornerLapCloseBubble / coffeeCornerLapCloseBubbles / coffeeCornerLapCloseBubbleIndex
windowTemp / windowDesc
hubbyNote / hubbyNoteArchive / hubbyNoteHistory
pendingDrafts
```
