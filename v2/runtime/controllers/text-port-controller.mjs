import { BaseController } from '../core/base-controller.mjs';
import { resolveTextPortState } from '../core/text-state.mjs';
import { resolveWeatherState } from '../core/weather-state.mjs';

export class TextPortController extends BaseController {
  constructor(context) {
    super('textPort', context);
    this.ports = new Map();
    this.boundPointer = (event) => this.handlePointer(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.textLayer;
    this.layer.addEventListener('pointerup', this.boundPointer);
    this.unsubscribeState = this.context.events.on('state:change', () => {
      if (this.context.currentSnapshot) this.reconcile(this.context.currentSnapshot);
    });
  }

  async ready() {
    this.mark('ready');
  }

  createPort(object) {
    const element = document.createElement('button');
    const variant = object.variant || 'bubble';
    element.type = 'button';
    element.className = `v2-text-port v2-text-port--${variant}`;
    element.dataset.objectId = object.id;
    element.dataset.textPortId = object.id;
    element.dataset.requiresLayout = '1';
    element.setAttribute('aria-label', object.label || `${object.targetId || object.id} text`);
    element.setAttribute('aria-live', 'polite');
    this.layer.appendChild(element);
    const port = { object, element, queue: [], index: 0, visible: false, sourceField: '' };
    this.ports.set(object.id, port);
    return port;
  }

  sync(port) {
    const stateController = this.context.controllers.get('state');
    const state = stateController.get() || {};
    if (port.object?.variant === 'weather') {
      port.weather = resolveWeatherState(state, port.object);
      port.queue = [`${port.weather.temperature}\n${port.weather.description}`];
      port.index = 0;
      port.sourceField = port.weather.sourceField;
      port.visible = true;
      port.hasRenderedState = true;
      this.render(port);
      return;
    }

    const source = stateController.source;
    const mayUseState = port.object.staticText || source !== 'degradedFallback' || port.object.allowDegradedFallback;
    const resolved = mayUseState
      ? resolveTextPortState(state, port.object)
      : { queue: [], index: 0, sourceField: '' };
    port.queue = resolved.queue;
    port.index = port.queue.length ? resolved.index % port.queue.length : 0;
    port.sourceField = resolved.sourceField;
    if (!port.queue.length) port.visible = false;
    else if (!port.hasRenderedState) port.visible = port.object.initiallyVisible !== false;
    if (port.visible) port.hasShown = true;
    port.hasRenderedState = true;
    this.render(port);
  }

  render(port) {
    const text = port.queue[port.index] || '';
    port.element.removeAttribute('data-layout-ready');
    if (port.object?.variant === 'weather') {
      const temperature = document.createElement('span');
      temperature.className = 'v2-weather__temperature';
      temperature.textContent = port.weather?.temperature || '';
      const description = document.createElement('span');
      description.className = 'v2-weather__description';
      description.textContent = port.weather?.description || '';
      port.element.replaceChildren(temperature, description);
    } else {
      port.element.textContent = text;
    }
    port.element.hidden = !port.visible || !text;
    port.element.dataset.stateField = port.sourceField || 'none';
    port.element.dataset.stateSource = this.context.controllers.get('state').source;
    port.element.dataset.visible = port.visible ? '1' : '0';
    if (!port.element.hidden && !this.context.isReconcilingScene) {
      this.context.controllers.get('layout')?.schedule('text-render');
    }
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
    const allowed = new Set(snapshot.allowedObjectIds);
    for (const [id, port] of this.ports) {
      if (!allowed.has(id)) {
        port.element.remove();
        this.ports.delete(id);
      }
    }

    for (const id of snapshot.allowedObjectIds) {
      const object = this.context.manifest.objects[id];
      if (object?.kind !== 'textPort' || object.controller !== 'textPort') continue;
      const port = this.ports.get(id) || this.createPort(object);
      this.sync(port);
    }
    this.mark('ready', snapshot.sceneId);
  }

  hide(id) {
    const port = this.ports.get(id);
    if (!port) return false;
    port.visible = false;
    this.render(port);
    return true;
  }

  toggleNext(id) {
    const port = this.ports.get(id);
    if (!port || !port.queue.length) return false;
    if (port.visible) {
      port.visible = false;
    } else {
      if (port.hasShown) {
        port.index = port.queue.length > 1 ? (port.index + 1) % port.queue.length : 0;
      }
      port.visible = true;
      port.hasShown = true;
    }
    this.render(port);
    return true;
  }

  async handlePointer(event) {
    const element = event.target.closest?.('[data-text-port-id]');
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    const port = this.ports.get(element.dataset.textPortId);
    if (port?.object.action) {
      try {
        await this.context.dispatch(port.object.action);
      } catch (error) {
        this.context.reportError(`textPort:${port.object.id}`, error);
      }
      return;
    }
    this.hide(element.dataset.textPortId);
  }

  async suspend(reason = 'suspend') {
    for (const port of this.ports.values()) port.element.remove();
    this.ports.clear();
    this.mark('suspended', reason);
  }

  async destroy() {
    await this.suspend('destroy');
    this.layer.removeEventListener('pointerup', this.boundPointer);
    this.unsubscribeState?.();
    await super.destroy();
  }
}
