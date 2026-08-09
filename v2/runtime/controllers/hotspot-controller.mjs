import { BaseController } from '../core/base-controller.mjs';

export class HotspotController extends BaseController {
  constructor(context) {
    super('hotspot', context);
    this.dynamic = new Map();
    this.boundPointer = (event) => this.handlePointer(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.hotspotLayer;
    this.controls = this.context.elements.controls;
    this.layer.addEventListener('pointerup', this.boundPointer);
    this.controls.addEventListener('pointerup', this.boundPointer);
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

  async handlePointer(event) {
    const target = event.target.closest?.('[data-hotspot-id]');
    if (!target || target.disabled) return;
    const object = this.context.manifest.objects[target.dataset.hotspotId];
    if (!object?.action) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      await this.context.dispatch(object.action);
    } catch (error) {
      this.context.reportError(`hotspot:${object.id}`, error);
    }
  }

  async suspend(reason = 'suspend') {
    for (const element of this.dynamic.values()) element.remove();
    this.dynamic.clear();
    this.mark('suspended', reason);
  }

  async destroy() {
    await this.suspend('destroy');
    this.layer.removeEventListener('pointerup', this.boundPointer);
    this.controls.removeEventListener('pointerup', this.boundPointer);
    await super.destroy();
  }
}
