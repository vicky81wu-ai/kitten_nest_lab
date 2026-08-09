# Kitten Nest v2 Architecture

Status: isolated preview architecture  
Route: `/v2/index.html`  
Stable route: `/cloud` remains untouched

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
| Effect | Sparkles, steam, clock hands, pause/destroy | Click binding, scene mutation |

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
scene.dock
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

The original upper-left long-press gesture is restored as one transparent global Hotspot object. Its standard `panel.open` action opens a scoped `localMediaSetup` session inside the existing PanelController. That session may create the known database/store and write or clear only `photo0` through `photo5`, using `readwrite` transactions; it rejects non-images, files above 15 MB, and every other key. It has no cloud upload, room-background override, Supabase credential, or general IndexedDB access.

The read carousel and local setup writer remain separate sessions. Blob object URLs belong to the memories session and are revoked at teardown. Reopening the photo wall performs a fresh readonly load, so a saved slot appears without a second runtime owner.

## Scoped notebook mutation boundary

`home.hubbyNotePanel` is bound to the registered `hubbyNote` target card, including its current, updated-at, favorite, archive, history, and trash fields. A pure resolver normalizes string or object archive entries, dates, and favorite flags; pure mutation builders produce save, favorite, and soft-delete patches. A scoped notebook session renders and edits those pages under the existing PanelController and preserves the selected page across state refreshes.

The session does not own a general write client. PanelController injects one client configured by `runtime.stateWrites`; the client rejects every patch key outside the six fields derived from the notebook card. Successful responses are committed through StateController so the open panel and all other readers receive one `state:change` event. The notebook still has no generic action envelope or second controller.

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

`lapClose` owns only its two registered objects plus global controls. It does not inherit `coffeeCorner` hotspots, panels, effects, or text ports.

The three beach scenes use the same transaction and stack. Their wide base images live in the same retained scene world as portrait rooms; only the manifest presentation changes from `cover` to `panorama`. The viewport may scroll horizontally, while controls and panels remain stage-level UI.

An initially hidden panorama dialogue is measured by Layout before it becomes paint-ready. TextPort listens for that layout completion and, only for the newly revealed port, clamps the horizontal viewport so the complete bubble remains inside a 16 px safe edge. The adjustment occurs in the same task as layout readiness, preventing both clipped copy and a visible second-position jump.

If the next scene asset fails, SceneRuntime does not commit the candidate navigation state. It reconciles the prior snapshot, restores Layout readiness for the prior owner set, emits `scene:didFail`, and leaves the scene stack unchanged.

## State and MCP boundary

Most v2 cloud surfaces remain read-only. The powder notebook has one registered cloud-state write exception; the six device-local photo slots are an isolated browser-storage boundary described above:

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

No Supabase service or secret key is present in browser code. `/api/set-state` retains its existing server-side Supabase credential and authorization behavior. If `/api/state` fails, the isolated preview may use `preview-state.v2.json` only for surfaces that explicitly set `allowDegradedFallback:true`; the UI labels this source `preview copy` and disables notebook mutation. Recovered beach dialogue remains `staticText` with a manifest-owned fallback queue and does not invent a writable registry target.

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
