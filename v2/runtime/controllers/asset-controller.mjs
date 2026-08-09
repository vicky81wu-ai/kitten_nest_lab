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
  }

  async mount() {
    await super.mount();
    this.image = this.context.elements.sceneImage;
    this.stage = this.context.elements.stage;
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
    this.stage.setAttribute('aria-busy', 'true');
    document.body.dataset.assetStatus = 'loading';

    const previous = {
      src: this.image.getAttribute('src'),
      alt: this.image.alt,
      assetKey: this.image.dataset.assetKey,
      assetRole: this.image.dataset.assetRole
    };
    const failures = [];
    for (const source of sources) {
      try {
        const loaded = await loadStageImage(this.image, source.url, networkTimeoutMs, decodeTimeoutMs);
        this.image.alt = scene.id === 'home'
          ? 'Kitten Nest home'
          : scene.id === 'coffeeCorner'
            ? 'Kitten Nest coffee corner'
            : 'Kitten Nest lap-close scene';
        this.image.dataset.assetKey = resolvedKey;
        this.image.dataset.assetRole = source.role || 'source';
        this.current = { key: resolvedKey, url: source.url, role: source.role || 'source' };
        document.body.dataset.assetStatus = 'ready';
        this.stage.setAttribute('aria-busy', 'false');
        this.context.currentAsset = this.current;
        this.mark('ready', resolvedKey);
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
