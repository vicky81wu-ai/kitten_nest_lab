import { BaseController } from '../core/base-controller.mjs';

export function resolveAssetKey(assets, requestedKey, hour = new Date().getHours()) {
  const card = assets?.[requestedKey];
  if (!card) throw new Error(`Unknown asset key: ${requestedKey}`);
  if (card.strategy !== 'timeOfDay') return requestedKey;
  const dayStart = Number(card.dayStartsAt ?? 7);
  const nightStart = Number(card.nightStartsAt ?? 18);
  return hour >= dayStart && hour < nightStart ? card.dayAsset : card.nightAsset;
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

function loadImage(url, timeoutMs = 20000, decodeTimeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let done = false;
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
    };
    const finish = (callback, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      callback(value);
    };
    const timer = setTimeout(() => {
      finish(reject, new Error(`Asset network timeout: ${url}`));
      image.src = '';
    }, timeoutMs);
    image.decoding = 'async';
    image.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      waitForBestEffortDecode(image, decodeTimeoutMs).then(() => resolve(image));
    };
    image.onerror = () => finish(reject, new Error(`Asset failed: ${url}`));
    image.src = url;
  });
}

function waitForStageImage(image, timeoutMs = 20000, decodeTimeoutMs = 1200) {
  if (image.complete && image.naturalWidth && image.naturalHeight) {
    return waitForBestEffortDecode(image, decodeTimeoutMs).then(() => {});
  }
  if (image.complete && image.src) {
    return Promise.reject(new Error(`Stage image failed: ${image.src}`));
  }
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
    const onLoad = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      waitForBestEffortDecode(image, decodeTimeoutMs).then(() => resolve());
    };
    const onError = () => finish(reject, new Error(`Stage image failed: ${image.src}`));
    const timer = setTimeout(() => finish(reject, new Error(`Stage image network timeout: ${image.src}`)), timeoutMs);
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  });
}

export class AssetController extends BaseController {
  constructor(context) {
    super('asset', context);
    this.current = null;
  }

  async mount() {
    await super.mount();
    this.image = this.context.elements.sceneImage;
    this.errorBox = this.context.elements.assetError;
  }

  async ready() {
    this.mark('ready');
  }

  async loadForScene(scene) {
    const assets = this.context.manifest.assets;
    const resolvedKey = resolveAssetKey(assets, scene.assetKey);
    const card = assets[resolvedKey];
    const sources = Array.isArray(card.sources) ? card.sources : [];
    const networkTimeoutMs = Number(card.networkTimeoutMs ?? 20000);
    const decodeTimeoutMs = Number(card.decodeTimeoutMs ?? 1200);
    this.mark('loading', resolvedKey);
    this.errorBox.hidden = true;
    document.body.dataset.assetStatus = 'loading';

    const failures = [];
    for (const source of sources) {
      try {
        const loaded = await loadImage(source.url, networkTimeoutMs, decodeTimeoutMs);
        this.image.src = loaded.src;
        await waitForStageImage(this.image, networkTimeoutMs, decodeTimeoutMs);
        this.image.alt = scene.id === 'home'
          ? 'Kitten Nest home'
          : scene.id === 'coffeeCorner'
            ? 'Kitten Nest coffee corner'
            : 'Kitten Nest lap-close scene';
        this.image.dataset.assetKey = resolvedKey;
        this.image.dataset.assetRole = source.role || 'source';
        this.current = { key: resolvedKey, url: source.url, role: source.role || 'source' };
        document.body.dataset.assetStatus = 'ready';
        this.context.currentAsset = this.current;
        this.mark('ready', resolvedKey);
        return { ok: true, ...this.current };
      } catch (error) {
        failures.push(error.message);
      }
    }

    const message = failures.join(' · ') || `No sources for ${resolvedKey}`;
    document.body.dataset.assetStatus = 'error';
    this.errorBox.hidden = false;
    this.errorBox.querySelector('[data-asset-error-message]').textContent = message;
    this.mark('error', message);
    return { ok: false, key: resolvedKey, error: message };
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
  }

  async suspend(reason = 'suspend') {
    this.mark('suspended', reason);
  }

  async destroy() {
    this.image?.removeAttribute('src');
    await super.destroy();
  }
}
