# Nestward accepted phone baseline — 2026-08-17

Promoted after phone calibration/acceptance:

- Indoor desk-front walkable floor and removed bed-front amputating mask.
- Outdoor three-step/landing floor opened by tightening the house guard.
- Bench hotspot tightened to back/seat and its old broad blocker removed.
- Fountain hotspot tightened to column + water surface; broad blocker replaced by central body plus separate lower-left lamp blocker.
- Naili grounded shadow accepted at doubled footprint.
- Door calibration constants:
  - kitten indoor A `{ x: 1394, z: .167 }`
  - kitten outdoor anchor `{ x: 153, z: .299 }`
  - kitten indoor B `{ x: 1241, z: .291 }`
  - hubby indoor exit `{ x: 1466, z: .190 }`
  - hubby indoor arrival `{ x: 1353, z: .159 }`
  - hubby outdoor entry `{ x: 197, z: .298 }`
  - hubby outdoor return `{ x: 190, z: .330 }`
  - carry indoor anchor `{ x: 1381, z: .202 }`
  - carry outdoor anchor `{ x: 227, z: .338 }`
- Indoor/outdoor door hotspot polygons are calibrated and no longer own surrounding stair/floor taps.
- Normal outdoor → indoor arrival sequence: Kitten appears at A, automatically clears to B, then Hubby walks from the doorway to his indoor arrival point.
- Normal transitions wait for both actors to reach their calibrated door targets; carry transitions use carry anchors.

Not promoted yet:

- Door FX / “Hubby 在哪里” temporary walk zone.
- Transition-only two-sided doorway masks and their brush data.

Those remain tomorrow’s dedicated door-compositing work and must not be inferred from discarded calibration brush drafts.
