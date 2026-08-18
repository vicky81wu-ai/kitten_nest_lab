import { actorScale, groundY } from './world-model.js';

const HUBBY_KEYS = ['hubbyIdle', 'hubbyWalk1', 'hubbyWalk2', 'hubbyWalk3', 'hubbyWalk4'];

export class DoorAwayOverlayV2 {
  constructor(worldCanvas, renderer) {
    this.worldCanvas = worldCanvas;
    this.renderer = renderer;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'doorAwayActorOverlay';
    this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '4',
      display: 'block'
    });
    worldCanvas.insertAdjacentElement('afterend', this.canvas);
    this.context = this.canvas.getContext('2d');
    this.masks = null;
  }

  get ready() {
    return Boolean(this.renderer?.ready && HUBBY_KEYS.every((key) => this.renderer.assets?.get(key)));
  }

  setMasks(masks) {
    this.masks = masks;
  }

  resize() {
    const width = Math.max(1, this.renderer.cssWidth || innerWidth);
    const height = Math.max(1, this.renderer.cssHeight || innerHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    if (this.canvas.width !== backingWidth) this.canvas.width = backingWidth;
    if (this.canvas.height !== backingHeight) this.canvas.height = backingHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  clear() {
    const width = this.renderer.cssWidth || innerWidth;
    const height = this.renderer.cssHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.context.clearRect(0, 0, width, height);
  }

  render(state, time, mode) {
    if (!this.ready || !this.masks || !mode || state.scene.id !== 'indoor') {
      this.clear();
      return;
    }

    this.resize();
    const { scene, hubby } = state;
    const width = this.renderer.cssWidth || innerWidth;
    const height = this.renderer.cssHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const context = this.context;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.scale(this.renderer.scale, this.renderer.scale);
    context.translate(-state.cameraX, -(state.cameraY || 0));

    const sprite = hubby.walking
      ? this.renderer.assets.get(`hubbyWalk${Math.floor(hubby.step * .72) % 4 + 1}`)
      : this.renderer.assets.get('hubbyIdle');
    if (!sprite) {
      context.restore();
      return;
    }

    const perspective = actorScale(hubby.z) / actorScale(.62);
    const spriteHeight = (scene.actorHeights?.hubby || 218) * perspective;
    const spriteWidth = spriteHeight * (sprite.width / sprite.height);
    const y = groundY(scene, hubby.z);

    if (!hubby.mount) {
      context.beginPath();
      context.ellipse(hubby.x, y + 2, spriteHeight * .16, spriteHeight * .043, 0, 0, Math.PI * 2);
      context.fillStyle = 'rgba(40,23,20,.23)';
      context.fill();
    }

    const direction = (hubby.dir || 1) * -1;
    context.save();
    context.translate(hubby.x, y);
    context.scale(direction, 1);
    context.drawImage(sprite, -spriteWidth * .5, -spriteHeight, spriteWidth, spriteHeight);
    context.restore();

    if (mode === 'B') {
      context.globalCompositeOperation = 'destination-out';
      context.drawImage(this.masks.maskB, 0, 0);
    } else if (mode === 'outside') {
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(this.masks.maskA, 0, 0);
    }
    context.restore();
  }
}
