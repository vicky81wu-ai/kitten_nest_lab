import { BaseController } from '../core/base-controller.mjs';
import { readLegacyMemorySlots } from '../core/legacy-memory-source.mjs';

export function localImageSource(value, urlApi = globalThis.URL) {
  if (typeof Blob !== 'undefined' && value instanceof Blob && urlApi?.createObjectURL) {
    return { url: urlApi.createObjectURL(value), role: 'indexeddbLocalOverride', ownedLocalUrl: true };
  }
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return { url: value, role: 'indexeddbLocalOverride', ownedLocalUrl: false };
  }
  return null;
}

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

export async function fetchWarmImageBlob(url, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Asset warming requires fetch');
  const response = await fetchImpl(url, {
    cache: 'force-cache',
    credentials: 'same-origin',
    signal: options.signal
  });
  if (!response.ok) throw new Error(`Asset warm failed: ${url} returned HTTP ${response.status}`);
  const blob = await response.blob();
  if (!blob?.size) throw new Error(`Asset warm failed: ${url} returned an empty body`);
  if (blob.type && !blob.type.startsWith('image/')) {
    throw new Error(`Asset warm failed: ${url} returned ${blob.type}`);
  }
  return blob;
}

export class AssetController extends BaseController {
  constructor(context) {
    super('asset', context);
    this.current = null;
    this.loading = false;
    this.warmEntries = new Map();
    this.localObjectUrl = null;
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

  settleWarmEntry(entry, value) {
    if (entry.settled) return;
    entry.settled = true;
    clearTimeout(entry.timer);
    clearTimeout(entry.timeout);
    entry.timer = null;
    entry.timeout = null;
    entry.resolve(value);
  }

  async startWarmEntry(entry) {
    if (entry.settled) return;
    entry.timer = null;
    entry.controller = new AbortController();
    const sourceTimeout = Number(entry.source.networkTimeoutMs ?? 8000);
    const timeoutMs = Math.max(1000, Math.min(sourceTimeout, 8000));
    entry.timeout = setTimeout(() => entry.controller.abort(), timeoutMs);
    try {
      const blob = await fetchWarmImageBlob(entry.source.url, { signal: entry.controller.signal });
      if (this.warmEntries.get(entry.key) !== entry) {
        this.settleWarmEntry(entry, null);
        return;
      }
      const url = globalThis.URL?.createObjectURL?.(blob);
      if (!url) throw new Error('Asset warming could not create a local URL');
      const warmedSource = {
        url,
        role: 'warmedStaticCache',
        ownedLocalUrl: true,
        networkTimeoutMs: 3000
      };
      this.settleWarmEntry(entry, warmedSource);
      this.mark('ready', `${this.current?.key || 'scene'}; warmed ${entry.key}`);
    } catch {
      if (this.warmEntries.get(entry.key) === entry) this.warmEntries.delete(entry.key);
      this.settleWarmEntry(entry, null);
    }
  }

  scheduleWarmAsset(key, delayMs = 120) {
    const source = this.context.manifest.assets?.[key]?.sources?.[0];
    if (!key || !source?.url || typeof globalThis.fetch !== 'function' || key === this.current?.key) return;
    if (this.warmEntries.has(key)) return;
    let resolve;
    const entry = {
      key,
      source,
      timer: null,
      timeout: null,
      controller: null,
      settled: false,
      resolve: null,
      promise: null
    };
    entry.promise = new Promise((done) => { resolve = done; });
    entry.resolve = resolve;
    entry.timer = setTimeout(() => this.startWarmEntry(entry), delayMs);
    this.warmEntries.set(key, entry);
  }

  async cancelWarmEntry(key, entry = this.warmEntries.get(key)) {
    if (!entry) return;
    if (this.warmEntries.get(key) === entry) this.warmEntries.delete(key);
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
      this.settleWarmEntry(entry, null);
    } else if (!entry.settled) {
      entry.controller?.abort();
    }
    const source = await entry.promise.catch(() => null);
    if (source?.ownedLocalUrl) this.revokeLocalUrl(source.url);
  }

  async consumeWarmSource(key, waitMs = 900) {
    const entry = this.warmEntries.get(key);
    if (!entry) return null;
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
      this.startWarmEntry(entry);
    }
    let timeout;
    const source = await Promise.race([
      entry.promise,
      new Promise((resolve) => { timeout = setTimeout(() => resolve(null), waitMs); })
    ]);
    clearTimeout(timeout);
    if (source) {
      if (this.warmEntries.get(key) === entry) this.warmEntries.delete(key);
      return source;
    }
    await this.cancelWarmEntry(key, entry);
    return null;
  }

  warmTimeOfDayAlternate(requestedKey, resolvedKey) {
    const strategy = this.context.manifest.assets?.[requestedKey];
    if (strategy?.strategy !== 'timeOfDay') return;
    const alternateKey = resolvedKey === strategy.dayAsset ? strategy.nightAsset : strategy.dayAsset;
    this.scheduleWarmAsset(alternateKey, 80);
  }

  warmSceneHint(scene) {
    const key = Array.isArray(scene?.warmAssetKeys) ? scene.warmAssetKeys[0] : null;
    this.scheduleWarmAsset(key, 120);
  }

  async resolveLocalSource(card) {
    if (!card?.localKey) return null;
    const result = await readLegacyMemorySlots({ keys: [card.localKey] });
    return localImageSource(result.slots?.[0]);
  }

  revokeLocalUrl(url) {
    if (!url || typeof globalThis.URL?.revokeObjectURL !== 'function') return;
    try { globalThis.URL.revokeObjectURL(url); } catch {}
  }

  async loadAssetKey(scene, requestedKey) {
    if (this.loading) return { ok: false, key: requestedKey, error: 'Asset controller is busy' };
    this.loading = true;
    const assets = this.context.manifest.assets;
    const resolvedKey = resolveAssetKey(assets, requestedKey);
    const card = assets[resolvedKey];
    const localSource = await this.resolveLocalSource(card).catch(() => null);
    const warmSource = await this.consumeWarmSource(resolvedKey, localSource ? 0 : 900);
    const sources = [
      ...(localSource ? [localSource] : []),
      ...(warmSource ? [warmSource] : []),
      ...(Array.isArray(card.sources) ? card.sources : [])
    ];
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
          const sourceNetworkTimeoutMs = Number(source.networkTimeoutMs ?? networkTimeoutMs);
          await loadStageImage(this.image, source.url, sourceNetworkTimeoutMs, decodeTimeoutMs);
          this.image.alt = scene.alt || `Kitten Nest ${scene.id}`;
          this.image.dataset.assetKey = resolvedKey;
          this.image.dataset.assetRole = source.role || 'source';
          this.current = {
            key: resolvedKey,
            url: source.url,
            role: source.role || 'source',
            presentation: this.applyPresentation(scene)
          };
          const previousLocalUrl = this.localObjectUrl;
          this.localObjectUrl = source.ownedLocalUrl ? source.url : null;
          if (previousLocalUrl && previousLocalUrl !== this.localObjectUrl) {
            this.revokeLocalUrl(previousLocalUrl);
          }
          document.body.dataset.assetStatus = 'ready';
          document.body.dataset.assetVariant = resolvedKey;
          this.stage.setAttribute('aria-busy', 'false');
          this.context.currentAsset = this.current;
          this.mark('ready', resolvedKey);
          this.warmTimeOfDayAlternate(requestedKey, resolvedKey);
          this.warmSceneHint(scene);
          return { ok: true, ...this.current };
        } catch (error) {
          failures.push(error.message);
          if (source.ownedLocalUrl) this.revokeLocalUrl(source.url);
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

  async refreshLocalKey(key) {
    const snapshot = this.context.currentSnapshot;
    const currentCard = this.context.manifest.assets?.[this.current?.key];
    if (!snapshot || currentCard?.localKey !== key || this.loading) return false;
    const result = await this.loadAssetKey(snapshot.scene, this.current.key);
    if (result.ok) await this.context.controllers.get('layout').reconcile(snapshot, 'local-asset-refresh');
    return result.ok;
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
  }

  async suspend(reason = 'suspend') {
    this.mark('suspended', reason);
  }

  async destroy() {
    await Promise.all(
      [...this.warmEntries.entries()].map(([key, entry]) => this.cancelWarmEntry(key, entry))
    );
    this.warmEntries.clear();
    this.revokeLocalUrl(this.localObjectUrl);
    this.localObjectUrl = null;
    this.image?.removeAttribute('src');
    await super.destroy();
  }
}
