import { WORLD_HEIGHT, TAU, actorScale, groundY } from './world-model.js';

const assetSources = {
  indoor: './assets/indoor-world.webp',
  outdoor: './assets/outdoor-world.webp',
  kitten: './assets/kitten.png',
  hubby: './assets/hubby.png',
  naili: './assets/naili.png'
};

async function loadBitmap(relativeSource) {
  const response = await fetch(new URL(relativeSource, import.meta.url));
  if (!response.ok) throw new Error(`Nestward asset failed: ${relativeSource} (${response.status})`);
  const blob = await response.blob();
  if ('createImageBitmap' in globalThis) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Nestward asset decode failed: ${relativeSource}`));
    };
    image.src = objectUrl;
  });
}

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

function drawActorShadow(ctx, actor, alpha = .24) {
  const scale = actorScale(actor.z);
  const y = groundY(actor.scene, actor.z);
  const liftSpread = actor.flying ? 1.28 : 1;
  ellipse(ctx, actor.x, y + 2, 32 * scale * liftSpread, 9 * scale, `rgba(40,23,20,${alpha})`);
}

function drawWings(ctx, time, flying) {
  const flutter = flying ? Math.sin(time * 8) * .16 : Math.sin(time * 1.2) * .035;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = flying ? .78 : .56;
  ctx.rotate(flutter);
  glow(ctx, 'rgba(190,218,255,.5)', flying ? 14 : 7);
  ellipse(ctx, -30, -62, 26, 42, '#88a9d0', -.58, '#d6e6f2', 2);
  ellipse(ctx, -27, -29, 20, 31, '#c49ed0', -.28, '#ead9ef', 2);
  ellipse(ctx, 30, -62, 26, 42, '#88a9d0', .58, '#d6e6f2', 2);
  ellipse(ctx, 27, -29, 20, 31, '#c49ed0', .28, '#ead9ef', 2);
  clearGlow(ctx);
  ctx.restore();
}

function drawSpriteActor(ctx, sprite, actor, time, options = {}) {
  const y = Number.isFinite(actor.renderY) ? actor.renderY : groundY(actor.scene, actor.z);
  const scale = actorScale(actor.z) * (options.scale || 1);
  const bob = actor.walking ? Math.sin(actor.step) * 2.2 : Math.sin(time * 1.35 + (options.phase || 0)) * .55;
  const lift = actor.flying ? 30 + Math.sin(time * 2.2) * 4 : 0;
  const nativeFacing = options.nativeFacing || 1;
  const direction = (actor.dir || 1) * nativeFacing;
  ctx.save();
  ctx.translate(actor.x, y + bob - lift);
  if (actor.action === 'lie') {
    ctx.rotate(-1.28 * (actor.dir || 1));
    ctx.translate(-28, 15);
  } else if (actor.action?.startsWith('sit') || actor.action === 'crouch') {
    ctx.translate(0, 14);
  }
  ctx.scale(scale * direction, scale);
  if (actor.wings) drawWings(ctx, time, actor.flying);
  ctx.drawImage(sprite, -sprite.width * .5, -sprite.height);
  if (options.carriedSprite) {
    const cat = options.carriedSprite;
    ctx.save();
    ctx.translate(23, -62);
    ctx.scale(.55 * direction, .55);
    ctx.drawImage(cat, -cat.width * .5, -cat.height * .72);
    ctx.restore();
  }
  ctx.restore();
}

function drawSpriteNaili(ctx, sprite, actor, time) {
  const y = groundY(actor.scene, actor.z);
  const scale = actorScale(actor.z) * .62;
  const bob = actor.walking ? Math.abs(Math.sin(actor.step)) * 2.4 : Math.sin(time * 1.7 + 1.1) * .45;
  ctx.save();
  ctx.translate(actor.x, y - bob);
  ctx.scale(scale * (actor.dir || 1), scale);
  ctx.drawImage(sprite, -sprite.width * .5, -sprite.height);
  ctx.restore();
}

function drawFountainEffects(ctx, time) {
  const pulse = .5 + Math.sin(time * 1.8) * .5;
  glow(ctx, `rgba(168,231,239,${.12 + pulse * .06})`, 8);
  for (let index = 0; index < 7; index += 1) {
    const phase = (time * .24 + index * .19) % 1;
    const side = index % 2 ? 1 : -1;
    const x = 1080 + side * (6 + phase * 13);
    const y = 423 + phase * 43;
    ellipse(ctx, x, y, 1.2 + phase * .55, 2.1 + phase, `rgba(219,247,246,${(.28 + pulse * .08) * (1 - phase * .7)})`);
  }
  clearGlow(ctx);
  for (let index = 0; index < 11; index += 1) {
    const orbit = time * .37 + index * .93;
    ellipse(
      ctx,
      1080 + Math.cos(orbit) * (58 + index % 3 * 11),
      500 + Math.sin(orbit * 1.6) * 60,
      1.8,
      1.8,
      `rgba(255,225,139,${.2 + (index % 3) * .07})`
    );
  }
}

function drawAtmosphere(ctx, sceneId, cameraX, visibleWidth, time) {
  if (sceneId === 'indoor') {
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 241 + 113) % 1536;
      const y = 140 + (index * 97) % 480 + Math.sin(time * .45 + index) * 7;
      if (x < cameraX - 30 || x > cameraX + visibleWidth + 30) continue;
      const alpha = .14 + (Math.sin(time * 1.2 + index) + 1) * .055;
      ellipse(ctx, x, y, 2.2, 2.2, `rgba(255,215,143,${alpha})`);
    }
    return;
  }
  for (let index = 0; index < 15; index += 1) {
    const x = (index * 347 + 490) % 1536;
    const y = 470 + (index * 73) % 265 + Math.sin(time * .8 + index) * 12;
    if (x < cameraX - 30 || x > cameraX + visibleWidth + 30) continue;
    glow(ctx, 'rgba(255,210,107,.35)', 6);
    ellipse(ctx, x, y, 2.4, 2.4, `rgba(255,224,138,${.28 + .12 * Math.sin(time * 1.4 + index)})`);
    clearGlow(ctx);
  }
}

export class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cache = new Map();
    this.assets = new Map();
    this.cssWidth = innerWidth;
    this.cssHeight = innerHeight;
    this.dpr = 1;
    this.scale = 1;
  }

  async preload() {
    const loaded = await Promise.all(Object.entries(assetSources).map(async ([key, source]) => [key, await loadBitmap(source)]));
    loaded.forEach(([key, bitmap]) => this.assets.set(key, bitmap));
    this.cache.clear();
  }

  resize(currentScene) {
    this.cssWidth = innerWidth;
    this.cssHeight = innerHeight;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.cssWidth * this.dpr);
    this.canvas.height = Math.round(this.cssHeight * this.dpr);
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.ctx.imageSmoothingEnabled = false;
    this.scale = this.cssHeight / WORLD_HEIGHT;
    if (currentScene) this.ensureCache(currentScene);
  }

  ensureCache(scene) {
    if (this.cache.has(scene.id)) return this.cache.get(scene.id);
    const artwork = this.assets.get(scene.id);
    if (!artwork) throw new Error(`Nestward world plate is unavailable: ${scene.id}`);
    const surface = document.createElement('canvas');
    surface.width = scene.width;
    surface.height = WORLD_HEIGHT;
    const context = surface.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = false;
    context.drawImage(artwork, 0, 0, scene.width, WORLD_HEIGHT);
    this.cache.set(scene.id, surface);
    return surface;
  }

  screenToWorld(scene, cameraX, clientX, clientY) {
    return {
      x: cameraX + clientX / this.scale,
      y: clientY / this.scale,
      z: (clientY / this.scale - scene.wallBottom) / (scene.floorBottom - scene.wallBottom)
    };
  }

  worldToScreen(cameraX, x, y) {
    return { x: (x - cameraX) * this.scale, y: y * this.scale };
  }

  render(state, time) {
    const { scene, cameraX, player, hubby, naili, tapPulse, swing, activeObjectId } = state;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-cameraX, 0);
    ctx.drawImage(this.ensureCache(scene), 0, 0);

    const renderables = [];
    if (!naili.carried) renderables.push({ kind: 'naili', z: naili.z, actor: naili });
    if (!(scene.id === 'outdoor' && swing.active)) renderables.push({ kind: 'player', z: player.z, actor: player });
    renderables.push({ kind: 'hubby', z: hubby.z, actor: hubby });
    renderables.sort((a, b) => a.z - b.z);
    renderables.forEach((item) => {
      if (item.kind === 'player') {
        drawActorShadow(ctx, { ...player, scene }, player.flying ? .12 : .22);
        drawSpriteActor(ctx, this.assets.get('kitten'), { ...player, scene }, time, {
          scale: .96,
          carriedSprite: naili.carried ? this.assets.get('naili') : null
        });
      }
      if (item.kind === 'hubby') {
        drawActorShadow(ctx, { ...hubby, scene }, .23);
        drawSpriteActor(ctx, this.assets.get('hubby'), { ...hubby, scene }, time, {
          scale: 1.02,
          nativeFacing: -1,
          phase: 2
        });
      }
      if (item.kind === 'naili') drawSpriteNaili(ctx, this.assets.get('naili'), { ...naili, scene }, time);
    });

    if (scene.id === 'outdoor' && swing.active) {
      const angle = Math.sin(time * 2.25) * (swing.pushed ? .17 : .11);
      const centerX = 710 + Math.sin(angle) * 46;
      const centerY = 520 + Math.cos(angle) * 10;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * .35);
      drawSpriteActor(ctx, this.assets.get('kitten'), {
        ...player, x: 0, z: .3, renderY: 0, scene, flying: false, dir: 1, action: 'sit-swing'
      }, time, { scale: .82 });
      ctx.restore();
    }

    if (activeObjectId) {
      const object = scene.objects.find((entry) => entry.id === activeObjectId);
      if (object) {
        glow(ctx, 'rgba(255,218,142,.7)', 12);
        ellipse(ctx, object.x, object.hit[1] - 6, 4, 4, '#ffe0a2');
        clearGlow(ctx);
      }
    }
    if (tapPulse) {
      const alpha = Math.max(0, 1 - tapPulse.age / .7);
      ctx.strokeStyle = `rgba(255,231,190,${alpha * .8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tapPulse.x, groundY(scene, tapPulse.z), 14 + tapPulse.age * 28, 6 + tapPulse.age * 11, 0, 0, TAU);
      ctx.stroke();
    }
    if (scene.id === 'outdoor') drawFountainEffects(ctx, time);
    drawAtmosphere(ctx, scene.id, cameraX, this.cssWidth / this.scale, time);
    ctx.restore();
  }
}
