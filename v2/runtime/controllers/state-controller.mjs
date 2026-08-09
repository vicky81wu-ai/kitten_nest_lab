import { BaseController } from '../core/base-controller.mjs';

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}ts=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.error) {
      throw new Error(value?.error || 'Invalid state payload');
    }
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export class StateController extends BaseController {
  constructor(context) {
    super('state', context);
    this.value = null;
    this.source = 'pending';
    this.error = null;
    this.lifecycleReady = false;
    this.refreshPromise = null;
    this.boundRefresh = () => {
      if (this.lifecycleReady) this.refresh('lifecycle');
    };
    this.boundVisibility = () => {
      if (this.lifecycleReady && !document.hidden) this.refresh('visibilitychange');
    };
  }

  async mount() {
    await super.mount();
    window.addEventListener('pageshow', this.boundRefresh);
    window.addEventListener('focus', this.boundRefresh);
    document.addEventListener('visibilitychange', this.boundVisibility);
    this.paintStatus();
  }

  async ready() {
    await this.refresh('initial', { allowFallback: true });
    this.lifecycleReady = true;
    this.mark('ready', this.source);
  }

  async refresh(reason = 'manual', options = {}) {
    if (this.refreshPromise) return this.refreshPromise;
    const refreshPromise = this.runRefresh(reason, options);
    this.refreshPromise = refreshPromise;
    try {
      return await refreshPromise;
    } finally {
      if (this.refreshPromise === refreshPromise) this.refreshPromise = null;
    }
  }

  async runRefresh(reason = 'manual', options = {}) {
    const config = this.context.manifest.runtime.state;
    this.mark('loading', reason);
    try {
      const next = await fetchJson(config.endpoint, config.timeoutMs);
      this.commit(next, 'live', null, reason);
      return next;
    } catch (error) {
      this.error = error;
      if (!this.value && options.allowFallback && config.fallbackUrl) {
        try {
          const fallback = await fetchJson(config.fallbackUrl, config.timeoutMs);
          this.commit(fallback, 'degradedFallback', error, reason);
          return fallback;
        } catch (fallbackError) {
          this.error = fallbackError;
        }
      }
      const hasPreviewFallback = this.value && this.source === 'degradedFallback';
      this.mark(
        hasPreviewFallback ? 'ready' : this.value ? 'stale' : 'error',
        hasPreviewFallback ? this.source : this.error?.message || 'state unavailable'
      );
      this.paintStatus();
      return this.value;
    }
  }

  commit(value, source, error, reason) {
    const previous = this.value;
    this.value = clone(value);
    this.source = source;
    this.error = error || null;
    this.mark('ready', source);
    this.paintStatus();
    this.context.events.emit('state:change', {
      state: this.get(),
      previousState: previous,
      source,
      reason,
      error: error?.message || ''
    });
  }

  paintStatus() {
    document.body.dataset.stateSource = this.source;
    const notice = this.context.elements.sourceNotice;
    if (!notice) return;
    notice.hidden = this.source !== 'degradedFallback';
  }

  get() {
    return this.value ? clone(this.value) : null;
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
  }

  async suspend(reason = 'suspend') {
    this.mark('suspended', reason);
  }

  async destroy() {
    this.lifecycleReady = false;
    window.removeEventListener('pageshow', this.boundRefresh);
    window.removeEventListener('focus', this.boundRefresh);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    await super.destroy();
  }
}
