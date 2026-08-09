import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  resolveAssetKey,
  waitForBestEffortDecode
} from '../../v2/runtime/controllers/asset-controller.mjs';

const assets = {
  'home.auto': {
    strategy: 'timeOfDay',
    dayAsset: 'home.day',
    nightAsset: 'home.night',
    dayStartsAt: 7,
    nightStartsAt: 18
  },
  'home.day': { sources: [] },
  'home.night': { sources: [] }
};

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('time-of-day asset selection stays inside AssetController', () => {
  assert.equal(resolveAssetKey(assets, 'home.auto', 9), 'home.day');
  assert.equal(resolveAssetKey(assets, 'home.auto', 22), 'home.night');
});

test('image decode is a bounded best-effort readiness hint', async () => {
  assert.equal(await waitForBestEffortDecode({}, 5), 'unsupported');
  assert.equal(await waitForBestEffortDecode({ decode: async () => {} }, 5), 'decoded');
  assert.equal(await waitForBestEffortDecode({ decode: async () => { throw new Error('decode failed'); } }, 5), 'failed');
  assert.equal(await waitForBestEffortDecode({ decode: () => new Promise(() => {}) }, 5), 'timeout');
});

test('room images use the public asset library before the protected-preview fallback', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  for (const key of ['home.day', 'home.night', 'coffeeCorner.main']) {
    const [canonical, fallback] = manifest.assets[key].sources;
    assert.equal(canonical.role, 'supabaseCanonical');
    assert.match(canonical.url, /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\/nest-public-assets\//);
    assert.equal(fallback.role, 'staticFallback');
    assert.match(fallback.url, /^\/assets\/rooms\//);
  }
});
