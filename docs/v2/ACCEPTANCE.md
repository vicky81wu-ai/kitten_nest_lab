# Kitten Nest v2 Independent Preview Acceptance

Status: framework regression passed; restoration batch pending one consolidated device pass

## Visual route

```text
/v2/index.html
```

## Restoration acceptance loop

1. Home opens normally; tap the moon lamp twice and confirm day → night → day uses two real images.
2. Confirm the window shows temperature/description; tap it and close the single shared “窗边叮嘱” panel.
3. Enter coffeeCorner and confirm the main bubble has rounded corners with no triangle tail.
4. Tap the top-row beach photo to enter the first seaside panorama.
5. Drag the panorama horizontally; fixed v2 controls must stay put while the scene moves.
6. In each beach scene, tap Alex and Vicky to show/hide/advance their separate dialogue.
7. Advance handhold → bracelet → stall, then walk the left/back path to coffeeCorner.
8. Confirm the previously accepted notebook, 19.8, panels, lapClose, and home back path still work.

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

The framework fixes for these observations passed on iPhone. The next device pass is only for the restored moon/weather/beach batch and one regression sweep of the accepted chain.

## Failure rule

If the preview fails, fix or roll back the isolated branch. Do not add guards to `/cloud`, write live state, or promote partial behavior.
