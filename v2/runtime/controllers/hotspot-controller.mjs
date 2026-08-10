import { BaseController } from '../core/base-controller.mjs';

const NAVIGATION_ACTION_TYPES = new Set(['scene.go', 'scene.push', 'scene.back', 'scene.jumpTo']);

function isNavigationAction(action) {
  return NAVIGATION_ACTION_TYPES.has(action?.type);
}

export class HotspotController extends BaseController {
  constructor(context) {
    super('hotspot', context);
    this.dynamic = new Map();
    this.longPress = null;
    this.tapPress = null;
    this.touchPressId = null;
    this.boundPointerDown = (event) => this.handlePointerDown(event);
    this.boundPointerMove = (event) => this.handlePointerMove(event);
    this.boundPointerUp = (event) => this.handlePointerUp(event);
    this.boundPointerCancel = (event) => this.handlePointerCancel(event);
    this.boundContextMenu = (event) => this.handleContextMenu(event);
    this.boundTouchStart = (event) => this.handleTouchStart(event);
    this.boundTouchMove = (event) => this.handleTouchMove(event);
    this.boundTouchEnd = (event) => this.handleTouchEnd(event);
    this.boundSelectStart = (event) => this.handleSelectStart(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.hotspotLayer;
    this.stage = this.context.elements.stage;
    this.eventRoots = [this.stage];
    this.eventRoots.forEach((root) => {
      root.addEventListener('pointerdown', this.boundPointerDown);
      root.addEventListener('pointermove', this.boundPointerMove);
      root.addEventListener('pointerup', this.boundPointerUp);
      root.addEventListener('pointercancel', this.boundPointerCancel);
      root.addEventListener('contextmenu', this.boundContextMenu);
      root.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      root.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      root.addEventListener('touchend', this.boundTouchEnd, { passive: false });
      root.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });
      root.addEventListener('selectstart', this.boundSelectStart);
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
      element.hidden = false;
      element.disabled = false;
      element.setAttribute('aria-hidden', 'false');
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

  clearTapPress() {
    if (!this.tapPress) return;
    try { this.tapPress.target.releasePointerCapture?.(this.tapPress.pointerId); } catch {}
    this.tapPress = null;
  }

  armLongPress(match, pointerId, x, y) {
    const press = {
      ...match,
      pointerId,
      x,
      y,
      fired: false,
      timer: null
    };
    const delay = Number(match.object.longPressMs || 1800);
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
    return press;
  }

  handlePointerDown(event) {
    const match = this.hotspotFromEvent(event);
    if (!match) return;
    if (match.object.gesture === 'longPress') {
      if (this.touchPressId !== null) return;
      this.clearLongPress();
      this.blockEvent(event);
      this.armLongPress(match, event.pointerId, event.clientX, event.clientY);
      try { match.target.setPointerCapture?.(event.pointerId); } catch {}
      return;
    }
    this.clearTapPress();
    this.tapPress = {
      ...match,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
    if (isNavigationAction(match.object.action)) {
      this.blockEvent(event);
      try { match.target.setPointerCapture?.(event.pointerId); } catch {}
    }
  }

  handlePointerMove(event) {
    const press = this.longPress;
    if (press && press.pointerId === event.pointerId
      && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 14) {
      this.clearLongPress();
    }
    const tap = this.tapPress;
    if (tap && tap.pointerId === event.pointerId
      && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 28) {
      this.clearTapPress();
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
    const tap = this.tapPress;
    if (tap && tap.pointerId === event.pointerId) {
      this.blockEvent(event);
      this.clearTapPress();
      if (tap.target.disabled) return;
      try {
        await this.context.dispatch(tap.object.action);
      } catch (error) {
        this.context.reportError(`hotspot:${tap.object.id}`, error);
      }
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
    if (this.tapPress?.pointerId === event.pointerId) this.clearTapPress();
  }

  handleTouchStart(event) {
    const match = this.hotspotFromEvent(event);
    if (!match || match.object.gesture !== 'longPress') return;
    const touch = event.touches?.[0];
    if (!touch) return;
    this.blockEvent(event);
    this.touchPressId = touch.identifier;
    this.clearLongPress();
    this.armLongPress(match, `touch:${touch.identifier}`, touch.clientX, touch.clientY);
  }

  handleTouchMove(event) {
    if (this.touchPressId === null || !this.longPress) return;
    const touch = [...(event.touches || [])].find((item) => item.identifier === this.touchPressId);
    if (!touch) return;
    this.blockEvent(event);
    if (Math.hypot(touch.clientX - this.longPress.x, touch.clientY - this.longPress.y) > 14) {
      this.touchPressId = null;
      this.clearLongPress();
    }
  }

  handleTouchEnd(event) {
    if (this.touchPressId === null) return;
    this.blockEvent(event);
    this.touchPressId = null;
    this.clearLongPress();
  }

  handleSelectStart(event) {
    const match = this.hotspotFromEvent(event);
    if (match?.object.gesture === 'longPress') this.blockEvent(event);
  }

  handleContextMenu(event) {
    const match = this.hotspotFromEvent(event);
    if (match?.object.gesture === 'longPress') this.blockEvent(event);
  }

  async suspend(reason = 'suspend') {
    this.clearLongPress();
    this.clearTapPress();
    this.touchPressId = null;
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
      root.removeEventListener('touchstart', this.boundTouchStart);
      root.removeEventListener('touchmove', this.boundTouchMove);
      root.removeEventListener('touchend', this.boundTouchEnd);
      root.removeEventListener('touchcancel', this.boundTouchEnd);
      root.removeEventListener('selectstart', this.boundSelectStart);
    });
    this.eventRoots = [];
    await super.destroy();
  }
}
