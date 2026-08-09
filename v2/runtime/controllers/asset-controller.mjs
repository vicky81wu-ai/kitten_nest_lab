import { BaseController } from '../core/base-controller.mjs';

export function resolveAssetKey(assets, requestedKey, hour = new Date().getHours()) {
  const card = assets?.[requestedKey];
  if (!card) throw new Error(`Unknown asset key: ${requestedKey}`);
  if (card.strategy !== 'timeOfDay') return requestedKey;
  const dayStart = Number(card.dayStartsAt ?? 7);
  const nightStart = Number(card.nightStartsAt ?? 18);
  return hour >= dayStart && hour < nightStart ? card.dayAsset : card.nightAsset;
}

export function nextToggleAssetKey(currentKey, keys = []) {
  const candidates = [...new Set(keys.filter(Boolean))];
  if (!candidates.length) throw new Error('asset.toggle requires at least one asset key');
  const index = candidates.indexOf(currentKey);
  return candidates[(index + 1 + candidates.length) % candidates.length];
}

export function resolveScenePresentation(scene) {
  return scene?.presentation === 'panorama' ? 'panorama' : 'cover';
}

export function waitForBestEffortDecode(image, timeoutMs = 1200) {
  if (!image || typeof image.decode !== 'function') return Promise.resolve('unsupported');
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(status);
    };
    const timer = setTimeout(() => finish('timeout'), timeoutMs);
    Promise.resolve()
      .then(() => image.decode())
      .then(() => finish('decoded'))
      .catch(() => finish('failed'));
  });
}

export function loadStageImage(image, url, timeoutMs = 20000, decodeTimeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    };
    const finish = (callback, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      callback(value);
    };
    const onLoad = async () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error(`Asset has no dimensions: ${url}`));
        return;
      }
      await waitForBestEffortDecode(image, decodeTimeoutMs);
      resolve(image);
    };
    const onError = () => finish(reject, new Error(`Asset failed: ${url}`));
    const timer = setTimeout(() => finish(reject, new Error(`Asset network timeout: ${url}`)), timeoutMs);
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
    image.decoding = 'async';
    image.src = url;
    if (image.complete && image.naturalWidth && image.naturalHeight) {
      queueMicrotask(onLoad);
    }
  });
}

export class AssetController extends BaseController {
  constructor(context) {
    super('asset', context);
    this.current = null;
    this.loading = false;
    this.warmTimer = null;
    this.warmImage = null;
  }

  async mount() {
    await super.mount();
    this.image = this.context.elements.sceneImage;
    this.stage = this.context.elements.stage;
    this.viewport = this.context.elements.sceneViewport;
    this.errorBox = this.context.elements.assetError;
  }

  async ready() {
    this.mark('ready');
  }

  applyPresentation(scene) {
    const presentation = resolveScenePresentation(scene);
    document.body.dataset.scenePresentation = presentation;
    this.stage.dataset.scenePresentation = presentation;
    if (this.viewport) this.viewport.scrollLeft = 0;
    return presentation;
  }

  warmTimeOfDayAlternate(requestedKey, resolvedKey) {
    const strategy = this.context.manifest.assets?.[requestedKey];
    if (strategy?.strategy !== 'timeOfDay' || typeof Image === 'undefined') return;
    const alternateKey = resolvedKey === strategy.dayAsset ? strategy.nightAsset : strategy.dayAsset;
    const source = this.context.manifest.assets?.[alternateKey]?.sources?.[0];
    if (!source?.url) return;
    clearTimeout(this.warmTimer);
    this.warmTimer = setTimeout(() => {
      const image = new Image();
      image.decoding = 'async';
      image.src = source.url;
      this.warmImage = image;
    }, 80);
  }

  async loadAssetKey(scene, requestedKey) {
    if (this.loading) return { ok: false, key: requestedKey, error: 'Asset controller is busy' };
    this.loading = true;
    const assets = this.context.manifest.assets;
    const resolvedKey = resolveAssetKey(assets, requestedKey);
    const card = assets[resolvedKey];
    const sources = Array.isArray(card.sources) ? card.sources : [];
    const networkTimeoutMs = Number(card.networkTimeoutMs ?? 20000);
    const decodeTimeoutMs = Number(card.decodeTimeoutMs ?? 1200);
    this.mark('loading', resolvedKey);
    this.errorBox.hidden = true;
    this.stage.setAttribute('aria-busy', 'true');
    document.body.dataset.assetStatus = 'loading';

    const previous = {
      src: this.image.getAttribute('src'),
      alt: this.image.alt,
      assetKey: this.image.dataset.assetKey,
      assetRole: this.image.dataset.assetRole
    };
    const failures = [];
    try {
      for (const source of sources) {
        try {
          await loadStageImage(this.image, source.url, networkTimeoutMs, decodeTimeoutMs);
          this.image.alt = scene.alt || `Kitten Nest ${scene.id}`;
          this.image.dataset.assetKey = resolvedKey;
          this.image.dataset.assetRole = source.role || 'source';
          this.current = {
            key: resolvedKey,
            url: source.url,
            role: source.role || 'source',
            presentation: this.applyPresentation(scene)
          };
          document.body.dataset.assetStatus = 'ready';
          document.body.dataset.assetVariant = resolvedKey;
          this.stage.setAttribute('aria-busy', 'false');
          this.context.currentAsset = this.current;
          this.mark('ready', resolvedKey);
          this.warmTimeOfDayAlternate(requestedKey, resolvedKey);
          return { ok: true, ...this.current };
        } catch (error) {
          failures.push(error.message);
        }
      }

      const message = failures.join(' · ') || `No sources for ${resolvedKey}`;
      if (previous.src) this.image.src = previous.src;
      else this.image.removeAttribute('src');
      this.image.alt = previous.alt;
      if (previous.assetKey) this.image.dataset.assetKey = previous.assetKey;
      else delete this.image.dataset.assetKey;
      if (previous.assetRole) this.image.dataset.assetRole = previous.assetRole;
      else delete this.image.dataset.assetRole;
      document.body.dataset.assetStatus = 'error';
      this.stage.setAttribute('aria-busy', 'false');
      this.errorBox.hidden = false;
      this.errorBox.querySelector('[data-asset-error-message]').textContent = message;
      this.mark('error', message);
      return { ok: false, key: resolvedKey, error: message };
    } finally {
      this.loading = false;
    }
  }

  async loadForScene(scene) {
    return this.loadAssetKey(scene, scene.assetKey);
  }

  async toggle(action) {
    const snapshot = this.context.currentSnapshot;
    if (!snapshot || this.loading) return false;
    const keys = Array.isArray(action?.keys) ? action.keys : [];
    keys.forEach((key) => {
      if (!this.context.manifest.assets[key]) throw new Error(`Unknown toggle asset key: ${key}`);
    });
    const nextKey = nextToggleAssetKey(this.current?.key, keys);
    const layout = this.context.controllers.get('layout');
    await layout.suspend('asset-toggle');
    this.stage.dataset.transitioning = '1';
    document.body.dataset.sceneLocked = '1';
    try {
      const result = await this.loadAssetKey(snapshot.scene, nextKey);
      if (!result.ok) {
        await layout.reconcile(snapshot, 'asset-toggle-restore');
        return false;
      }
      await layout.reconcile(snapshot, 'asset-toggle');
      return true;
    } finally {
      this.stage.dataset.transitioning = '0';
      document.body.dataset.sceneLocked = '0';
    }
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
  }

  async suspend(reason = 'suspend') {
    this.mark('suspended', reason);
  }

  async destroy() {
    clearTimeout(this.warmTimer);
    this.warmImage = null;
    this.image?.removeAttribute('src');
    await super.destroy();
  }
}
