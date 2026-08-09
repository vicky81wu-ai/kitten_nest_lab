import { BaseController } from '../core/base-controller.mjs';

export function resolveAssetKey(assets, requestedKey, hour = new Date().getHours()) {
  const card = assets?.[requestedKey];
  if (!card) throw new Error(`Unknown asset key: ${requestedKey}`);
  if (card.strategy !== 'timeOfDay') return requestedKey;
  const dayStart = Number(card.dayStartsAt ?? 7);
  const nightStart = Number(card.nightStartsAt ?? 18);
  return hour >= dayStart && hour < nightStart ? card.dayAsset : card.nightAsset;
}

function loadImage(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let done = false;
    const finish = (callback, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      callback(value);
    };
    const timer = setTimeout(() => finish(reject, new Error(`Asset timeout: ${url}`)), timeoutMs);
    image.decoding = 'async';
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
      } catch {
        // A decoded image is optional after a successful load event.
      }
      finish(resolve, image);
    };
    image.onerror = () => finish(reject, new Error(`Asset failed: ${url}`));
    image.src = url;
  });
}

function waitForStageImage(image, timeoutMs = 4000) {
  if (image.complete && image.naturalWidth && image.naturalHeight) {
    return image.decode ? image.decode().catch(() => {}) : Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (callback, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      callback(value);
    };
    const onLoad = async () => {
      try {
        if (image.decode) await image.decode();
      } catch {
        // The load event already proves the image is usable.
      }
      finish(resolve);
    };
    const onError = () => finish(reject, new Error(`Stage image failed: ${image.src}`));
    const timer = setTimeout(() => finish(reject, new Error(`Stage image timeout: ${image.src}`)), timeoutMs);
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
    this.mark('loading', resolvedKey);
    this.errorBox.hidden = true;
    document.body.dataset.assetStatus = 'loading';

    const failures = [];
    for (const source of sources) {
      try {
        const loaded = await loadImage(source.url, 8000);
        this.image.src = loaded.src;
        await waitForStageImage(this.image);
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
