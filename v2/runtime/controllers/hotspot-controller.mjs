import { BaseController } from '../core/base-controller.mjs';

export class HotspotController extends BaseController {
  constructor(context) {
    super('hotspot', context);
    this.dynamic = new Map();
    this.longPress = null;
    this.boundPointerDown = (event) => this.handlePointerDown(event);
    this.boundPointerMove = (event) => this.handlePointerMove(event);
    this.boundPointerUp = (event) => this.handlePointerUp(event);
    this.boundPointerCancel = (event) => this.handlePointerCancel(event);
    this.boundContextMenu = (event) => this.handleContextMenu(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.hotspotLayer;
    this.controls = this.context.elements.controls;
    this.stage = this.context.elements.stage;
    this.eventRoots = [this.stage];
    this.eventRoots.forEach((root) => {
      root.addEventListener('pointerdown', this.boundPointerDown);
      root.addEventListener('pointermove', this.boundPointerMove);
      root.addEventListener('pointerup', this.boundPointerUp);
      root.addEventListener('pointercancel', this.boundPointerCancel);
      root.addEventListener('contextmenu', this.boundContextMenu);
    });
  }

  async ready() {
    this.mark('ready');
  }

  createHotspot(object) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-hotspot';
    button.dataset.objectId = object.id;
    button.dataset.hotspotId = object.id;
    button.dataset.requiresLayout = '1';
    button.setAttribute('aria-label', object.label || object.id);
    this.layer.appendChild(button);
    this.dynamic.set(object.id, button);
    return button;
  }

  existingHotspot(object) {
    const element = document.querySelector(object.selector);
    if (!element) return null;
    element.dataset.objectId = object.id;
    element.dataset.hotspotId = object.id;
    return element;
  }

  actionAvailable(object, snapshot) {
    if (object.action?.type !== 'scene.dock') return true;
    return Boolean(snapshot.scene?.docks?.[object.action.side]);
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
    const allowed = new Set(snapshot.allowedObjectIds);

    for (const [id, element] of this.dynamic) {
      if (!allowed.has(id)) {
        element.remove();
        this.dynamic.delete(id);
      }
    }

    for (const id of snapshot.allowedObjectIds) {
      const object = this.context.manifest.objects[id];
      if (object?.kind !== 'hotspot' || object.controller !== 'hotspot') continue;
      const element = object.mount === 'existing'
        ? this.existingHotspot(object)
        : this.dynamic.get(id) || this.createHotspot(object);
      if (!element) continue;
      const available = this.actionAvailable(object, snapshot);
      element.hidden = !available;
      element.disabled = !available;
      element.setAttribute('aria-hidden', available ? 'false' : 'true');
    }

    this.mark('ready', snapshot.sceneId);
  }

  hotspotFromEvent(event) {
    const target = event.target.closest?.('[data-hotspot-id]');
    if (!target || target.disabled) return null;
    const object = this.context.manifest.objects[target.dataset.hotspotId];
    if (!object?.action) return null;
    return { target, object };
  }

  blockEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  clearLongPress() {
    if (!this.longPress) return;
    clearTimeout(this.longPress.timer);
    delete globalThis.document?.body?.dataset.longPressArmed;
    this.longPress = null;
  }

  handlePointerDown(event) {
    const match = this.hotspotFromEvent(event);
    if (!match || match.object.gesture !== 'longPress') return;
    this.clearLongPress();
    this.blockEvent(event);
    const press = {
      ...match,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      fired: false,
      timer: null
    };
    const delay = Number(match.object.longPressMs || 850);
    press.timer = setTimeout(async () => {
      if (this.longPress !== press || press.target.disabled) return;
      press.fired = true;
      try {
        await this.context.dispatch(press.object.action);
      } catch (error) {
        this.context.reportError(`hotspot:${press.object.id}`, error);
      }
    }, delay);
    this.longPress = press;
    if (globalThis.document?.body) document.body.dataset.longPressArmed = match.object.id;
    try { match.target.setPointerCapture?.(event.pointerId); } catch {}
  }

  handlePointerMove(event) {
    const press = this.longPress;
    if (!press || press.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 14) {
      this.clearLongPress();
    }
  }

  async handlePointerUp(event) {
    const match = this.hotspotFromEvent(event);
    const press = this.longPress;
    if (press && press.pointerId === event.pointerId) {
      this.blockEvent(event);
      this.clearLongPress();
      return;
    }
    if (!match || match.object.gesture === 'longPress') return;
    this.blockEvent(event);
    try {
      await this.context.dispatch(match.object.action);
    } catch (error) {
      this.context.reportError(`hotspot:${match.object.id}`, error);
    }
  }

  handlePointerCancel(event) {
    if (this.longPress?.pointerId === event.pointerId) this.clearLongPress();
  }

  handleContextMenu(event) {
    const match = this.hotspotFromEvent(event);
    if (match?.object.gesture === 'longPress') this.blockEvent(event);
  }

  async suspend(reason = 'suspend') {
    this.clearLongPress();
    for (const element of this.dynamic.values()) element.remove();
    this.dynamic.clear();
    this.mark('suspended', reason);
  }

  async destroy() {
    await this.suspend('destroy');
    this.eventRoots.forEach((root) => {
      root.removeEventListener('pointerdown', this.boundPointerDown);
      root.removeEventListener('pointermove', this.boundPointerMove);
      root.removeEventListener('pointerup', this.boundPointerUp);
      root.removeEventListener('pointercancel', this.boundPointerCancel);
      root.removeEventListener('contextmenu', this.boundContextMenu);
    });
    this.eventRoots = [];
    await super.destroy();
  }
}
