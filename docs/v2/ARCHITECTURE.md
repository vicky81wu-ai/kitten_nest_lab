# Kitten Nest v2 Architecture

Status: production architecture
Route: `/cloud`
Compatibility route: `/v2/index.html`

## Single machine truth

The v2 runtime reads one canonical manifest:

```text
v2/data/nest-manifest.v2.json
```

It owns v2 scene identity, asset keys, object identity, selector ownership, actions, coordinates, text ports, panels, and effects. The legacy registries remain historical input for migration; v2 does not load them as competing runtime truth.

The existing text-target registry remains authoritative for writable `targetId` registration:

```text
data/text-targets.v1.json
```

The v2 manifest may describe read compatibility fields, but it cannot create a writable text target that is absent from that registry.

## Eight controller contracts

| Controller | Owns | Must not own |
|---|---|---|
| State | Read, cache, refresh, degraded-state labeling | DOM placement, navigation, writes |
| Asset | Resolve/toggle `assetKey`, decode, source fallback, cover/panorama presentation | Scene choice, hotspots |
| SceneRuntime | `go`, `push`, `back`, `jumpTo`, stack, atomic scene transition | Text queue logic, panel content |
| Layout | One base-image calculation and all cover/panorama projection | Click results, scene stack |
| Hotspot | One pointer delegation path and standard action dispatch | Private navigation or panel logic |
| TextPort | Queue, index, show, hide, next, canonical/fallback reads | State fetching, coordinate math |
| Panel | Open, close, nested panel stack, scoped content session, scene-exit cleanup | Hotspot placement, scene navigation, game rules |
| Effect | Global sparkles, jar sparkles, steam, clock hands, pause/destroy | Click binding, scene mutation |

Every controller exposes the same lifecycle:

```text
mount -> ready -> reconcile -> suspend -> destroy
```

## Standard actions

All pointer actions use the manifest action envelope:

```text
scene.go
scene.push
scene.back
scene.jumpTo
asset.toggle
text.toggleNext
text.hide
panel.open
panel.close
```

Hotspots never call controller internals directly. They dispatch an action envelope; the action dispatcher routes it to the one owning controller.

## Interactive panel content

Interactive content does not create another runtime owner. `gameMenu.panel` dispatches the same standard `panel.open` action to `gomoku.panel`; PanelController retains one layer and a small internal back stack. The Gomoku DOM session is created only while that panel is open and is destroyed on back, close, suspend, or scene exit.

The board rules, win detection, undo operation, candidate generation, and AI choice are pure functions in `runtime/core/gomoku.mjs`. They know nothing about DOM, controllers, state endpoints, or navigation. The panel session owns only ephemeral in-memory play state and cancels its pending AI timer on teardown. No game move reaches `/api/state` or any write endpoint.

## Device-local compatibility boundary

The memories panel reads the six blobs created by the old stable page in `kittenNestLabDB/images`. It first requires `indexedDB.databases()` to prove that the named database already exists. If enumeration is unsupported or the database is absent, the read path does not call `indexedDB.open()` as a side effect. If present, it opens the enumerated version and uses only `transaction(store, 'readonly')`; an unexpected upgrade event is aborted.

The original upper-left long-press gesture is restored as one transparent global Hotspot object. Its standard `panel.open` action opens a scoped `localMediaSetup` session inside the existing PanelController. That session may create the known database/store and write or clear exactly nine historical keys using `readwrite` transactions: room overrides `homeOn`, `homeOff`, and `gameRoom`, plus `photo0` through `photo5`. It rejects non-images, files above 15 MB, and every other key. The room tab identifies each override explicitly; clearing it restores the manifest chain of optimized same-origin delivery, published Supabase original, then repository-original fallback. The photo-wall tab remains device-local because no six independent published default objects exist. The session has no cloud upload, Supabase credential, or general IndexedDB access.

The 1.8 second selection/callout guard is scoped to the upper-left zone and lasts only for the armed press. Ordinary navigation is represented by scene-owned transparent Hotspot objects with `baseImageLocked` coordinates. They use pointer capture and a bounded drift tolerance, so releasing a normal tap just outside the image-locked zone still dispatches once without installing a second touch system.

There is intentionally no active stage-level navigation dock. A future rescue-navigation affordance may be viewport-fixed, but it must be a separately named emergency layer and must not replace or duplicate the scene-owned Go, Back, and Push hotspots.

The read carousel and local setup writer remain separate sessions. Blob object URLs belong to the memories session and are revoked at teardown. Reopening the photo wall performs a fresh readonly load, so a saved slot appears without a second runtime owner.

## Scoped notebook mutation boundary

`home.hubbyNotePanel` is bound to the registered `hubbyNote` target card, including its current, updated-at, author, favorite, archive, history, and trash fields. A pure resolver normalizes string or object archive entries, dates, known authors, and favorite flags; pure mutation builders produce save, favorite, and soft-delete patches. A scoped notebook session renders and edits those pages under the existing PanelController and preserves the selected page across state refreshes.

The session does not own a general write client. PanelController injects one client configured by `runtime.stateWrites`; the client rejects every patch key outside the seven fields derived from the notebook card. Successful responses are committed through StateController so the open panel and all other readers receive one `state:change` event. The notebook still has no generic action envelope or second controller.

Author attribution is channel-owned, not inferred from prose. Browser `/write` and the in-panel editor stamp `vicky`; MCP stamps `alex`; an archived current page carries its known author forward. Historical entries without an author remain visually legacy-colored instead of being guessed. Both dialogue bubbles and notebook pages read the same `--vicky-ink` / `--alex-ink` tokens.

The manifest write rule is an allowlist, not a boolean escape hatch:

```text
stateWritesAllowed.mode = registeredTargetOnly
stateWritesAllowed.targetIds = [hubbyNote]
writeMode = archiveWithSoftDelete
```

The validator rejects an unregistered target, multiple panel owners, mismatched field names, a different endpoint/header, or a delete mode without trash. When StateController is serving the degraded preview fixture, PanelController passes `canWrite:false`; the editor and mutation actions disappear rather than writing preview text into the real archive.

## Atomic scene transition

SceneRuntime performs one transaction:

```text
lock input
-> close current panel and suspend effects
-> Asset loads and decodes next scene image
-> commit scene id and stack
-> reconcile scene-owned objects
-> Layout projects all registered coordinates
-> unlock input
```

`lapClose` owns its bubble, bubble trigger, and image-locked Back hotspot. It does not inherit `coffeeCorner` hotspots, panels, effects, or text ports.

The three beach scenes use the same transaction and stack. Their wide base images live in the same retained scene world as portrait rooms; only the manifest presentation changes from `cover` to `panorama`. The viewport may scroll horizontally, and the scene-owned Back/Push hotspots move with that image world. Panels remain stage-level UI.

Panorama conversations are manifest-owned dialogue units, not camera units. A `dialogueGroups` entry declares one panorama owner, its TextPort members, ordered script target, and `camera.policy: manual`. Every member remains a `baseImageLocked` object at its own authored image coordinate; the group does not turn bubbles into viewport UI.

TextPort never schedules horizontal reveal correction for a grouped conversation. First reveal, consecutive same-speaker turns, speaker switches, text-height changes, Layout passes, and scene re-entry all leave `scrollLeft` untouched. The visitor's manual panorama position is authoritative from the moment the scene opens. Ungrouped panorama TextPorts retain the narrower compatibility behavior: only a newly revealed standalone bubble may be clamped inside a 16 px viewport edge.

`manual` is the active dialogue camera policy. The validator still understands legacy `groupLock` cards only so old fixtures fail predictably, but production groups do not use it. A future scene that intentionally follows widely separated speakers must introduce a separately specified policy and tests rather than weakening manual camera ownership.

Story order, navigation ownership, and dialogue turns are three independent contracts:

| Contract | Manifest owner | Meaning |
| --- | --- | --- |
| Scene hierarchy | `scenes.parent` plus `scene.push/back` | Where Back returns and which image world owns a hotspot |
| Story sequence | `stories.<id>.beats[]` | The authored order of named narrative scenes |
| Dialogue sequence | `dialogueGroups.<id>` plus its script target | The exact ordered speaker turns inside one scene |

The `seasideWalk` story therefore names `handholdSunset`, `braceletPromise`, and `stallOrder` as beats without encoding order into numeric ids. Its three main dialogue groups use `mode: conversation`. A conversation owns one shared turn index: any member hotspot or visible member bubble dispatches `dialogue.next` to the same group. Consecutive turns from one speaker update that speaker's existing bubble in place; a speaker change hides the prior member and reveals the mapped counterpart. A 200 ms group input lock prevents a double tap from skipping a turn. After the final turn, the next action closes the group; the following action restarts turn one.

`mode: ambient` remains the contract for independent per-target queues. Ambient copy does not share an index, does not acquire story order, and is appropriate for room remarks or genuinely unrelated hotspots. Navigation parentage alone never makes two bubbles a conversation.

Standalone/ambient bubble progress is session-only memory owned by TextPortController. It records content fingerprint, queue index, visible/closed state, and whether the current line has already been shown. Leaving and returning to a scene restores that exact state; a closed third line returns closed and the next tap opens line four. Changed published content resets safely to the manifest default. Destroying the runtime, including fully closing and reopening the installed PWA, clears the map. Ordinary standalone bubbles default closed; only an explicit `initiallyVisible:true` greeter opens on scene entry. There is no unread dot, badge, glow, or other fourth-wall hint.

TextPorts may use edge-growth anchors when copy length must never cover a protected subject. `bottomCenter` pins the authored lower edge and lets added lines grow upward; `topCenter` pins the authored upper edge and lets added lines grow downward. These remain normalized base-image coordinates and therefore travel with a panorama instead of becoming viewport overlays.

If the next scene asset fails, SceneRuntime does not commit the candidate navigation state. It reconciles the prior snapshot, restores Layout readiness for the prior owner set, emits `scene:didFail`, and leaves the scene stack unchanged.

The home moon toggle is not a scene transition. AssetController retains a second stage image, loads and decodes the requested day/night source above the current image, crossfades only that image layer, confirms the primary image is ready underneath, then retires the transition image. Hotspots, TextPorts, effects, and Layout ownership remain mounted throughout. A failed alternate leaves the prior image and asset identity in place and shows the existing fail-closed card.

Home ambient motion remains split by semantic owner. The weather TextPort owns its subtle 4.8 second vertical float and translucent day/night ink. `home.pebbleJarSparkles` owns a separate 32-particle upward jar field; it is not an alias for the room-wide twinkle layer.

## State and MCP boundary

Most v2 cloud surfaces remain read-only. The powder notebook has one registered cloud-state write exception; the nine device-local image keys are an isolated browser-storage boundary described above:

```text
GPT / ChatGPT App
-> existing /api/mcp update_text_target(targetId, text, mode)
-> registered text target fields
-> /api/state
-> StateController
-> TextPort or Panel
```

```text
NotebookPanelSession
-> pure notebook patch builder
-> allowlisted NotebookWriteClient
-> existing /api/set-state with X-Nest-Token
-> complete returned state
-> StateController.commit()
```

No Supabase service or secret key is present in browser code. `/api/set-state` retains its existing server-side Supabase credential and authorization behavior. If `/api/state` fails, the runtime may use `preview-state.v2.json` only for surfaces that explicitly set `allowDegradedFallback:true`; the UI labels this source `preview copy` and disables notebook mutation.

Each seaside beat now has one canonical `dialogueScript` target whose value is an ordered array of `{ speaker, text }` turns. `/write` and MCP accept the human-editable `@alex` / `@vicky` form and parse it through the same shared module. The existing six per-speaker `bubbleQueue` targets remain independently writable compatibility/ambient channels. If a canonical script field is absent, TextPort deterministically interleaves those two established queues Alex-first, Vicky-second; publishing a canonical script then becomes authoritative for that group. This adds no table, column, policy, bucket, or Storage migration because all fields remain keys inside the existing `nest_state.value` JSON document.

## Product surface boundary

Controller lifecycle states stay internal. They may feed automated assertions and fail-closed error handling, but they do not own a product-facing inspector, status ticker, hotspot-outline switch, or diagnostic panel. Those temporary construction surfaces were removed from the manifest, DOM, PanelController, and CSS together.

Source disclosure is deliberately narrower than diagnostics. StateController reveals one passive `PREVIEW COPY` notice only while the explicit degraded fixture is active; normal live and loading states add no badge. User panels render their content rather than internal source names. Safety cards remain stage-owned and appear only when an asset, runtime action, or boot transaction cannot complete safely.

## Source-of-truth gate

Any object with base-image coordinates starts hidden. It becomes visible only after:

```text
asset loaded / decoded
-> scene ownership resolved
-> object DOM mounted
-> cover or panorama base-image box available
-> Layout applies registered coordinate
-> data-layout-ready=1
```

There are no per-object delays or private coordinate patches.

Any text mutation invalidates the port's existing `data-layout-ready` marker before changing visibility. A taller or shorter line remains non-interactive and transparent until the shared LayoutController measures and places its new box.

## Promotion boundary

This architecture is not promoted merely because automated checks pass. The independent preview must be deployed and visibly accepted first. Promotion into `/cloud` requires a separate exact diff and rollback plan; it must retire replaced v1 owners rather than load v1 and v2 together.
