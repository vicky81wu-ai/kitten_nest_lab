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
