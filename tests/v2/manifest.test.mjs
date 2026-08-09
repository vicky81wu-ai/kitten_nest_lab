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
