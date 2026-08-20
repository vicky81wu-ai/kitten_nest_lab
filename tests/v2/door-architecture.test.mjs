import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

const root = new URL('../../v2/nestward/', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Door features use one canonical renderer extension instead of prototype patches', async () => {
  const files = (await readdir(root)).filter((name) => name.endsWith('.js'));
  const sources = await Promise.all(files.map(async (name) => [name, await read(name)]));
  for (const [name, source] of sources) {
    assert.doesNotMatch(source, /WorldRenderer\.prototype\.render/, `${name} patches the renderer prototype`);
  }

  const renderer = await read('world-renderer.js');
  assert.match(renderer, /setActorOcclusionProvider/);
  assert.match(renderer, /drawActorWithOcclusion/);
  assert.match(renderer, /destination-in/);
  assert.match(renderer, /destination-out/);
  assert.match(renderer, /drawActorRenderable\(context, this\.assets, state, item, time\)/);
});

test('Door state never hides actors or bubbles by mutating core interaction state', async () => {
  const sources = await Promise.all([
    read('door-away-controller.js'),
    read('door-transition-controller.js'),
    read('door-occlusion-controller.js')
  ]);
  const doorSource = sources.join('\n');
  assert.doesNotMatch(doorSource, /-10000/);
  assert.doesNotMatch(doorSource, /bubble\.hidden/);
  assert.doesNotMatch(doorSource, /actorScreenBounds/);
  assert.doesNotMatch(doorSource, /pointerdown|pointermove|pointerup/);

  const runtime = await read('nestward.js');
  assert.match(runtime, /if \(doorAway\?\.ownsActor\(actor\)\) return 'speech'/);
  assert.match(runtime, /if \(object\.direct && doorAway\?\.blocksDoor\(object\)\)/);
  assert.match(runtime, /globalThis\.__NW_DOOR_TRANSITION__/);
  assert.doesNotMatch(await read('door-away-controller.js'), /state\.doorTravel\s*=\s*true/);
});

test('production Door runtime owns no live-wire solver or browser-local accepted calibration', async () => {
  const sources = await Promise.all([
    read('door-asset-loader.js'),
    read('door-away-controller.js'),
    read('door-occlusion-controller.js'),
    read('door-transition-controller.js'),
    read('door-walk-planner.js')
  ]);
  const doorSource = sources.join('\n');
  assert.doesNotMatch(doorSource, /localStorage/);
  assert.doesNotMatch(doorSource, /Sobel|Dijkstra|live-wire|liveWire/i);

  const manifest = JSON.parse(await read('assets/door/door-occlusion-manifest.v1.json'));
  assert.equal(manifest.status, 'candidate-baked-awaiting-phone-visual-qa');
  assert.equal(manifest.activationPolicy, 'fail-closed-to-accepted-phone-baseline');
  assert.deepEqual(manifest.assets, { maskA: null, maskB: null, walk: null });
});

test('the clean integration tree contains no duplicate Door prototype modules or runtime core copy', async () => {
  for (const file of [
    'nestward-core.js',
    'door-away-integration.js',
    'door-away-integration-v2.js',
    'door-away-overlay.js',
    'door-away-overlay-v2.js',
    'door-away-facing.js',
    'door-transition-integration.js',
    'door-transition-overlay.js'
  ]) {
    await assert.rejects(access(new URL(file, root)), { code: 'ENOENT' });
  }
});
