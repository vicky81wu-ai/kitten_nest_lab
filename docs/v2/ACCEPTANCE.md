# Kitten Nest v2 Independent Preview Acceptance

Status: iPhone vertical slice passed; post-fix regression pass pending

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

## iPhone checkpoint

Passed on the protected branch preview:

```text
home day image and cover layout
home clock hands and sparkles
hubby-note hotspot and single panel lifecycle
home -> coffeeCorner scene navigation
coffeeCorner text bubble hide / next-line cycle
memories and game panels using the shared PanelController
coffeeCorner -> lapClose push
lapClose image, bubble, and parent-object visual isolation
```

Observed for the post-fix regression pass:

```text
room images painted progressively before final load readiness
coffeeCorner bubble briefly reused its prior layout position after a text-height change
preview fallback lifecycle refresh briefly surfaced a stale diagnostic status
```

The framework fixes for these observations are implemented in the isolated branch. The lap bubble hide/next cycle and the full `lapClose -> coffeeCorner -> home` back chain remain in the final short device pass.

## Failure rule

If the preview fails, fix or roll back the isolated branch. Do not add guards to `/cloud`, write live state, or promote partial behavior.
