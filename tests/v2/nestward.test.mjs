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
  for (const file of ['v2/nestward/nestward.js', 'v2/nestward/world-model.js', 'v2/nestward/world-renderer.js']) {
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
  assert.match(renderer, /nativeFacingByRole = \{ player: 1, hubby: -1, naili: 1 \}/);
  assert.match(renderer, /const direction = facing \* metrics\.nativeFacing/);
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
