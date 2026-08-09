import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateManifest } from '../../v2/runtime/core/manifest.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('v2 manifest is an isolated, registry-backed single source', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  const result = validateManifest(manifest, textTargets);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(manifest.promoted, false);
  assert.equal(manifest.rules.stateWritesAllowed, false);
  assert.equal(Object.keys(manifest.controllers).length, 8);
});

test('lapClose scene does not inherit coffeeCorner interactive objects', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const coffeeObjects = new Set(manifest.scenes.coffeeCorner.objects);
  const leaked = manifest.scenes.lapClose.objects.filter((id) => coffeeObjects.has(id));
  assert.deepEqual(leaked, []);
  assert.equal(manifest.scenes.lapClose.blocksParentInteractive, true);
});

test('home restorations and the approved beach chain stay explicit in one manifest', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  assert.equal(manifest.objects['home.moonLampHot'].action.type, 'asset.toggle');
  assert.equal(manifest.objects['home.windowWeather'].targetId, 'windowWeather');
  assert.equal(manifest.objects['coffeeCorner.beachEnterHot'].action.target, 'coffeeCornerBeachHandholdSunset');

  const beachIds = [
    'coffeeCornerBeachHandholdSunset',
    'coffeeCornerBeachBraceletPromise',
    'coffeeCornerBeachStallOrder'
  ];
  assert.deepEqual(beachIds.map((id) => manifest.scenes[id].presentation), ['panorama', 'panorama', 'panorama']);
  assert.deepEqual(beachIds.map((id) => manifest.scenes[id].assetKey), [
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ]);
  assert.equal(manifest.objects.coffeeCornerBeachBraceletNextHot.coordinate.x, 0.8816);
});

test('the generic v2 bubble no longer draws the legacy triangle tail', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\.v2-text-port::after/);
  assert.match(css, /\.v2-text-port\s*\{[^}]*border-radius:\s*22px;/s);
});
