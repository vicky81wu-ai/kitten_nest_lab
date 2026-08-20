# Nestward Door subsystem

Updated: 2026-08-20

## Scope and ownership

Nestward Door is one subsystem spanning movement, door-frame occlusion, actor behavior, interaction gating, and real scene transition. It is not a renderer patch and it does not own ordinary world taps, speech bubbles, furniture, pan, or pinch zoom.

| Concern | Canonical owner |
| --- | --- |
| Door and actor coordinates | `v2/nestward/world-model.js` |
| Normal and exact actor routes, including facing | `v2/nestward/actor-motion.js` |
| Actor-to-mask mode | `v2/nestward/door-occlusion-controller.js` |
| Actor rendering and mask compositing | `v2/nestward/world-renderer.js` |
| Baked A/B/walk asset activation | `v2/nestward/door-asset-loader.js` |
| Door Away behavior | `v2/nestward/door-away-controller.js` |
| Real indoor/outdoor transition | `v2/nestward/door-transition-controller.js` |
| Door hotspot dispatch and normal interactions | `v2/nestward/nestward.js` |

`WorldRenderer` exposes one actor-occlusion provider. Feature modules submit an actor id and a mode; they must not patch `WorldRenderer.prototype.render`, hide an actor by moving it off-canvas, or paint a second actor implementation.

Door controllers claim exclusive control of only the actors currently crossing or wandering. Ordinary floor, furniture, and ambient routes cannot steal those actors between Door path segments; control is released at completion. This protects the state machine without installing a global tap guard.

## Shared door-frame modes

The A/B assets belong to the physical indoor door, not to a particular actor.

| Mode | Composite | Meaning |
| --- | --- | --- |
| idle | none | Normal indoor movement has no special door occlusion. |
| through-frame | subtract B from the actor | Active only while that actor crosses the right indoor frame. |
| outside | retain actor only inside A | The scene remains indoor while the actor appears to move outside. |

The same masks may be assigned independently to Kitten, Hubby, Naili, or later actors. The walk mask constrains Door Away movement only; it is not canonical room collision geometry.

## Door Away sequence

Start is explicit and is valid only indoors when normal door travel, carry, and incompatible actor mounts are inactive.

1. Hubby says he is taking Naili for a walk.
2. Naili reaches point1 with no special mask.
3. Naili crosses point1 to point2 under B, then enters outside/A-only mode.
4. Two seconds later Hubby follows the same phases.
5. Both wander independently inside the accepted walk mask and remain outside until explicit recall.
6. Recall routes Naili to point2 under A-only, then point2 to point1 under B.
7. Two seconds after Naili is inside, Hubby follows.
8. At Hubby's point1, all temporary modes and movement ownership are removed and the saved companion state is restored.

Door Away gates only the normal door hotspot while active. Character speech, furniture, floor movement for Kitten, pan, and pinch remain owned by their normal systems.

## Real scene transition

The formal transition controller uses the accepted 2026-08-18 points in `world-model.js`.

- Indoor exit: Kitten reaches point1, B activates, Kitten moves to point2, and the scene changes after Hubby also reaches his own indoor point.
- Outdoor arrival/exit uses each actor's single accepted outdoor point.
- Indoor arrival: Kitten is placed at point2 under B, moves to point1, and B is removed. Hubby uses his own indoor point.

The accepted phone-baseline transition remains the runtime fallback whenever the baked door asset manifest is not ready.

## Asset acceptance gate

Production activation requires three static `1536 × 1024` alpha assets: `maskA`, `maskB`, and `walk`. Their manifest status must be `accepted-baked` and all three dimensions must validate.

The full Door Away calibration export from Vicky's phone Notes is preserved verbatim at `v2/nestward/assets/door/door-away-calibration.v1.json` (SHA-256 `ea34e79cb8466be314f0b21f9295acaff157359579f2e741d8d8daab133af3f3`). It has 152 A adjustment strokes, 44 B adjustment strokes, and 44 walk strokes. The build-only script `scripts/bake-door-occlusion.mjs` generated three matching `1536 × 1024` candidate alpha PNGs. Their provenance is a satisfactory phone backup, so they are candidate assets rather than activated production assets until compared on phone.

Until that visual QA is complete, `door-occlusion-manifest.v1.json` stays `candidate-baked-awaiting-phone-visual-qa` and the new subsystem fails closed to the accepted phone baseline. Do not redraw, simplify, or infer replacement contours.

The clean branch exposes candidate assets only through the explicit `?doorCandidate` URL flag. That flag also reveals the temporary Door Away QA controls. A normal Nestward URL neither decodes nor installs candidate masks.

Sobel/live-wire reconstruction is calibration tooling only. It must not run during production startup.

## Explicit exclusions

- The iPhone standalone Canvas bottom band is a separate rendering investigation and is not part of Door.
- The coffee table/sofa layered-furniture concept is not part of Door.
- The possible wall-lamp secret trigger is undecided. Only `?doorAwayTest` may expose temporary construction controls.
