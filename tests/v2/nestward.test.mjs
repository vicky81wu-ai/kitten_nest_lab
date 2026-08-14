import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolveSameOriginRoute } from '../../v2/runtime/core/actions.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Nestward is an immersive world without the prototype title HUD', async () => {
  const html = await read('../../v2/nestward/index.html');
  assert.match(html, /<canvas id="world"/);
  assert.doesNotMatch(html, /Nestward|窝里窝外<\/|sceneBadge|actionSheet/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /black-translucent/);
});

test('Nestward artwork is deterministic and keeps animation separate from geometry', async () => {
  const model = await read('../../v2/nestward/world-model.js');
  const renderer = await read('../../v2/nestward/world-renderer.js');
  assert.match(model, /seededRandom/);
  assert.doesNotMatch(renderer, /Math\.random/);
  assert.match(renderer, /drawFountainEffects/);
  assert.match(renderer, /drawWings/);
  assert.match(renderer, /renderables\.sort/);
  assert.match(renderer, /indoor-world\.webp/);
  assert.match(renderer, /outdoor-world\.webp/);
  assert.match(renderer, /createImageBitmap/);
  assert.doesNotMatch(renderer, /drawIndoorStatic|drawOutdoorStatic|drawObject/);
});

test('Nestward keeps object visuals, hit regions, and approach sockets in one model', async () => {
  const model = await read('../../v2/nestward/world-model.js');
  for (const id of ['bed', 'sofa', 'door', 'fountain', 'pond', 'bower']) {
    assert.match(model, new RegExp(`id: '${id}'.*hit:.*socket:`, 's'));
  }
  assert.match(model, /findPath/);
  assert.match(model, /slots:/);
  const { SCENES, findPath, isInteractionSocketWalkable } = await import('../../v2/nestward/world-model.js');
  for (const scene of Object.values(SCENES)) {
    assert.equal(scene.cameraWidth, scene.width, `${scene.id} camera cannot reveal its complete authored world`);
    for (const object of scene.objects) {
      for (const [slot, point] of [['socket', object.socket], ...Object.entries(object.slots || {})]) {
        assert.equal(isInteractionSocketWalkable(scene, point), true, `${scene.id}.${object.id}.${slot} is blocked`);
        const destination = findPath(scene, scene.spawn.player, point).at(-1);
        assert.deepEqual(destination, point, `${scene.id}.${object.id}.${slot} is displaced by pathfinding`);
      }
    }
  }
  const runtime = await read('../../v2/nestward/nestward.js');
  assert.doesNotMatch(runtime, /settleAt\(hubby,\s*\d/);
  assert.doesNotMatch(runtime, /walkActor\(naili,\s*\{\s*x:\s*\d/);
});

test('Nestward local route action cannot become an external redirect', () => {
  const base = 'https://kitten-nest-lab.vercel.app/cloud';
  assert.equal(resolveSameOriginRoute('/v2/nestward/', base), '/v2/nestward/');
  assert.equal(resolveSameOriginRoute('/v2/nestward/?from=jar#door', base), '/v2/nestward/?from=jar#door');
  assert.throws(() => resolveSameOriginRoute('//evil.example/world', base));
  assert.throws(() => resolveSameOriginRoute('https://evil.example/world', base));
  assert.throws(() => resolveSameOriginRoute('/\\evil.example/world', base));
});

test('Nestward browser modules parse as JavaScript', () => {
  for (const file of ['v2/nestward/nestward.js', 'v2/nestward/world-model.js', 'v2/nestward/world-renderer.js', 'v2/nestward/speech-runtime.js']) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: new URL('../..', import.meta.url),
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, `${file} failed syntax parsing:\n${result.stderr}`);
  }
});

test('Nestward uses one shared standalone PWA scope without creating a second home entry', async () => {
  const nest = await read('../../v2/index.html');
  const world = await read('../../v2/nestward/index.html');
  const webmanifest = JSON.parse(await read('../../v2/manifest.webmanifest'));
  assert.match(nest, /href="\/v2\/manifest\.webmanifest"/);
  assert.match(world, /href="\/v2\/manifest\.webmanifest"/);
  assert.equal(webmanifest.scope, '/');
  assert.equal(webmanifest.start_url, '/cloud');
  const manifest = JSON.parse(await read('../../v2/data/nest-manifest.v2.json'));
  const entries = Object.values(manifest.objects).filter((object) => object.action?.target === '/v2/nestward/');
  assert.deepEqual(entries.map((object) => object.id), ['home.nestwardEnterHot']);
});

test('the indoor bed is a mounted interaction with authored poses and foreground occlusion', async () => {
  const { SCENES } = await import('../../v2/nestward/world-model.js');
  const bed = SCENES.indoor.objects.find((object) => object.id === 'bed');
  assert.equal(bed.mounts.kittenLie.pose, 'bed-lie');
  assert.equal(bed.mounts.hubbyLean.pose, 'bed-lean');
  assert.ok(SCENES.indoor.foregroundLayers.some((layer) => layer.id === 'bed-front'));
  const renderer = await read('../../v2/nestward/world-renderer.js');
  assert.match(renderer, /drawPlateLayer/);
  assert.match(renderer, /kittenBedLie/);
  assert.match(renderer, /hubbyBedLean/);
  assert.doesNotMatch(renderer, /rotate\(-1\.28/);
});

test('refined actors walk in frames while the camera supports drag and pinch inspection', async () => {
  const renderer = await read('../../v2/nestward/world-renderer.js');
  const runtime = await read('../../v2/nestward/nestward.js');
  assert.match(renderer, /kittenWalk4/);
  assert.match(renderer, /hubbyWalk4/);
  assert.match(renderer, /nailiWalk4/);
  assert.match(renderer, /nativeFacingByRole = \{ player: 1, hubby: -1, naili: 1 \}/);
  assert.match(renderer, /const direction = facing \* metrics\.nativeFacing/);
  assert.match(renderer, /Math\.floor\(actor\.step \* \.72\) % 4 \+ 1/);
  assert.doesNotMatch(renderer, /% 2 \? 4 : 2/);
  assert.match(renderer, /assets\.get\('hubbyCarryWalk1'\)/);
  assert.match(renderer, /hubbyCarryWalk3/);
  assert.match(renderer, /% 3 \+ 1/);
  assert.match(renderer, /const activeSprite = state\.hubby\.walking \? metrics\.activeSprite : metrics\.sprite/);
  assert.doesNotMatch(renderer, /const split = \.53/);
  assert.match(renderer, /drawCarryTattoo/);
  assert.match(renderer, /fillText\('19\.8'/);
  assert.match(renderer, /imageSmoothingEnabled = true/);
  assert.match(runtime, /activePointers/);
  assert.match(runtime, /beginPinch/);
  assert.match(runtime, /state\.cameraFree = true/);
  assert.match(runtime, /renderer\.actorScreenAnchor/);
});

test('future CG portals are opt-in long presses and the garden gate owns explicit state', async () => {
  const runtime = await read('../../v2/nestward/nestward.js');
  const { SCENES } = await import('../../v2/nestward/world-model.js');
  assert.match(runtime, /object\?\.cgPortal\?\.route/);
  assert.match(runtime, /object\.cgPortal\.holdMs \|\| 1100/);
  assert.match(runtime, /gardenGateOpen/);
  const gate = SCENES.outdoor.objects.find((object) => object.id === 'gardenGate');
  assert.equal(gate.futureExit, 'orchardPath');
  assert.equal(Object.values(SCENES).flatMap((scene) => scene.objects).some((object) => object.cgPortal), false);
});

test('indoor people scale by 35 percent while bed lying keeps an authored normalized width', async () => {
  const { SCENES } = await import('../../v2/nestward/world-model.js');
  assert.equal(SCENES.indoor.actorHeights.player, 257);
  assert.equal(SCENES.indoor.actorHeights.hubby, 294);
  const bed = SCENES.indoor.objects.find((object) => object.id === 'bed');
  assert.equal(bed.mounts.kittenLie.width, 310);
});

test('the reading chair proves back actor and front occlusion layers from one object model', async () => {
  const { SCENES } = await import('../../v2/nestward/world-model.js');
  const chair = SCENES.indoor.objects.find((object) => object.id === 'readingChair');
  assert.equal(chair.visual.asset, 'readingChair');
  assert.ok(chair.visual.backZ < chair.mounts.kittenSit.z);
  assert.ok(chair.visual.frontZ > chair.mounts.kittenSit.z);
  assert.equal(chair.visual.frontPolygons.length, 2);
  assert.ok(chair.visual.frontPolygons.every((polygon) => Math.max(...polygon.map(([x]) => x)) - Math.min(...polygon.map(([x]) => x)) < 80));
  assert.equal(chair.mounts.kittenSit.pose, 'bed-sit');
  assert.equal(chair.mounts.kittenSit.height, 231);
  assert.equal(chair.mounts.hubbySit.height, 265);
  const renderer = await read('../../v2/nestward/world-renderer.js');
  assert.match(renderer, /drawPropLayer/);
  assert.match(renderer, /kind: 'propBack'/);
  assert.match(renderer, /kind: 'propFront'/);
});

test('speech supports pause resume manual and automatic ordered turns', async () => {
  const { SpeechRuntime } = await import('../../v2/nestward/speech-runtime.js');
  const runtime = new SpeechRuntime({
    chat: {
      playback: 'auto', loop: false, participants: ['hubby', 'player'], duration: 100,
      lines: [
        { speaker: 'hubby', text: 'one' },
        { speaker: 'hubby', text: 'two' },
        { speaker: 'player', text: 'three' }
      ]
    },
    note: { playback: 'manual', speaker: 'player', lines: ['a', 'b'] }
  });
  assert.equal(runtime.activate('chat', 0).state.text, 'one');
  assert.equal(runtime.tick(99), null);
  assert.equal(runtime.tick(100).state.text, 'two');
  assert.equal(runtime.close().type, 'hide');
  assert.equal(runtime.advance(200).state.text, 'three');
  assert.equal(runtime.tick(300).complete, true);
  assert.equal(runtime.activate('note', 0).state.speaker, 'player');
  assert.equal(runtime.tick(9999), null);
  assert.equal(runtime.advance(9999).state.text, 'b');
});

test('actor body zones, carry walking, and immersive viewport sizing remain explicit', async () => {
  const runtime = await read('../../v2/nestward/nestward.js');
  const renderer = await read('../../v2/nestward/world-renderer.js');
  const css = await read('../../v2/nestward/nestward.css');
  assert.match(runtime, /hitZoneForActor/);
  assert.match(runtime, /startPrincessCarry/);
  assert.match(runtime, /const carryWasActive = state\.princessCarry\.active/);
  assert.match(runtime, /state\.princessCarry\.active = carryWasActive/);
  assert.match(runtime, /if \(choices\.length === 1 && !carrying\)/);
  assert.match(runtime, /actionPanelArmed/);
  assert.match(runtime, /return onHeadSide \? 'actions' : 'speech'/);
  assert.match(runtime, /poseActorInPlace/);
  assert.match(runtime, /脱下月光翅膀/);
  assert.match(renderer, /hubby-carry-walk-1\.png/);
  assert.match(renderer, /hubby-carry-walk-2\.png/);
  assert.match(renderer, /hubby-carry-walk-passing\.png/);
  assert.match(renderer, /naili-walk-4\.png/);
  assert.match(renderer, /state\.hubby\.dir \|\| 1\) \* nativeFacingByRole\.hubby/);
  assert.doesNotMatch(renderer, /drawGardenGate/);
  assert.match(renderer, /parentElement\?\.getBoundingClientRect/);
  assert.match(css, /html,body\{[^}]*height:100vh;height:100dvh;height:100lvh;[^}]*min-height:100vh;min-height:100dvh;min-height:100lvh/);
  assert.match(css, /\.nestward-shell\{[^}]*height:100vh;height:100dvh;height:100lvh;/);
  assert.match(css, /--kitten-voice:#d85b86/);
  assert.match(css, /pointer-events:auto/);
});

test('mounted composites outrank their own occlusion while nearby interaction does not snap to a socket', async () => {
  const renderer = await read('../../v2/nestward/world-renderer.js');
  const runtime = await read('../../v2/nestward/nestward.js');
  assert.match(renderer, /mountedObjectIds/);
  assert.match(renderer, /mountedObjectIds\.has\(item\.objectId\)/);
  assert.match(runtime, /function isNearObject/);
  assert.match(runtime, /function nearestApproachPoint/);
  assert.match(runtime, /if \(isNearObject\(mover, object\)\)/);
  assert.doesNotMatch(runtime, /walkActor\(mover, object\.socket/);
});

test('authored red-line floor corridors stay walkable indoors and outdoors', async () => {
  const { SCENES, isBlocked } = await import('../../v2/nestward/world-model.js');
  const indoorFloor = [
    { x: 300, z: .38 },
    { x: 610, z: .37 },
    { x: 900, z: .48 },
    { x: 1300, z: .48 }
  ];
  const outdoorFloor = [
    { x: 850, z: .48 },
    { x: 790, z: .52 },
    { x: 1185, z: .52 },
    { x: 1290, z: .48 }
  ];
  for (const point of indoorFloor) assert.equal(isBlocked(SCENES.indoor, point), false, `indoor ${point.x},${point.z} is blocked`);
  for (const point of outdoorFloor) assert.equal(isBlocked(SCENES.outdoor, point), false, `outdoor ${point.x},${point.z} is blocked`);
});

test('garden interaction silhouettes leave the central path as real floor', async () => {
  const { SCENES, pointInsideHit } = await import('../../v2/nestward/world-model.js');
  const interactive = SCENES.outdoor.objects.filter((object) => ['swing', 'garden', 'teaTable', 'gardenGate'].includes(object.id));
  for (const point of [{ x: 720, y: 545 }, { x: 835, y: 555 }, { x: 900, y: 570 }]) {
    const swallowedBy = interactive.find((object) => pointInsideHit(object, point));
    assert.equal(swallowedBy, undefined, `central path point ${point.x},${point.y} was swallowed by ${swallowedBy?.id}`);
  }
  const swing = interactive.find((object) => object.id === 'swing');
  assert.equal(swing.swingMount.renderY, 500);
});

test('an early ResizeObserver callback cannot outrun Nestward asset preload', async () => {
  const renderer = await read('../../v2/nestward/world-renderer.js');
  assert.match(renderer, /this\.ready = false/);
  assert.match(renderer, /this\.ready = true/);
  assert.match(renderer, /if \(currentScene && this\.ready\) this\.ensureCache\(currentScene\)/);
});
