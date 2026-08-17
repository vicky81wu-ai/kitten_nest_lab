import { SCENES, actorScale, groundY } from './world-model.js';
import { WorldRenderer } from './world-renderer.js';

// Branch-only phone acceptance layer. Keep the formal model untouched until
// these exact painted-floor and doorway coordinates pass device inspection.
const indoor = SCENES.indoor;
const outdoor = SCENES.outdoor;

const indoorDoor = indoor.objects.find((object) => object.id === 'door');
const outdoorDoor = outdoor.objects.find((object) => object.id === 'door');
const bench = outdoor.objects.find((object) => object.id === 'bench');
const fountain = outdoor.objects.find((object) => object.id === 'fountain');

// Exact phone-calibrated indoor -> outdoor transition target. The actor must
// physically reach this painted doorway point before the direct scene switch.
Object.assign(indoorDoor, {
  x: 1394,
  z: .167,
  interactionRadius: 1,
  hitPolygons: [[[1366, 150], [1535, 150], [1535, 558], [1366, 558]]]
});
indoor.entry.fromOutdoor = {
  player: { x: 1288, z: .57 },
  hubby: { x: 1382, z: .50 },
  naili: { ...indoor.entry.fromOutdoor.naili }
};

// Exact phone-calibrated outdoor landing / return target. This single point is
// both Kitten's entry after leaving the house and the point she reaches before
// switching back indoors.
Object.assign(outdoorDoor, {
  x: 153,
  z: .299,
  interactionRadius: 1,
  hitPolygons: [[[90, 230], [310, 230], [310, 615], [90, 615]]]
});
outdoor.entry.fromIndoor = {
  player: { x: 153, z: .299 },
  hubby: { ...outdoor.entry.fromIndoor.hubby },
  naili: { ...outdoor.entry.fromIndoor.naili }
};

// The old house-footprint guard swallowed all three painted stair treads.
// Retain only the solid masonry strip at the far-left edge; the landing and
// steps themselves are navigable authored floor.
const houseGuard = outdoor.obstacles.find((obstacle) => obstacle.x1 === 0 && obstacle.x2 === 320 && obstacle.z1 === .03 && obstacle.z2 === .4);
if (houseGuard) Object.assign(houseGuard, { x2: 82, z2: .27 });

// Bench interaction owns only the visible back + seat. Legs and the path in
// front remain floor taps. A tiny strip above the back is intentionally kept.
Object.assign(bench, {
  hit: [405, 346, 610, 494],
  hitPolygons: [[[405, 346], [610, 346], [610, 494], [405, 494]]]
});

// The formal model still carries a broad bench collision rectangle even after
// its hotspot was tightened. Remove that copied blocker for phone acceptance:
// the painted legs and the path in front are valid floor.
const benchBlockIndex = outdoor.obstacles.findIndex((obstacle) => obstacle.x1 === 405 && obstacle.x2 === 610 && obstacle.z1 === .04 && obstacle.z2 === .27);
if (benchBlockIndex >= 0) outdoor.obstacles.splice(benchBlockIndex, 1);

// Fountain hotspot is deliberately much smaller than its stone footprint:
// narrow upright column + the visible water surface. The stone pool wall is not
// interactive, so taps beside it remain floor taps all the way toward the gate.
Object.assign(fountain, {
  hit: [980, 280, 1200, 548],
  hitPolygons: [
    [[1060, 286], [1148, 286], [1170, 472], [1038, 472]],
    [[1000, 472], [1030, 454], [1086, 446], [1144, 454], [1180, 476], [1190, 505], [1170, 530], [1088, 542], [1012, 530], [990, 504]]
  ]
});

// Replace the old broad fountain collision with only the physical central body
// and the lower-left yellow lamp. The gate-side red-marked corridor remains
// walkable right up to the gate bottom while the lamp itself stays solid.
const fountainBlockIndex = outdoor.obstacles.findIndex((obstacle) => obstacle.x1 === 965 && obstacle.x2 === 1200 && obstacle.z1 === .03 && obstacle.z2 === .31);
if (fountainBlockIndex >= 0) {
  outdoor.obstacles.splice(fountainBlockIndex, 1,
    { x1: 1055, x2: 1195, z1: .05, z2: .275 },
    { x1: 990, x2: 1018, z1: .20, z2: .285 }
  );
}

// Naili gets the same grounded visual cue as the people. Accepted on phone:
// keep the doubled footprint and let the paws overlap the ellipse slightly.
const originalRender = WorldRenderer.prototype.render;
WorldRenderer.prototype.render = function renderWithNailiShadow(state, time) {
  originalRender.call(this, state, time);
  const naili = state.naili;
  if (!naili || naili.carried) return;
  const scene = state.scene;
  const perspective = actorScale(naili.z) / actorScale(.62);
  const spriteHeight = (scene.actorHeights?.naili || 70) * perspective * this.scale;
  const x = (naili.x - state.cameraX) * this.scale;
  const y = (groundY(scene, naili.z) - (state.cameraY || 0)) * this.scale;
  const ctx = this.ctx;
  ctx.save();
  ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  ctx.fillStyle = 'rgba(40,23,20,.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, spriteHeight * .34, Math.max(3, spriteHeight * .086), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
