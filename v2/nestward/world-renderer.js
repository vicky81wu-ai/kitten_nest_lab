import { WORLD_HEIGHT, TAU, actorScale, groundY } from './world-model.js';

const assetSources = {
  indoor: './assets/indoor-world.webp',
  outdoor: './assets/outdoor-world.webp',
  kittenIdle: './assets/characters/kitten-idle.png',
  kittenWalk1: './assets/characters/kitten-walk-1.png',
  kittenWalk2: './assets/characters/kitten-walk-2.png',
  kittenWalk3: './assets/characters/kitten-walk-3.png',
  kittenWalk4: './assets/characters/kitten-walk-4.png',
  kittenBedSit: './assets/characters/kitten-bed-sit.png',
  kittenBedLie: './assets/characters/kitten-bed-lie.png',
  kittenBedLean: './assets/characters/kitten-bed-lean.png',
  hubbyIdle: './assets/characters/hubby-idle.png',
  hubbyWalk1: './assets/characters/hubby-walk-1.png',
  hubbyWalk2: './assets/characters/hubby-walk-2.png',
  hubbyWalk3: './assets/characters/hubby-walk-3.png',
  hubbyWalk4: './assets/characters/hubby-walk-4.png',
  hubbyBedSit: './assets/characters/hubby-bed-sit.png',
  hubbyBedLie: './assets/characters/hubby-bed-lie.png',
  hubbyBedLean: './assets/characters/hubby-bed-lean.png',
  hubbyCarryWalk1: './assets/characters/hubby-carry-walk-1.png',
  hubbyCarryWalk2: './assets/characters/hubby-carry-walk-2.png',
  nailiIdle: './assets/characters/naili-idle.png',
  readingChair: './assets/props/reading-chair.png'
};

// Source artwork is normalized at render time: Kitten/Naili face right,
// while every Hubby idle/walk source faces left. Movement direction then
// mirrors the complete figure, including his head, instead of leaving him
// looking behind himself while walking right.
const nativeFacingByRole = { player: 1, hubby: -1, naili: 1 };

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

function actorRole(actor) {
  if (actor.id === 'player') return 'player';
  if (actor.id === 'hubby') return 'hubby';
  return 'naili';
}

function poseAssetKey(actor) {
  const role = actorRole(actor);
  if (role === 'naili') return 'nailiIdle';
  const prefix = role === 'player' ? 'kitten' : 'hubby';
  const pose = actor.mount?.pose;
  if (pose === 'bed-sit') return `${prefix}BedSit`;
  if (pose === 'bed-lie') return `${prefix}BedLie`;
  if (pose === 'bed-lean') return `${prefix}BedLean`;
  // The first generated walk sheet mixed two incompatible viewing angles.
  // Frames 2/4 form the stable directional pair; mirroring the whole figure
  // supplies the opposite travel direction without alternating his feet
  // between left- and right-facing artwork.
  if (actor.walking) return `${prefix}Walk${Math.floor(actor.step * .72) % 2 ? 4 : 2}`;
  return `${prefix}Idle`;
}

function actorMetrics(assets, scene, actor) {
  const role = actorRole(actor);
  const sprite = assets.get(poseAssetKey(actor));
  const perspective = actor.mount ? 1 : actorScale(actor.z) / actorScale(.62);
  let height = actor.mount?.height || (scene.actorHeights?.[role] || (role === 'naili' ? 72 : 176)) * perspective;
  let width = actor.mount?.width || height * (sprite.width / sprite.height);
  if (actor.mount?.width && !actor.mount?.height) height = width * (sprite.height / sprite.width);
  return {
    sprite,
    width,
    height,
    y: Number.isFinite(actor.mount?.renderY) ? actor.mount.renderY : groundY(scene, actor.z),
    nativeFacing: nativeFacingByRole[role]
  };
}

function drawActorShadow(ctx, actor, metrics, alpha = .24) {
  if (actor.mount) return;
  const liftSpread = actor.flying ? 1.28 : 1;
  ellipse(ctx, actor.x, metrics.y + 2, metrics.height * .16 * liftSpread, metrics.height * .043, `rgba(40,23,20,${alpha})`);
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

function drawSpriteActor(ctx, assets, actor, scene, time, options = {}) {
  const metrics = actorMetrics(assets, scene, actor);
  const bob = actor.mount ? 0 : actor.walking ? Math.sin(actor.step * 1.8) * 1.2 : Math.sin(time * 1.35 + (options.phase || 0)) * .42;
  const lift = actor.flying ? 28 + Math.sin(time * 2.2) * 4 : 0;
  const facing = actor.mount?.facing || actor.dir || 1;
  const direction = facing * metrics.nativeFacing;
  ctx.save();
  ctx.translate(actor.x, metrics.y + bob - lift);
  ctx.scale(direction, 1);
  if (actor.wings) drawWings(ctx, time, actor.flying, metrics.height);
  ctx.drawImage(metrics.sprite, -metrics.width * .5, -metrics.height, metrics.width, metrics.height);
  if (options.carriedSprite) {
    const catHeight = metrics.height * .31;
    const catWidth = catHeight * (options.carriedSprite.width / options.carriedSprite.height);
    ctx.drawImage(options.carriedSprite, metrics.width * .02, -metrics.height * .58, catWidth, catHeight);
  }
  ctx.restore();
  return metrics;
}

function drawSpriteNaili(ctx, assets, actor, scene, time) {
  const metrics = actorMetrics(assets, scene, actor);
  const bob = actor.walking ? Math.abs(Math.sin(actor.step * 1.7)) * 1.5 : Math.sin(time * 1.7 + 1.1) * .35;
  ctx.save();
  ctx.translate(actor.x, metrics.y - bob);
  ctx.scale(actor.dir || 1, 1);
  ctx.drawImage(metrics.sprite, -metrics.width * .5, -metrics.height, metrics.width, metrics.height);
  ctx.restore();
}

function carryMetrics(assets, scene, state) {
  const frame = Math.floor(state.hubby.step * .72) % 2 + 1;
  const sprite = assets.get(`hubbyCarryWalk${frame}`);
  const perspective = actorScale(state.hubby.z) / actorScale(.62);
  const height = (scene.actorHeights?.hubby || 218) * 1.12 * perspective;
  return {
    sprite,
    width: height * (sprite.width / sprite.height),
    height,
    x: state.hubby.x,
    y: groundY(scene, state.hubby.z)
  };
}

function drawPrincessCarry(ctx, assets, state) {
  const metrics = carryMetrics(assets, state.scene, state);
  ellipse(ctx, metrics.x, metrics.y + 2, metrics.height * .17, metrics.height * .045, 'rgba(40,23,20,.23)');
  ctx.save();
  ctx.translate(metrics.x, metrics.y);
  // Carry frames share Hubby's left-facing source contract. Mirror the whole
  // combined figure for rightward travel so neither head lags behind the feet.
  ctx.scale((state.hubby.dir || 1) * nativeFacingByRole.hubby, 1);
  ctx.drawImage(metrics.sprite, -metrics.width * .5, -metrics.height, metrics.width, metrics.height);
  ctx.restore();
  return metrics;
}

function drawPropLayer(ctx, assets, visual, front = false) {
  const sprite = assets.get(visual.asset);
  if (!sprite) return;
  ctx.save();
  if (front) {
    ctx.beginPath();
    for (const polygon of visual.frontPolygons || []) {
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
    ctx.clip();
  }
  ctx.drawImage(sprite, visual.x, visual.y, visual.width, visual.height);
  ctx.restore();
}

function drawPlateLayer(ctx, plate, layer) {
  ctx.save();
  ctx.beginPath();
  for (const polygon of layer.polygons || []) {
    polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(plate, 0, 0);
  ctx.restore();
}

function drawFountainEffects(ctx, time) {
  const pulse = .5 + Math.sin(time * 1.8) * .5;
  glow(ctx, `rgba(168,231,239,${.12 + pulse * .06})`, 8);
  for (let index = 0; index < 7; index += 1) {
    const phase = (time * .24 + index * .19) % 1;
    const side = index % 2 ? 1 : -1;
    ellipse(ctx, 1080 + side * (6 + phase * 13), 423 + phase * 43, 1.2 + phase * .55, 2.1 + phase, `rgba(219,247,246,${(.28 + pulse * .08) * (1 - phase * .7)})`);
  }
  clearGlow(ctx);
  for (let index = 0; index < 11; index += 1) {
    const orbit = time * .37 + index * .93;
    ellipse(ctx, 1080 + Math.cos(orbit) * (58 + index % 3 * 11), 500 + Math.sin(orbit * 1.6) * 60, 1.8, 1.8, `rgba(255,225,139,${.2 + (index % 3) * .07})`);
  }
}

function drawAtmosphere(ctx, sceneId, cameraX, visibleWidth, time) {
  if (sceneId === 'indoor') {
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 241 + 113) % 1536;
      const y = 140 + (index * 97) % 480 + Math.sin(time * .45 + index) * 7;
      if (x < cameraX - 30 || x > cameraX + visibleWidth + 30) continue;
      ellipse(ctx, x, y, 2.2, 2.2, `rgba(255,215,143,${.14 + (Math.sin(time * 1.2 + index) + 1) * .055})`);
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
    this.ready = false;
    this.cssWidth = innerWidth;
    this.cssHeight = innerHeight;
    this.dpr = 1;
    this.baseScale = 1;
    this.zoom = 1;
    this.scale = 1;
  }

  async preload() {
    this.ready = false;
    const loaded = await Promise.all(Object.entries(assetSources).map(async ([key, source]) => [key, await loadBitmap(source)]));
    loaded.forEach(([key, bitmap]) => this.assets.set(key, bitmap));
    this.cache.clear();
    this.ready = true;
  }

  resize(currentScene) {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.cssWidth = Math.max(1, Math.round(rect?.width || innerWidth));
    this.cssHeight = Math.max(1, Math.round(rect?.height || innerHeight));
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.cssWidth * this.dpr);
    this.canvas.height = Math.round(this.cssHeight * this.dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx.imageSmoothingEnabled = true;
    this.baseScale = this.cssHeight / WORLD_HEIGHT;
    this.scale = this.baseScale * this.zoom;
    // ResizeObserver can fire as soon as the shell enters layout, before the
    // world plates finish decoding. Resizing the backing canvas is safe at
    // that point; cache construction is deferred until preload owns every
    // required bitmap so first launch cannot fail on a harmless early resize.
    if (currentScene && this.ready) this.ensureCache(currentScene);
  }

  setZoom(value) {
    this.zoom = Math.max(1, Math.min(2.25, value));
    this.scale = this.baseScale * this.zoom;
  }

  ensureCache(scene) {
    if (this.cache.has(scene.id)) return this.cache.get(scene.id);
    const artwork = this.assets.get(scene.id);
    if (!artwork) throw new Error(`Nestward world plate is unavailable: ${scene.id}`);
    const surface = document.createElement('canvas');
    surface.width = scene.width;
    surface.height = WORLD_HEIGHT;
    const context = surface.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.drawImage(artwork, 0, 0, scene.width, WORLD_HEIGHT);
    this.cache.set(scene.id, surface);
    return surface;
  }

  screenToWorld(scene, cameraX, clientX, clientY, cameraY = 0) {
    const y = cameraY + clientY / this.scale;
    return { x: cameraX + clientX / this.scale, y, z: (y - scene.wallBottom) / (scene.floorBottom - scene.wallBottom) };
  }

  worldToScreen(cameraX, x, y, cameraY = 0) {
    return { x: (x - cameraX) * this.scale, y: (y - cameraY) * this.scale };
  }

  actorScreenAnchor(state, actor) {
    if (state.princessCarry?.active && (actor === state.player || actor === state.hubby)) {
      const metrics = carryMetrics(this.assets, state.scene, state);
      const offset = actor === state.player ? -metrics.width * .17 : metrics.width * .12;
      return this.worldToScreen(state.cameraX, metrics.x + offset, metrics.y - metrics.height - 12, state.cameraY || 0);
    }
    if (state.swing?.active && actor === state.player) {
      const object = state.scene.objects.find((entry) => entry.id === 'swing');
      const mount = object?.swingMount;
      const display = mount ? { ...actor, x: mount.x, z: .3, mount: { ...mount, pose: 'bed-sit' } } : actor;
      const metrics = actorMetrics(this.assets, state.scene, display);
      return this.worldToScreen(state.cameraX, display.x, metrics.y - metrics.height - 12, state.cameraY || 0);
    }
    const metrics = actorMetrics(this.assets, state.scene, actor);
    return this.worldToScreen(state.cameraX, actor.x, metrics.y - metrics.height - 12, state.cameraY || 0);
  }

  actorScreenBounds(state, actor) {
    if (state.princessCarry?.active && (actor === state.player || actor === state.hubby)) {
      const metrics = carryMetrics(this.assets, state.scene, state);
      const topLeft = this.worldToScreen(state.cameraX, metrics.x - metrics.width * .5, metrics.y - metrics.height, state.cameraY || 0);
      return { x: topLeft.x, y: topLeft.y, width: metrics.width * this.scale, height: metrics.height * this.scale };
    }
    if (state.swing?.active && actor === state.player) {
      const object = state.scene.objects.find((entry) => entry.id === 'swing');
      const mount = object?.swingMount;
      if (mount) {
        const display = { ...actor, x: mount.x, z: .3, mount: { ...mount, pose: 'bed-sit' } };
        const metrics = actorMetrics(this.assets, state.scene, display);
        const topLeft = this.worldToScreen(state.cameraX, display.x - metrics.width * .5, metrics.y - metrics.height, state.cameraY || 0);
        return { x: topLeft.x, y: topLeft.y, width: metrics.width * this.scale, height: metrics.height * this.scale };
      }
    }
    const metrics = actorMetrics(this.assets, state.scene, actor);
    const topLeft = this.worldToScreen(state.cameraX, actor.x - metrics.width * .5, metrics.y - metrics.height, state.cameraY || 0);
    return { x: topLeft.x, y: topLeft.y, width: metrics.width * this.scale, height: metrics.height * this.scale };
  }

  render(state, time) {
    const { scene, cameraX, cameraY = 0, player, hubby, naili, tapPulse, swing, activeObjectId } = state;
    const ctx = this.ctx;
    const plate = this.ensureCache(scene);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-cameraX, -cameraY);
    ctx.drawImage(plate, 0, 0);

    const renderables = (scene.foregroundLayers || []).map((layer) => ({ kind: 'plateLayer', z: layer.z, layer }));
    for (const object of scene.objects) {
      if (!object.visual) continue;
      renderables.push({ kind: 'propBack', z: object.visual.backZ, visual: object.visual });
      renderables.push({ kind: 'propFront', z: object.visual.frontZ, visual: object.visual });
    }
    if (!naili.carried) renderables.push({ kind: 'naili', z: naili.z, actor: naili });
    if (state.princessCarry?.active) renderables.push({ kind: 'princessCarry', z: hubby.z });
    else {
      if (!(scene.id === 'outdoor' && swing.active)) renderables.push({ kind: 'player', z: player.z, actor: player });
      renderables.push({ kind: 'hubby', z: hubby.z, actor: hubby });
    }
    renderables.sort((a, b) => a.z - b.z);
    for (const item of renderables) {
      if (item.kind === 'plateLayer') drawPlateLayer(ctx, plate, item.layer);
      if (item.kind === 'propBack') drawPropLayer(ctx, this.assets, item.visual, false);
      if (item.kind === 'propFront') drawPropLayer(ctx, this.assets, item.visual, true);
      if (item.kind === 'princessCarry') drawPrincessCarry(ctx, this.assets, state);
      if (item.kind === 'player') {
        const metrics = actorMetrics(this.assets, scene, player);
        drawActorShadow(ctx, player, metrics, player.flying ? .12 : .22);
        drawSpriteActor(ctx, this.assets, player, scene, time, { carriedSprite: naili.carried ? this.assets.get('nailiIdle') : null });
      }
      if (item.kind === 'hubby') {
        const metrics = actorMetrics(this.assets, scene, hubby);
        drawActorShadow(ctx, hubby, metrics, .23);
        drawSpriteActor(ctx, this.assets, hubby, scene, time, { phase: 2 });
      }
      if (item.kind === 'naili') drawSpriteNaili(ctx, this.assets, naili, scene, time);
    }

    if (scene.id === 'outdoor' && swing.active) {
      const swingObject = scene.objects.find((entry) => entry.id === 'swing');
      const mount = swingObject?.swingMount || { x: 754, renderY: 520, height: 135, facing: -1 };
      const angle = Math.sin(time * 2.25) * (swing.pushed ? .17 : .11);
      const centerX = mount.x + Math.sin(angle) * 46;
      const centerY = mount.renderY + Math.cos(angle) * 10;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * .35);
      drawSpriteActor(ctx, this.assets, {
        ...player, x: 0, z: .3, mount: { renderY: 0, pose: 'bed-sit', height: mount.height, facing: mount.facing }, flying: false, dir: 1
      }, scene, time);
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
