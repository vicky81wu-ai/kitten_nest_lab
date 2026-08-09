# Kitten Nest v2 Independent Preview Acceptance

Status: framework regression and automated mobile-browser route passed; no device action is required during continued branch construction

## Visual route

```text
/v2/index.html
```

## Restoration acceptance loop

1. Home opens normally; open the powder notebook. On a live-state run, write and save one disposable page, read it back from the first archive tab, favorite/unfavorite it, then delete it and confirm the UI says it moved to the recycle bin. On a degraded preview-copy run, confirm the notebook is explicitly read-only.
2. Tap the moon lamp twice and confirm day → night → day uses two real images.
3. Confirm the window shows temperature/description; tap it and close the compact floating “窗边叮嘱” card. It must not expand into the generic full-width bottom sheet.
4. Enter coffeeCorner and confirm the main bubble has rounded corners with no triangle tail.
5. Tap the photo wall. If this origin already has old photo slots, move through filled and empty slots; otherwise confirm the memory-card fallback appears without a permission prompt.
6. Tap the game console, open Gomoku, make one move, undo the round, change difficulty, and return to the same game menu.
7. Tap the top-row beach photo to enter the first seaside panorama.
8. Drag the panorama horizontally; the invisible lower-corner navigation hit zones must stay put while the scene moves.
9. In each beach scene, tap Alex and Vicky to show/hide/advance their separate dialogue.
10. Advance handhold → bracelet → stall, then walk the left/back path to coffeeCorner.
11. Confirm the previously accepted 19.8, panels, lapClose, and home back path still work.
12. Confirm there are no visible navigation arrows, center `V2` button, or engineering-source line; `PREVIEW COPY` appears only on a degraded-state run.
13. Long-press the transparent upper-left zone for 1.8 seconds and confirm iOS shows no blue selection overlay. Verify the `房间 / 照片墙 / 其他` tabs, the three named room slots, and the six named photo slots. Save one disposable photo, reopen the photo wall to confirm it appears, then clear it. If testing a room override, clear it afterward and confirm the published default returns.

## Automated mobile-browser checkpoint

Passed at a 393 × 852 touch viewport using the exact existing public image bytes in a read-only local cache:

```text
home night -> day -> night
powder notebook write -> save -> archive readback
favorite -> unfavorite -> soft delete -> trash
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
four notebook POSTs, each carrying only registered notebook fields and a QA-only token
iPhone home-screen capability, safe-area viewport, status-bar, and app-title metadata
manifest rejection for missing hotspot coordinates, dangling scene targets, and unsupported effects
```

The post-iPhone correction suite separately verifies the compact weather-card contract, drift-tolerant invisible lower-corner navigation, iOS-selection-safe upper-left long-press dispatch, exact three-room/six-photo device-local image writes/clears, and full-size optimized static beach delivery with canonical public Storage fallback. These corrections still require the concise device recheck below before promotion.

This pass caught and fixed panorama dialogue clipping. Newly revealed bubbles now wait for their measured layout and adjust only the horizontal scene viewport before the browser paints them. Cover rooms and manifest coordinates are unchanged.

The memories checkpoint seeded two photos into a disposable browser profile, verified a filled slot → empty slot → filled slot sequence, then closed the panel and completed every later route. The application itself performed only IndexedDB enumeration and a `readonly` transaction.

The notebook checkpoint used an in-memory fake state endpoint and disposable QA token. It did not call Supabase or the deployed `/api/set-state`, and it confirmed that delete removed the test page from the archive while preserving it in `hubbyNoteTrash`.

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
