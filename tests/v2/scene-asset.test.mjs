import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, '../../api');
const repositoryRoot = path.resolve(testDirectory, '../..');
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(repositoryRoot, relativePath), 'utf8'));

test('beach scenes use small same-origin WebP delivery variants before canonical Storage originals', async () => {
  const manifest = await readJson('v2/data/nest-manifest.v2.json');
  const keys = [
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ];
  for (const key of keys) {
    const [delivery, canonical] = manifest.assets[key].sources;
    assert.equal(delivery.role, 'staticOptimized');
    assert.match(delivery.url, /^\/assets\/rooms\/coffee-corner\/beach\/.+\.webp$/);
    assert.equal(canonical.role, 'supabaseCanonical');
    assert.match(canonical.url, /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\//);
    const bytes = await readFile(path.join(repositoryRoot, delivery.url));
    assert.ok(bytes.length < 400_000, `${key} should stay below 400 KB`);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
  }
});

test('optimized beach delivery variants retain the full 1536 by 1024 panorama', async () => {
  const manifest = await readJson('v2/data/nest-manifest.v2.json');
  for (const key of [
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ]) {
    const bytes = await readFile(path.join(repositoryRoot, manifest.assets[key].sources[0].url));
    const signature = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    assert.ok(signature > 0, `${key} should contain a VP8 frame`);
    assert.equal(bytes.readUInt16LE(signature + 3) & 0x3fff, 1536);
    assert.equal(bytes.readUInt16LE(signature + 5) & 0x3fff, 1024);
  }
});

test('static scene delivery does not consume another Vercel function slot', async () => {
  const functions = (await readdir(apiDirectory)).filter((name) => name.endsWith('.js'));
  assert.equal(functions.length, 12);
  assert.equal(functions.includes('scene-asset.js'), false);
});
