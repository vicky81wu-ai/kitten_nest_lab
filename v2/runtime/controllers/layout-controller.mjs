import { BaseController } from '../core/base-controller.mjs';
import { coverBox, projectCoordinate } from '../core/geometry.mjs';

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

export class LayoutController extends BaseController {
  constructor(context) {
    super('layout', context);
    this.scheduled = false;
    this.boundSchedule = () => this.schedule('viewport');
  }

  async mount() {
    await super.mount();
    this.stage = this.context.elements.stage;
    this.image = this.context.elements.sceneImage;
    window.addEventListener('resize', this.boundSchedule);
    window.addEventListener('orientationchange', this.boundSchedule);
    this.image.addEventListener('load', this.boundSchedule);
  }

  async ready() {
    this.mark('ready');
  }

  schedule(reason = 'schedule') {
    if (this.scheduled || !this.context.currentSnapshot) return;
    this.scheduled = true;
    requestAnimationFrame(async () => {
      this.scheduled = false;
      await this.reconcile(this.context.currentSnapshot, reason);
    });
  }

  measureBaseline(element, text, width) {
    if (!text || !element) return 0;
    const clone = element.cloneNode(false);
    clone.removeAttribute('data-object-id');
    clone.textContent = text;
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.pointerEvents = 'none';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = `${width}px`;
    clone.style.maxWidth = `${width}px`;
    clone.style.height = 'auto';
    this.stage.appendChild(clone);
    const height = clone.getBoundingClientRect().height;
    clone.remove();
    return height;
  }

  async reconcile(snapshot, reason = 'scene') {
    this.lastSnapshot = snapshot;
    if (!snapshot) return;
    this.stage.dataset.layoutStatus = 'measuring';
    await nextFrame();

    const imageRect = this.image.getBoundingClientRect();
    const imageBox = coverBox(imageRect, {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight
    });
    if (!imageBox) {
      this.stage.dataset.layoutStatus = 'waiting';
      this.mark('waiting', 'image/coverBox');
      return;
    }

    const stageRect = this.stage.getBoundingClientRect();
    for (const objectId of snapshot.allowedObjectIds) {
      const object = this.context.manifest.objects[objectId];
      if (!object?.coordinate || !object.selector) continue;
      const element = document.querySelector(object.selector);
      if (!element) continue;
      element.removeAttribute('data-layout-ready');

      const width = imageBox.width * Number(object.coordinate.width || 0);
      if (width) {
        element.style.width = `${width}px`;
        element.style.maxWidth = `${width}px`;
      }
      if (object.coordinate.height != null) {
        element.style.height = `${imageBox.height * Number(object.coordinate.height)}px`;
      } else if (object.coordinate.aspectRatio && width) {
        element.style.height = `${width / Number(object.coordinate.aspectRatio)}px`;
      } else {
        element.style.height = 'auto';
      }

      const elementSize = element.getBoundingClientRect();
      const baselineHeight = this.measureBaseline(
        element,
        object.coordinate.baselineText,
        width
      );
      const placement = projectCoordinate({
        imageBox,
        stageRect,
        coordinate: object.coordinate,
        elementSize,
        baselineHeight
      });
      if (!placement) continue;

      element.style.left = `${placement.left}px`;
      element.style.top = `${placement.top}px`;
      if (placement.width) element.style.width = `${placement.width}px`;
      if (placement.height != null) element.style.height = `${placement.height}px`;
      element.style.transform = placement.rotation ? `rotate(${placement.rotation}deg)` : '';
      element.dataset.layoutReady = '1';
    }

    this.stage.dataset.layoutStatus = 'ready';
    this.stage.dataset.layoutReason = reason;
    this.context.currentLayout = imageBox;
    this.context.events.emit('layout:ready', { sceneId: snapshot.sceneId, imageBox, reason });
    this.mark('ready', snapshot.sceneId);
  }

  async suspend(reason = 'suspend') {
    this.stage.dataset.layoutStatus = 'suspended';
    this.mark('suspended', reason);
  }

  async destroy() {
    window.removeEventListener('resize', this.boundSchedule);
    window.removeEventListener('orientationchange', this.boundSchedule);
    this.image.removeEventListener('load', this.boundSchedule);
    await super.destroy();
  }
}
