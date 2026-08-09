# Kitten Nest v2 Independent Preview Acceptance

Status: waiting for deployed preview

## Visual route

```text
/v2/index.html
```

## Short acceptance loop

1. Home opens with the correct day/night image and no overlay jump.
2. Tap the pink notebook; one panel opens and closes cleanly.
3. Tap the right dock to enter coffeeCorner.
4. Tap 19.8: visible bubble hides. Tap 19.8 again: the next line appears.
5. Tap the photo wall and game console; both use the same panel behavior and do not steal each other.
6. Tap Alex's lap to push `lapClose`.
7. Confirm no coffeeCorner photo wall, console, 19.8, or steam remains interactive in `lapClose`.
8. Tap the lap bubble to hide it, then the registered lap trigger to show the next line.
9. Tap the left dock; it returns to coffeeCorner, then left dock returns home.

## Failure rule

If the preview fails, fix or roll back the isolated branch. Do not add guards to `/cloud`, write live state, or promote partial behavior.
