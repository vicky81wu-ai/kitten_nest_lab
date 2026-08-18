import { actorScale, groundY } from './world-model.js';

const TAU = Math.PI * 2;

function ellipse(ctx, x, y, rx, ry, fill, rotation = 0, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawWings(ctx, time, flying, height) {
  const flutter = flying ? Math.sin(time * 8) * .15 : Math.sin(time * 1.2) * .035;
  const spread = height * .18;
  const wingHeight = height * .22;
  ctx.save();
  ctx.translate(0, -height * .6);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = flying ? .82 : .62;
  glow(ctx, 'rgba(178,218,255,.7)', flying ? 18 : 10);
  ctx.save();
  ctx.rotate(flutter);
  ellipse(ctx, -spread, -wingHeight * .28, spread * .78, wingHeight, '#87add5', -.58, '#e2f0fa', 2);
  ellipse(ctx, -spread * .9, wingHeight * .62, spread * .55, wingHeight * .7, '#c39ed4', -.26, '#f1e0f4', 2);
  ctx.restore();
  ctx.save();
  ctx.rotate(-flutter);
  ellipse(ctx, spread, -wingHeight * .28, spread * .78, wingHeight, '#87add5', .58, '#e2f0fa', 2);
  ellipse(ctx, spread * .9, wingHeight * .62, spread * .55, wingHeight * .7, '#c39ed4', .26, '#f1e0f4', 2);
  ctx.restore();
  clearGlow(ctx);
  for (let index = 0; index < 7; index += 1) {
    const phase = (time * .22 + index * .137) % 1;
    const side = index % 2 ? 1 : -1;
    ellipse(ctx, side * (spread * .45 + phase * spread), wingHeight * (.3 + phase * 1.2), 1.4, 1.4, `rgba(255,233,169,${.65 - phase * .5})`);
  }
  ctx.restore();
}

export class DoorTransitionOverlay {
  constructor(worldCanvas, renderer) {
    this.renderer = renderer;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'doorTransitionActorOverlay';
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
    this.maskB = null;
  }

  get ready() {
    return Boolean(this.renderer?.ready
      && this.renderer.assets?.get('kittenIdle')
      && this.renderer.assets?.get('kittenWalk1'));
  }

  setMask(maskB) {
    this.maskB = maskB || null;
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

  render(state, time) {
    if (!this.ready || !this.maskB || state.scene.id !== 'indoor') {
      this.clear();
      return;
    }

    this.resize();
    const { scene, player, naili } = state;
    const width = this.renderer.cssWidth || innerWidth;
    const height = this.renderer.cssHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const context = this.context;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.scale(this.renderer.scale, this.renderer.scale);
    context.translate(-state.cameraX, -(state.cameraY || 0));

    const sprite = player.walking
      ? this.renderer.assets.get(`kittenWalk${Math.floor(player.step * .72) % 4 + 1}`)
      : this.renderer.assets.get('kittenIdle');
    if (!sprite) {
      context.restore();
      return;
    }

    const perspective = actorScale(player.z) / actorScale(.62);
    const spriteHeight = (scene.actorHeights?.player || 176) * perspective;
    const spriteWidth = spriteHeight * (sprite.width / sprite.height);
    const y = groundY(scene, player.z);
    const lift = player.flying ? 28 + Math.sin(time * 2.2) * 4 : 0;
    const bob = player.walking ? 0 : Math.sin(time * 1.35) * .42;

    context.beginPath();
    context.ellipse(player.x, y + 2, spriteHeight * .16 * (player.flying ? 1.28 : 1), spriteHeight * .043, 0, 0, TAU);
    context.fillStyle = player.flying ? 'rgba(40,23,20,.12)' : 'rgba(40,23,20,.22)';
    context.fill();

    context.save();
    context.translate(player.x, y + bob - lift);
    context.scale(player.dir || 1, 1);
    if (player.wings) drawWings(context, time, player.flying, spriteHeight);
    context.drawImage(sprite, -spriteWidth * .5, -spriteHeight, spriteWidth, spriteHeight);
    if (naili.carried) {
      const carried = this.renderer.assets.get('nailiIdle');
      if (carried) {
        const catHeight = spriteHeight * .31;
        const catWidth = catHeight * (carried.width / carried.height);
        context.drawImage(carried, spriteWidth * .02, -spriteHeight * .58, catWidth, catHeight);
      }
    }
    context.restore();

    context.globalCompositeOperation = 'destination-out';
    context.drawImage(this.maskB, 0, 0);
    context.restore();
  }
}
