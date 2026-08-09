import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  loadStageImage,
  nextToggleAssetKey,
  resolveAssetKey,
  resolveScenePresentation,
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

class FakeStageImage extends EventTarget {
  constructor(result = 'load') {
    super();
    this.result = result;
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  set src(value) {
    this.currentSrc = value;
    if (this.result === 'pending') return;
    queueMicrotask(() => {
      this.complete = true;
      if (this.result === 'load') {
        this.naturalWidth = 852;
        this.naturalHeight = 1846;
      }
      this.dispatchEvent(new Event(this.result));
    });
  }

  get src() {
    return this.currentSrc || '';
  }

  async decode() {}
}

test('time-of-day asset selection stays inside AssetController', () => {
  assert.equal(resolveAssetKey(assets, 'home.auto', 9), 'home.day');
  assert.equal(resolveAssetKey(assets, 'home.auto', 22), 'home.night');
});

test('manual moon toggles and scene presentation remain pure manifest decisions', () => {
  assert.equal(nextToggleAssetKey('home.day', ['home.day', 'home.night']), 'home.night');
  assert.equal(nextToggleAssetKey('home.night', ['home.day', 'home.night']), 'home.day');
  assert.equal(resolveScenePresentation({ presentation: 'panorama' }), 'panorama');
  assert.equal(resolveScenePresentation({}), 'cover');
});

test('image decode is a bounded best-effort readiness hint', async () => {
  assert.equal(await waitForBestEffortDecode({}, 5), 'unsupported');
  assert.equal(await waitForBestEffortDecode({ decode: async () => {} }, 5), 'decoded');
  assert.equal(await waitForBestEffortDecode({ decode: async () => { throw new Error('decode failed'); } }, 5), 'failed');
  assert.equal(await waitForBestEffortDecode({ decode: () => new Promise(() => {}) }, 5), 'timeout');
});

test('asset loading uses the retained stage image instead of a detached preloader', async () => {
  const stageImage = new FakeStageImage('load');
  const loaded = await loadStageImage(stageImage, 'https://assets.example/home.jpg', 20, 5);
  assert.equal(loaded, stageImage);
  assert.equal(stageImage.src, 'https://assets.example/home.jpg');
  assert.equal(stageImage.naturalWidth, 852);

  await assert.rejects(
    loadStageImage(new FakeStageImage('error'), 'https://assets.example/broken.jpg', 20, 5),
    /Asset failed/
  );
  await assert.rejects(
    loadStageImage(new FakeStageImage('pending'), 'https://assets.example/pending.jpg', 5, 5),
    /Asset network timeout/
  );
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

test('large nested scenes warm a same-origin cache before their canonical Storage fallback', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const keys = [
    'coffeeCorner.lapClose',
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ];
  keys.forEach((key) => {
    const [sameOrigin, canonical] = manifest.assets[key].sources;
    assert.equal(sameOrigin.role, 'sameOriginCache');
    assert.match(sameOrigin.url, /^\/api\/app-assets\?sceneAsset=/);
    assert.equal(canonical.role, 'supabaseCanonical');
    assert.match(canonical.url, /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\//);
    assert.equal(manifest.assets[key].networkTimeoutMs, 30000);
  });
  assert.deepEqual(manifest.scenes.coffeeCorner.warmAssetKeys, ['coffeeCorner.beachHandholdSunset']);
  assert.deepEqual(
    manifest.scenes.coffeeCornerBeachHandholdSunset.warmAssetKeys,
    ['coffeeCorner.beachBraceletPromise']
  );
  assert.deepEqual(
    manifest.scenes.coffeeCornerBeachBraceletPromise.warmAssetKeys,
    ['coffeeCorner.beachStallOrder']
  );
});

test('asset loading hides progressive image paint behind the loading veil', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.match(
    css,
    /body\[data-asset-status="loading"\]\s+\.v2-stage\[data-transitioning="1"\]\s+\.v2-stage__image\s*\{[^}]*opacity:\s*0/s
  );
  assert.match(css, /body\[data-scene-presentation="panorama"\]\s+\.v2-scene-viewport\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.v2-stage\[data-transitioning="1"\]\s+\[data-requires-layout="1"\]\s*\{[^}]*opacity:\s*0/s);
});
