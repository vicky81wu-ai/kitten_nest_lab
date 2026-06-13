# Hubby Note Panel Archive-First Rule - 2026-06-13

## Decision

The powder notebook panel should be archive-first.

It should not show a separate current-page preview block above the editor.

The previous structure was:

```text
current page preview
current page edit / favorite / delete
editor
key chip
save button
archive list
```

The new structure is:

```text
editor
small paw key button
save button
archive list
```

## User-facing logic

```text
Type a note.
Tap save.
The note immediately becomes the latest permanent archive item.
```

There should be no one-save delay.
There should be no duplicate recent-current block.
There should be no repeated current-page edit/favorite/delete controls above the archive.

Archive items themselves may still support:

```text
load into editor
favorite
delete
```

## Key control

The Nest key control should not occupy the central flow when a key is already stored locally.

Current rule:

```text
If a token exists, show only a small paw button in the upper-right area.
Tap the paw button to reveal the key input for replacement.
If no token exists, show the key input normally so saving remains possible.
```

## Future notebook-art compatibility

This is a data and panel-flow rule, not a skin rule.

If the notebook page later becomes a fully drawn image/UI, keep the same logic:

```text
input surface -> save -> archive item
```

Do not reintroduce a separate current-page preview unless it has a new, explicit purpose.
