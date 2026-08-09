# Kitten Nest v2 Independent Preview Acceptance

Status: framework regression and automated mobile-browser route passed; no device action is required during continued branch construction

## Visual route

```text
/v2/index.html
```

## Restoration acceptance loop

1. Home opens normally; tap the moon lamp twice and confirm day → night → day uses two real images.
2. Confirm the window shows temperature/description; tap it and close the single shared “窗边叮嘱” panel.
3. Enter coffeeCorner and confirm the main bubble has rounded corners with no triangle tail.
4. Tap the photo wall. If this origin already has old photo slots, move through filled and empty slots; otherwise confirm the memory-card fallback appears without a permission prompt.
5. Tap the game console, open Gomoku, make one move, undo the round, change difficulty, and return to the same game menu.
6. Tap the top-row beach photo to enter the first seaside panorama.
7. Drag the panorama horizontally; fixed v2 controls must stay put while the scene moves.
8. In each beach scene, tap Alex and Vicky to show/hide/advance their separate dialogue.
9. Advance handhold → bracelet → stall, then walk the left/back path to coffeeCorner.
10. Confirm the previously accepted notebook, 19.8, panels, lapClose, and home back path still work.
11. Confirm there is no center `V2` button or engineering-source line; `PREVIEW COPY` appears only on a degraded-state run.

## Automated mobile-browser checkpoint

Passed at a 393 × 852 touch viewport using the exact existing public image bytes in a read-only local cache:

```text
home night -> day -> night
weather text -> shared advice panel -> close
home -> coffeeCorner -> six-slot readonly memories carousel -> close
game menu -> Gomoku
225-cell board -> kitten move -> Alex reply -> whole-round undo
Normal -> Soft reset -> same-panel back -> close
coffeeCorner -> first beach panorama
horizontal pan and fixed controls
Alex/Vicky dialogue reveal with full viewport visibility
handhold -> bracelet -> stall
stall -> bracelet -> handhold -> coffeeCorner
coffeeCorner -> lapClose hide/show-next -> coffeeCorner -> home
zero page errors, console errors, or failed requests
no runtime inspector, status ticker, or hotspot debug switch in the product DOM
```

This pass caught and fixed panorama dialogue clipping. Newly revealed bubbles now wait for their measured layout and adjust only the horizontal scene viewport before the browser paints them. Cover rooms and manifest coordinates are unchanged.

The memories checkpoint seeded two photos into a disposable browser profile, verified a filled slot → empty slot → filled slot sequence, then closed the panel and completed every later route. The application itself performed only IndexedDB enumeration and a `readonly` transaction.

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

The framework fixes for these observations passed on iPhone. Continued restoration uses the automated mobile route; a concise real-device sweep can wait until the branch is otherwise ready for promotion planning.

## Failure rule

If the preview fails, fix or roll back the isolated branch. Do not add guards to `/cloud`, write live state, or promote partial behavior.
