# Kitten Nest v2 Independent Preview Acceptance

Status: pre-promotion device acceptance and production `/cloud` smoke check passed

## Production route

```text
https://kitten-nest-lab.vercel.app/cloud
```

The direct `/v2/index.html` route remains available during the rollback window.

## Post-promotion iPhone PWA gate

For manifest `0.5.0`, close the installed app completely before the first check so browser cache cannot hide the cold path and so session-only bubble progress starts fresh:

1. Open the home-screen nest once. The small `猫窝醒来中…` status may appear briefly, but the room must replace it without a 20–30 second unexplained maroon screen.
2. Confirm the room image reaches the physical bottom of the iPhone canvas. The white Home Indicator may remain system-owned, but there must be no black strip behind or above it.
3. Enter coffeeCorner and tap the beach hotspot once. The first panorama must open on that first attempt without an asset-timeout card or an app restart.

These three checks are the only outstanding production gate for the hardening patch. They do not require a state write, upload, notebook mutation, or Storage change.

## Restoration acceptance loop

1. Home opens normally; open the powder notebook. On a live-state run, write and save one disposable page, read it back from the first archive tab, favorite/unfavorite it, then delete it and confirm the UI says it moved to the recycle bin. On a degraded preview-copy run, confirm the notebook is explicitly read-only.
2. Tap the moon lamp twice and confirm day → night → day uses two real images with a smooth crossfade. Only the images fade; weather, effects, hotspots, and panels neither disappear nor shift, and no blank/error frame appears.
3. Confirm the window shows a subtly translucent temperature/description pair with a gentle vertical float. Confirm the pebble jar emits its own upward gold/pink/purple light points independently of the room-wide twinkles. Tap the weather and close the compact floating “窗边叮嘱” card; it must not expand into the generic full-width bottom sheet.
4. Enter coffeeCorner and confirm the main bubble has rounded corners with no triangle tail. Close/advance it several lines, enter lapClose, return, and confirm it resumes the exact visible or closed state. Fully close and reopen the PWA and confirm that progress resets. CoffeeCorner and lapClose remain explicit greeters; ordinary non-dialogue bubbles start closed.
5. Tap the photo wall. If this origin already has old photo slots, move through filled and empty slots; otherwise confirm the memory-card fallback appears without a permission prompt.
6. Tap the game console, open Gomoku, make one move, undo the round, change difficulty, and return to the same game menu.
7. Tap the top-row beach photo to enter the first seaside panorama.
8. Drag the panorama horizontally; the invisible Back/Push zones must move with the base image and remain at their authored image coordinates.
9. In each beach scene, manually place the panorama, record that horizontal position, then tap either speaker or its talk hotspot. The shared dialogue must follow its authored order rather than whichever portrait was tapped. First reveal, two consecutive turns from one speaker, a speaker switch, and a taller line must all leave the recorded horizontal position unchanged. An immediate accidental double tap must not skip a line. The action after the final line closes both bubbles, and the following action restarts turn one.
   - Handhold Alex copy keeps its lower edge at image Y `.248` and grows upward without covering his face.
   - Bracelet Alex copy keeps its upper edge at image Y `.396`; stall Alex copy keeps its upper edge at image Y `.33`. Both grow downward.
   - Generic dialogue copy is `15px`, normal weight, matching the size (not the bold weight) of the compact “窗边叮嘱” title.
10. Advance handhold → bracelet → stall, then walk the left/back path to coffeeCorner.
11. Confirm the previously accepted 19.8, panels, lapClose, and home back path still work.
12. Confirm there are no visible navigation arrows, center `V2` button, or engineering-source line; `PREVIEW COPY` appears only on a degraded-state run.
13. Long-press the transparent upper-left zone for 1.8 seconds and confirm iOS shows no blue selection overlay. Verify the `房间 / 照片墙 / 其他` tabs, the three named room slots, and the six named photo slots. Save one disposable photo, reopen the photo wall to confirm it appears, then clear it. If testing a room override, clear it afterward and confirm the published default returns.
14. Publish one disposable powder-notebook page through `/write` and one through MCP. Vicky's known pages must use the shared deep-pink ink; Alex's known pages must use near-black. Existing archive pages without author metadata must keep the legacy ink. Delete only the disposable pages afterward.

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
horizontal pan and image-locked transparent navigation
Alex/Vicky dialogue reveal with full viewport visibility
first dialogue reveal, speaker switching, and long copy preserve the existing manual panorama position
handhold -> bracelet -> stall
stall -> bracelet -> handhold -> coffeeCorner
coffeeCorner -> lapClose hide/show-next -> coffeeCorner -> home
zero page errors, console errors, or failed requests
no runtime inspector, status ticker, or hotspot debug switch in the product DOM
four notebook POSTs, each carrying only seven registered notebook fields and a QA-only token
iPhone home-screen capability, safe-area viewport, status-bar, and app-title metadata
manifest rejection for missing hotspot coordinates, dangling scene targets, and unsupported effects
```

The post-iPhone correction suite separately verifies the compact weather-card contract, drift-tolerant invisible lower-corner navigation, iOS-selection-safe upper-left long-press dispatch, exact three-room/six-photo device-local image writes/clears, and full-size optimized static beach delivery with canonical public Storage fallback. The concise device recheck passed on 2026-08-09.

The original pass caught panorama dialogue clipping. Manifest `0.5.0` keeps measured safe-edge reveal only for ungrouped ports; grouped dialogue never changes camera position at all. It retains explicit top/bottom growth edges for copy near protected faces and one shared ordered timeline per scene. Cover rooms, route hotspots, existing six compatibility target ids, and coordinates are unchanged.

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

The framework fixes for these observations passed on iPhone. The final real-device sweep is recorded below.

Final promotion sweep passed on 2026-08-09:

```text
compact home weather card
upper-left device-local setup gesture and labeled room/photo slots
transparent Home-right dock on the first intended tap
coffeeCorner, lapClose, and complete return route
all three beach panoramas and their transparent image-locked back/forward hotspots
optimized beach delivery without an asset timeout
```

Remaining sparkle/light-point tuning is non-blocking visual polish and is not part of the production route-switch commit.

## Production smoke result · 2026-08-09

After merge commit `b6dbf054746e70e87551d39f51c31cf829c46771` reached Vercel `success`, the official production origin returned:

```text
/cloud: HTTP 200, Kitten Nest production document
/v2/data/nest-manifest.v2.json: status=production, promoted=true, route=/cloud
/api/state: HTTP 200 application/json
beach-handhold-sunset.webp: HTTP 200 image/webp
beach-bracelet-promise.webp: HTTP 200 image/webp
beach-stall-order.webp: HTTP 200 image/webp
```

This was a read-only smoke check. It did not publish a text target, mutate `nest_state`, write browser-local media, or change any Supabase object.

## Failure rule

If the production smoke check fails, revert only the isolated promotion commit and redeploy the known-good `/cloud` owner. Do not write live state or add a second runtime as a patch.
