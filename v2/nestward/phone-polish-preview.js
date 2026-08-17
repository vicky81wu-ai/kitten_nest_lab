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

// Indoor threshold: the solo actor must physically reach the painted doorway
// before the scene switches. When returning indoors Hubby owns this threshold;
// Kitten starts one body-length deeper in the room. Carrying syncs Kitten to
// Hubby's threshold, producing the requested combined doorway pose.
Object.assign(indoorDoor, {
  x: 1382,
  z: .50,
  interactionRadius: 1,
  hitPolygons: [[[1366, 150], [1535, 150], [1535, 558], [1366, 558]]]
});
indoor.entry.fromOutdoor = {
  player: { x: 1288, z: .57 },
  hubby: { x: 1382, z: .50 },
  naili: { ...indoor.entry.fromOutdoor.naili }
};

// Outdoor threshold / default Kitten entry: the broad top stair landing is
// real floor. Keep Hubby's already accepted outdoor start unchanged.
Object.assign(outdoorDoor, {
  x: 272,
  z: .255,
  interactionRadius: 1,
  hitPolygons: [[[118, 245], [310, 245], [310, 505], [118, 505]]]
});
outdoor.entry.fromIndoor = {
  player: { x: 272, z: .255 },
  hubby: { ...outdoor.entry.fromIndoor.hubby },
  naili: { ...outdoor.entry.fromIndoor.naili }
};

// The old house-footprint guard swallowed all three painted stair treads.
// Retain only the solid masonry strip at the far-left edge; the landing and
// steps themselves are navigable authored floor.
const houseGuard = outdoor.obstacles.find((obstacle) => obstacle.x1 === 0 && obstacle.x2 === 320 && obstacle.z1 === .03 && obstacle.z2 === .4);
if (houseGuard) Object.assign(houseGuard, { x2: 118, z2: .34 });

// Bench interaction owns only the visible back + seat. Legs and the path in
// front remain floor taps. A tiny strip above the back is intentionally kept.
Object.assign(bench, {
  hit: [405, 346, 610, 494],
  hitPolygons: [[[405, 346], [610, 346], [610, 494], [405, 494]]]
});

// Fountain interaction hugs the fountain body plus its lower-left yellow lamp;
// the central garden path to the left is floor rather than a giant hotspot.
Object.assign(fountain, {
  hitPolygons: [
    [[1042, 286], [1172, 286], [1218, 458], [1200, 586], [1034, 586], [1028, 480]],
    [[980, 452], [1038, 452], [1042, 566], [978, 566]]
  ]
});

// Naili gets the same grounded visual cue as the people. This is deliberately
// branch-local for phone acceptance; after approval it should move into the
// canonical renderer next to drawSpriteNaili rather than remain a monkey patch.
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
  ctx.ellipse(x, y + 2, spriteHeight * .17, Math.max(2, spriteHeight * .043), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
