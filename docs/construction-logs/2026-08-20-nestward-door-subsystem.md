# Kitten Nest construction log · 2026-08-20 · Nestward Door subsystem

## Scope and baseline

The clean integration branch starts from the phone-accepted production baseline `0eabbd06d73b822160e71510887fd7104deffa40`. The experimental head `ac2b4ae2849152085559c45bd7c554604e33191c` is 27 commits ahead and zero behind; it was audited as evidence and was not merged wholesale.

No `/cloud` runtime, protected state field, Supabase data, PWA viewport sizing, bottom-band workaround, sofa, or coffee-table behavior changed.

## Experimental commit classification

| Class | Commits | Disposition |
| --- | --- | --- |
| Door State calibration tooling | `1ca80ea` through `c36bcdf` | Keep only as historical calibration evidence. Do not ship the labs in the clean runtime. |
| Runtime split for install order | `0e3f383`, `e246a3a` | Rejected. The copied `nestward-core.js` and thin bootstrap solved monkey-patch timing, not a product boundary. |
| Door Away prototype runtime | `bc96874`, `f007fc2`, `e246a3a` | Behavior retained; implementation replaced. |
| Facing/preload/renderer regressions | `0e914f2` through `70b7610` | Root causes retained as tests and architecture guards; patches not copied. |
| Door Transition calibration labs | `d09f18b` through `c9e32f9` | Accepted coordinates retained in the canonical model; lab runtime not copied. |
| Door Transition prototypes | `f0e92ec`, `396090d`, `ad53e4c`, `c686f71`, `ac2b4ae` | Coordinates retained; duplicate overlay and renderer wrapper rejected. |

The audited branch contained duplicate v1/v2 integrations and overlays, multiple `WorldRenderer.prototype.render` wrappers, actor state mutation to `x = -10000`, forced `bubble.hidden = true`, pointer capture guards, a second actor renderer, and runtime Sobel/live-wire work tied to localStorage.

## Architecture decision

The clean branch introduces one movement API, one actor-occlusion controller, and one canonical renderer pass. Door Away and normal Door Transition are state controllers that request movement and per-actor mask modes; neither owns drawing or main-world input.

The accepted coordinates are now canonical static data in `world-model.js`. Exact routes update facing at every segment, while ordinary A* journeys preserve the accepted baseline facing contract. This removes the Door Away always-facing-right bug without another renderer wrapper.

Actor movement now has explicit control ownership. Door Away claims Hubby and Naili for its complete active lifetime, and normal Door Transition claims Kitten and Hubby until arrival finishes. Ambient movement or a furniture action can no longer replace a Door route during the pause between segments; unrelated world interaction remains live.

Door Away no longer disables Hubby hit testing, hides Kitten's bubble, or installs pointer listeners. Its only interaction gate is the modeled door object. Door actors remain canonical actors, so normal screen bounds and speech anchors continue to work.

Naili is included in the formal sequence: Naili exits first, Hubby follows after two seconds, both wander in the shared accepted zone without choosing the same endpoint, recall returns Naili first, and Hubby follows after two seconds. There is no timed automatic return.

## Door asset checkpoint

Vicky supplied a complete 214,282-byte Door Away backup from her phone Notes. It is now preserved verbatim as `v2/nestward/assets/door/door-away-calibration.v1.json`, with SHA-256 `ea34e79cb8466be314f0b21f9295acaff157359579f2e741d8d8daab133af3f3`. The source holds the full 1536 × 1024 live-wire guides plus 152 A adjustment strokes, 44 B adjustment strokes, 44 walk strokes, accepted Door Away point1/point2 values, and speed 1.2.

`scripts/bake-door-occlusion.mjs` is a build-only port of the repaired Float64 live-wire algorithm. It produced three static candidate PNGs with these alpha bounds:

| Candidate | Alpha bounds | SHA-256 |
| --- | --- | --- |
| A | `1363,171` → `1473,566` | `c8ead22d7cab7905d9e5a1a8d33711b216f5a4e7d93433180f0c1e407ae31d0e` |
| B | `1456,203` → `1535,762` | `45ae33169b49d66f921aa073c6e019edf7d790317690e4da18a8bcc26c62e831` |
| walk | `1126,391` → `1535,666` | `78e39a331573a000cde6a40e84fc9415dc068bbbd7e89741c397762b3d913cd6` |

The Notes export is a satisfactory backup rather than a declared final acceptance record, so `door-occlusion-manifest.v1.json` is intentionally `candidate-baked-awaiting-phone-visual-qa`. Its runtime `assets` remain null: both formal controllers stay disabled and the exact `0eabbd06` door transition remains active. A 300–400% phone visual comparison is the sole remaining gate before deliberately promoting the three assets to `accepted-baked`.

The candidate can be inspected only with the clean branch's explicit `?doorCandidate` URL flag. This opt-in decodes `candidateAssets` and shows the temporary Door Away controls; default URLs remain fail-closed and do not decode any candidate PNG.

## Verification

Local verification after the architecture rebuild:

```text
manifest validation:                    passed, zero warnings
Node test suite:                         156/156 passed
new Door/actor/baseline tests:           26 passed
browser-module syntax parsing:           passed
JSON registry and room config parsing:   passed
git diff whitespace check:               passed
renderer prototype patches:              zero
Door actor off-screen mutations:          zero
Door-owned bubble hiding:                 zero
production live-wire/localStorage use:    zero
```

Phone visual acceptance was completed by Vicky after this checkpoint. On 2026-08-20 she accepted the baked Door Away visuals and behavior for formal release. The manifest was promoted to `accepted-baked`, the static PNG filenames were promoted to formal `.v1.png` assets, and the temporary QA URL route was removed.

Release adjustment: after recall, Naili now clears the indoor threshold to `{ x: 1220, z: .48 }`, a tested central walkable floor anchor, before Hubby begins his delayed return. This prevents the two actors from appearing to stand on the same point. The retained upper-right trigger shows only semi-transparent `出去` and `叫回来` buttons; all QA/construction wording was removed. The future wall-lamp hotspot remains intentionally undecided.
