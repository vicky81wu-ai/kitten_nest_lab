import { BaseController } from '../core/base-controller.mjs';
import { resolveWeatherState, weatherAdvice } from '../core/weather-state.mjs';
import { GomokuPanelSession } from '../panels/gomoku-panel.mjs';

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
    this.panelStack = [];
    this.previousFocus = null;
    this.interactiveSession = null;
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
      const object = this.context.manifest.objects[this.openId];
      if (object && object.variant !== 'gomoku') this.render(object);
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
    if (this.openId === id) return true;
    if (!this.openId) {
      this.previousFocus = document.activeElement;
      this.panelStack = [];
    } else {
      this.panelStack.push(this.openId);
    }
    return this.show(object);
  }

  show(object) {
    this.openId = object.id;
    this.layer.hidden = false;
    this.layer.dataset.open = '1';
    this.card.dataset.panelId = object.id;
    this.render(object);
    requestAnimationFrame(() => this.closeButton.focus());
    return true;
  }

  back() {
    const previousId = this.panelStack.pop();
    if (!previousId) return this.close();
    const object = this.context.manifest.objects[previousId];
    if (!object || !this.allowed(previousId)) return this.close();
    return this.show(object);
  }

  close() {
    if (!this.openId) return false;
    this.teardownInteractive();
    this.openId = null;
    this.panelStack = [];
    this.layer.dataset.open = '0';
    this.layer.hidden = true;
    this.card.removeAttribute('data-panel-id');
    if (this.previousFocus?.focus) this.previousFocus.focus();
    this.previousFocus = null;
    return true;
  }

  render(object) {
    if (!object) return;
    this.teardownInteractive();
    this.title.textContent = object.title || object.id;
    this.body.replaceChildren();

    if (object.variant === 'gomoku') {
      this.interactiveSession = new GomokuPanelSession({
        body: this.body,
        object,
        onBack: () => this.back()
      });
      this.interactiveSession.mount();
      return;
    }

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

    let currentSection = null;
    (object.items || []).forEach((item, index) => {
      if (item.section && item.section !== currentSection) {
        currentSection = item.section;
        appendText(this.body, 'h3', 'v2-panel__section-title', item.section);
      }
      const article = document.createElement(item.action ? 'button' : 'article');
      article.className = item.action
        ? 'v2-panel__item v2-panel__item--action'
        : 'v2-panel__item';
      if (item.action) {
        article.type = 'button';
        article.dataset.panelItemIndex = String(index);
      }
      const heading = appendText(article, 'h3', '', item.title || '');
      if (item.status) {
        appendText(heading, 'span', 'v2-panel__status', item.status);
      }
      appendText(article, 'p', '', item.text || '');
      this.body.appendChild(article);
    });
  }

  handleClick(event) {
    if (event.target.matches('[data-panel-close], [data-panel-backdrop]')) {
      this.close();
      return;
    }
    if (this.interactiveSession?.handleClick(event.target)) {
      event.preventDefault();
      return;
    }
    if (event.target.matches('[data-panel-command="toggle-debug"]')) {
      document.body.dataset.debugHotspots = document.body.dataset.debugHotspots === '1' ? '0' : '1';
      this.render(this.context.manifest.objects[this.openId]);
      return;
    }
    const itemButton = event.target.closest?.('[data-panel-item-index]');
    if (itemButton) {
      const object = this.context.manifest.objects[this.openId];
      const item = object?.items?.[Number(itemButton.dataset.panelItemIndex)];
      if (item?.action) {
        event.preventDefault();
        Promise.resolve(this.context.dispatch(item.action)).catch((error) => {
          this.context.reportError('panel-action', error);
        });
      }
    }
  }

  teardownInteractive() {
    this.interactiveSession?.destroy();
    this.interactiveSession = null;
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
