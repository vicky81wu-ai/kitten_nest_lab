import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AssetController,
  fetchWarmImageBlob,
  loadStageImage,
  localImageSource,
  nextToggleAssetKey,
  retireCrossfadeLayer,
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
    this.dataset = {};
    this.hidden = false;
    this.alt = '';
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

  getAttribute(name) {
    return name === 'src' ? (this.currentSrc || null) : null;
  }

  removeAttribute(name) {
    if (name === 'src') this.currentSrc = '';
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

test('a device-local room image becomes the first asset source', () => {
  const revoked = [];
  const source = localImageSource(new Blob(['image'], { type: 'image/png' }), {
    createObjectURL: () => 'blob:kitten-room',
    revokeObjectURL: (url) => revoked.push(url)
  });
  assert.deepEqual(source, {
    url: 'blob:kitten-room',
    role: 'indexeddbLocalOverride',
    ownedLocalUrl: true
  });
  assert.deepEqual(revoked, []);
});

test('image decode is a bounded best-effort readiness hint', async () => {
  assert.equal(await waitForBestEffortDecode({}, 5), 'unsupported');
  assert.equal(await waitForBestEffortDecode({ decode: async () => {} }, 5), 'decoded');
  assert.equal(await waitForBestEffortDecode({ decode: async () => { throw new Error('decode failed'); } }, 5), 'failed');
  assert.equal(await waitForBestEffortDecode({ decode: () => new Promise(() => {}) }, 5), 'timeout');
});

test('crossfade overlay stays composited until its handoff fade has finished', async () => {
  const transition = new FakeStageImage('pending');
  transition.src = '/night.webp';
  transition.dataset.visible = '1';

  const retirement = retireCrossfadeLayer(transition, 100);
  assert.equal(transition.dataset.visible, '0');
  assert.equal(transition.hidden, false);
  assert.equal(transition.src, '/night.webp');

  transition.dispatchEvent(new Event('transitionend'));
  await retirement;
  assert.equal(transition.hidden, true);
  assert.equal(transition.src, '');
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

test('asset warming fetches and consumes image bytes without a detached Image element', async () => {
  const calls = [];
  const blob = await fetchWarmImageBlob('/assets/rooms/home/day.webp', {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(['webp-bytes'], { type: 'image/webp' })
      };
    }
  });
  assert.equal(blob.type, 'image/webp');
  assert.equal(blob.size, 10);
  assert.equal(calls[0].url, '/assets/rooms/home/day.webp');
  assert.equal(calls[0].options.cache, 'force-cache');

  const source = await readFile(new URL('../../v2/runtime/controllers/asset-controller.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new Image\s*\(/);
  assert.match(source, /role:\s*'warmedStaticCache'/);
});

test('a first scene tap consumes one in-flight warm request instead of starting a second image load', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  let releaseFetch;
  globalThis.fetch = (_url, options) => {
    fetchCalls += 1;
    return new Promise((resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      releaseFetch = () => resolve({
        ok: true,
        status: 200,
        blob: async () => new Blob(['beach'], { type: 'image/webp' })
      });
    });
  };
  const controller = new AssetController({
    manifest: {
      assets: {
        beach: {
          sources: [{ url: '/assets/beach.webp', role: 'staticOptimized', networkTimeoutMs: 1000 }]
        }
      }
    },
    setControllerStatus: () => {}
  });

  try {
    controller.scheduleWarmAsset('beach', 10_000);
    const consumed = controller.consumeWarmSource('beach', 200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(fetchCalls, 1);
    releaseFetch();
    const source = await consumed;
    assert.equal(source.role, 'warmedStaticCache');
    assert.equal(fetchCalls, 1);
    assert.equal(controller.warmEntries.has('beach'), false);
    controller.revokeLocalUrl(source.url);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a stalled warm request is aborted before direct scene loading can continue', async () => {
  const originalFetch = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener('abort', () => {
      aborted = true;
      reject(new Error('aborted'));
    }, { once: true });
  });
  const controller = new AssetController({
    manifest: {
      assets: {
        beach: {
          sources: [{ url: '/assets/beach.webp', role: 'staticOptimized', networkTimeoutMs: 1000 }]
        }
      }
    },
    setControllerStatus: () => {}
  });

  try {
    controller.scheduleWarmAsset('beach', 10_000);
    const source = await controller.consumeWarmSource('beach', 5);
    assert.equal(source, null);
    assert.equal(aborted, true);
    assert.equal(controller.warmEntries.has('beach'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('asset loading releases its busy lock when source preparation throws', async () => {
  const controller = new AssetController({
    manifest: {
      assets: {
        home: { sources: [{ url: '/assets/home.webp', role: 'staticOptimized' }] }
      }
    },
    setControllerStatus: () => {}
  });
  controller.consumeWarmSource = async () => {
    throw new Error('warm source preparation failed');
  };

  await assert.rejects(
    controller.loadAssetKey({ id: 'home' }, 'home'),
    /warm source preparation failed/
  );
  assert.equal(controller.loading, false);
});

test('production room images use small same-origin WebP delivery before Storage originals', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  for (const key of ['home.day', 'home.night', 'coffeeCorner.main']) {
    const [delivery, canonical, fallback] = manifest.assets[key].sources;
    assert.equal(delivery.role, 'staticOptimized');
    assert.match(delivery.url, /^\/assets\/rooms\/.+\.webp$/);
    const bytes = await readFile(new URL(`../../${delivery.url.slice(1)}`, import.meta.url));
    assert.ok(bytes.length < 300_000, `${key} should stay below 300 KB`);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
    assert.equal(canonical.role, 'supabaseCanonical');
    assert.match(canonical.url, /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\/nest-public-assets\//);
    assert.equal(fallback.role, 'staticFallback');
    assert.match(fallback.url, /^\/assets\/rooms\//);
  }
  assert.equal(manifest.assets['home.day'].localKey, 'homeOn');
  assert.equal(manifest.assets['home.night'].localKey, 'homeOff');
  assert.equal(manifest.assets['coffeeCorner.main'].localKey, 'gameRoom');
});

test('nested scenes warm a same-origin static delivery asset before their canonical Storage fallback', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const keys = [
    'coffeeCorner.lapClose',
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ];
  keys.forEach((key) => {
    const [sameOrigin, canonical] = manifest.assets[key].sources;
    assert.match(sameOrigin.role, /^static(?:Primary|Optimized)$/);
    assert.match(sameOrigin.url, /^\/assets\/rooms\//);
    assert.equal(canonical.role, 'supabaseCanonical');
    assert.match(canonical.url, /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\//);
    assert.equal(manifest.assets[key].networkTimeoutMs, 15000);
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

test('moon toggle crossfades two retained images and commits only after both are ready', async () => {
  const originalDocument = globalThis.document;
  const originalMatchMedia = globalThis.matchMedia;
  globalThis.document = { body: { dataset: {} } };
  globalThis.matchMedia = () => ({ matches: true });

  const primary = new FakeStageImage('load');
  primary.src = '/day.webp';
  await new Promise((resolve) => setTimeout(resolve, 0));
  primary.dataset.assetKey = 'home.day';
  primary.dataset.assetRole = 'staticOptimized';
  const transition = new FakeStageImage('load');
  const stage = {
    dataset: {},
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const errorMessage = { textContent: '' };
  const controller = new AssetController({
    manifest: {
      assets: {
        'home.night': {
          sources: [{ url: '/night.webp', role: 'staticOptimized' }]
        }
      }
    },
    currentAsset: null,
    setControllerStatus: () => {}
  });
  controller.image = primary;
  controller.transitionImage = transition;
  controller.stage = stage;
  controller.errorBox = {
    hidden: true,
    querySelector: () => errorMessage
  };
  controller.current = { key: 'home.day', url: '/day.webp', role: 'staticOptimized' };

  try {
    const result = await controller.crossfadeAssetKey({ id: 'home', presentation: 'cover' }, 'home.night');
    assert.equal(result.ok, true);
    assert.equal(primary.src, '/night.webp');
    assert.equal(primary.dataset.assetKey, 'home.night');
    assert.equal(transition.hidden, true);
    assert.equal(transition.src, '');
    assert.equal(globalThis.document.body.dataset.assetVariant, 'home.night');
    assert.equal(stage.dataset.assetToggle, 'ready');
    assert.equal(stage.attributes['aria-busy'], 'false');
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalMatchMedia === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = originalMatchMedia;
  }
});
