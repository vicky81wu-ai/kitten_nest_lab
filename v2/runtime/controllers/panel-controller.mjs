import { BaseController } from '../core/base-controller.mjs';
import { resolveWeatherState, weatherAdvice } from '../core/weather-state.mjs';

function appendText(parent, tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

export class PanelController extends BaseController {
  constructor(context) {
    super('panel', context);
    this.openId = null;
    this.previousFocus = null;
    this.boundClick = (event) => this.handleClick(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.panelLayer;
    this.card = this.layer.querySelector('[data-panel-card]');
    this.title = this.layer.querySelector('[data-panel-title]');
    this.body = this.layer.querySelector('[data-panel-body]');
    this.closeButton = this.layer.querySelector('[data-panel-close]');
    this.layer.addEventListener('click', this.boundClick);
    this.unsubscribeState = this.context.events.on('state:change', () => {
      if (this.openId) this.render(this.context.manifest.objects[this.openId]);
    });
  }

  async ready() {
    this.mark('ready');
  }

  allowed(id) {
    return this.context.currentSnapshot?.allowedObjectIds?.includes(id) || false;
  }

  open(id) {
    const object = this.context.manifest.objects[id];
    if (!object || object.kind !== 'panel' || !this.allowed(id)) return false;
    this.previousFocus = document.activeElement;
    this.openId = id;
    this.layer.hidden = false;
    this.layer.dataset.open = '1';
    this.card.dataset.panelId = id;
    this.render(object);
    requestAnimationFrame(() => this.closeButton.focus());
    return true;
  }

  close() {
    if (!this.openId) return false;
    this.openId = null;
    this.layer.dataset.open = '0';
    this.layer.hidden = true;
    this.card.removeAttribute('data-panel-id');
    if (this.previousFocus?.focus) this.previousFocus.focus();
    this.previousFocus = null;
    return true;
  }

  render(object) {
    if (!object) return;
    this.title.textContent = object.title || object.id;
    this.body.replaceChildren();

    if (object.variant === 'stateText') {
      const state = this.context.controllers.get('state').get() || {};
      appendText(
        this.body,
        'p',
        'v2-panel__note',
        String(state[object.stateField] || object.emptyText || '')
      );
      appendText(
        this.body,
        'p',
        'v2-panel__meta',
        `source: ${this.context.controllers.get('state').source}`
      );
      return;
    }

    if (object.variant === 'weatherAdvice') {
      const state = this.context.controllers.get('state').get() || {};
      const weather = resolveWeatherState(state, object);
      const meta = document.createElement('div');
      meta.className = 'v2-weather-panel__meta';
      appendText(meta, 'span', 'v2-weather-panel__pill', weather.temperature);
      appendText(meta, 'span', 'v2-weather-panel__pill', weather.description);
      this.body.appendChild(meta);
      appendText(this.body, 'p', 'v2-panel__note', weatherAdvice(weather));
      appendText(
        this.body,
        'p',
        'v2-panel__meta',
        `source: ${this.context.controllers.get('state').source}`
      );
      return;
    }

    if (object.variant === 'diagnostics') {
      const scene = this.context.currentSnapshot?.sceneId || 'booting';
      const asset = this.context.currentAsset?.key || 'none';
      const state = this.context.controllers.get('state');
      appendText(this.body, 'p', 'v2-panel__meta', `scene ${scene} · asset ${asset} · state ${state.source}`);
      const list = document.createElement('dl');
      list.className = 'v2-diagnostics';
      for (const [id, status] of this.context.controllerStatuses) {
        appendText(list, 'dt', '', id);
        appendText(list, 'dd', '', `${status.status}${status.detail ? ` · ${status.detail}` : ''}`);
      }
      this.body.appendChild(list);
      const debug = document.createElement('button');
      debug.type = 'button';
      debug.className = 'v2-panel__action';
      debug.dataset.panelCommand = 'toggle-debug';
      debug.textContent = document.body.dataset.debugHotspots === '1'
        ? 'Hide hotspot outlines'
        : 'Show hotspot outlines';
      this.body.appendChild(debug);
      return;
    }

    (object.items || []).forEach((item) => {
      const article = document.createElement('article');
      article.className = 'v2-panel__item';
      appendText(article, 'h3', '', item.title || '');
      appendText(article, 'p', '', item.text || '');
      this.body.appendChild(article);
    });
  }

  handleClick(event) {
    if (event.target.matches('[data-panel-close], [data-panel-backdrop]')) {
      this.close();
      return;
    }
    if (event.target.matches('[data-panel-command="toggle-debug"]')) {
      document.body.dataset.debugHotspots = document.body.dataset.debugHotspots === '1' ? '0' : '1';
      this.render(this.context.manifest.objects[this.openId]);
    }
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
    if (this.openId && !snapshot.allowedObjectIds.includes(this.openId)) this.close();
    this.mark('ready', snapshot.sceneId);
  }

  async suspend(reason = 'suspend') {
    this.close();
    this.mark('suspended', reason);
  }

  async destroy() {
    this.close();
    this.layer.removeEventListener('click', this.boundClick);
    this.unsubscribeState?.();
    await super.destroy();
  }
}
