import { SCENES, WORLD_HEIGHT, actorScale, groundY, clamp } from './world-model.js';

const canvas = document.querySelector('#stage');
const ctx = canvas.getContext('2d', { alpha: false });
const statusEl = document.querySelector('#status');
const followBtn = document.querySelector('#follow');
const scene = SCENES.indoor;
const WORLD_WIDTH = scene.width;
const DPR_CAP = 2;
const PLAYER_SPEED = 245;
const NAILI_SPEED = 126;
const NAILI_DRAW_CELL = 170;
const ATLAS_CELL = 128;
const ATLAS_COLS = 8;
const SEGMENTS = {
  idle: { start: 0, count: 48, fps: 8 },
  rise: { start: 48, count: 66, fps: 12 },
  stop: { start: 114, count: 45, fps: 12 }
};

const state = {
  player: {
    x: scene.spawn.player.x, z: scene.spawn.player.z,
    targetX: scene.spawn.player.x, targetZ: scene.spawn.player.z,
    dir: 1, moving: false, step: 0
  },
  naili: {
    x: scene.spawn.naili.x, z: scene.spawn.naili.z,
    targetX: scene.spawn.naili.x, targetZ: scene.spawn.naili.z,
    dir: 1, phase: 'idle', frame: 9, phaseClock: 0, idleClock: 0,
    follow: true, nextWanderAt: Infinity,
    stopFromX: 0, stopFromZ: 0, stopToX: 0, stopToZ: 0
  }
};

const assets = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`asset failed: ${src}`));
    img.src = src;
  });
}

async function preload() {
  const [world, kittenIdle, kitten1, kitten2, kitten3, kitten4, hubby, nailiAtlas] = await Promise.all([
    loadImage('./assets/indoor-world.webp'),
    loadImage('./assets/characters/kitten-idle.png'),
    loadImage('./assets/characters/kitten-walk-1.png'),
    loadImage('./assets/characters/kitten-walk-2.png'),
    loadImage('./assets/characters/kitten-walk-3.png'),
    loadImage('./assets/characters/kitten-walk-4.png'),
    loadImage('./assets/characters/hubby-idle.png'),
    loadImage('./naili-motion-lab-assets/naili-hd.avif')
  ]);
  Object.assign(assets, { world, kittenIdle, kitten1, kitten2, kitten3, kitten4, hubby, nailiAtlas });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
}

function worldTransform() {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WORLD_WIDTH, rect.height / WORLD_HEIGHT);
  const ox = (rect.width - WORLD_WIDTH * scale) / 2;
  const oy = (rect.height - WORLD_HEIGHT * scale) / 2;
  return { scale, ox, oy };
}

function actorHeight(role, z) {
  const perspective = actorScale(z) / actorScale(.62);
  return (scene.actorHeights?.[role] || (role === 'naili' ? 76 : 176)) * perspective;
}

function drawStaticActor(img, x, z, role, dir = 1) {
  const h = actorHeight(role, z);
  const w = h * (img.width / img.height);
  const y = groundY(scene, z);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  let img = assets.kittenIdle;
  if (p.moving) img = assets[`kitten${Math.floor(p.step * .72) % 4 + 1}`];
  drawStaticActor(img, p.x, p.z, 'player', p.dir);
}

function drawNaili() {
  const n = state.naili;
  const segment = SEGMENTS[n.phase];
  const local = Math.max(0, Math.min(segment.count - 1, Math.floor(n.frame)));
  const globalFrame = segment.start + local;
  const sx = (globalFrame % ATLAS_COLS) * ATLAS_CELL;
  const sy = Math.floor(globalFrame / ATLAS_COLS) * ATLAS_CELL;
  const perspective = actorScale(n.z) / actorScale(.62);
  const cellWorld = NAILI_DRAW_CELL * perspective;
  const y = groundY(scene, n.z);
  ctx.save();
  ctx.translate(n.x, y);
  ctx.scale(n.dir, 1);
  ctx.drawImage(
    assets.nailiAtlas,
    sx, sy, ATLAS_CELL, ATLAS_CELL,
    -cellWorld / 2, -cellWorld, cellWorld, cellWorld
  );
  ctx.restore();
}

function render() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
  const { scale, ox, oy } = worldTransform();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#221814';
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(assets.world, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawPlayer();
  drawStaticActor(assets.hubby, scene.spawn.hubby.x, scene.spawn.hubby.z, 'hubby', -1);
  drawNaili();
  ctx.restore();
}

function metricDistance(a, bx, bz) {
  const dx = bx - a.x;
  const dz = (bz - a.z) * 520;
  return Math.hypot(dx, dz);
}

function movePointToward(actor, tx, tz, speed, delta) {
  const dx = tx - actor.x;
  const dz = (tz - actor.z) * 520;
  const metric = Math.hypot(dx, dz);
  if (metric < .001) return true;
  const step = Math.min(metric, speed * delta);
  actor.x += dx / metric * step;
  actor.z += dz / metric * step / 520;
  return metric <= step + .5;
}

function setPlayerTarget(x, z) {
  const p = state.player;
  p.targetX = clamp(x, 110, WORLD_WIDTH - 110);
  p.targetZ = clamp(z, .62, .91);
  const dx = p.targetX - p.x;
  if (Math.abs(dx) > 2) p.dir = dx > 0 ? 1 : -1;
  p.moving = metricDistance(p, p.targetX, p.targetZ) > 4;
}

function updatePlayer(delta) {
  const p = state.player;
  if (!p.moving) return;
  p.step += delta * 8.5;
  if (movePointToward(p, p.targetX, p.targetZ, PLAYER_SPEED, delta)) {
    p.x = p.targetX; p.z = p.targetZ; p.moving = false;
  }
}

function followTarget() {
  const p = state.player;
  return {
    x: clamp(p.x - p.dir * 74, 120, WORLD_WIDTH - 120),
    z: clamp(p.z + .035, .64, .91)
  };
}

function setNailiTarget(x, z, restart = false) {
  const n = state.naili;
  n.targetX = clamp(x, 120, WORLD_WIDTH - 120);
  n.targetZ = clamp(z, .64, .91);
  const dx = n.targetX - n.x;
  if (Math.abs(dx) > 4) n.dir = dx > 0 ? 1 : -1;
  if ((n.phase === 'idle' || restart) && metricDistance(n, n.targetX, n.targetZ) > 105) {
    n.phase = 'rise';
    n.frame = 0;
    n.phaseClock = 0;
    statusEl.textContent = '奶栗：先起身，再跑';
  }
}

function riseMoveScale(frame) {
  if (frame <= 13) return 0;
  if (frame <= 20) return .15;
  if (frame <= 24) return .35 + (frame - 21) / 3 * .5;
  return 1;
}

function beginStop() {
  const n = state.naili;
  if (n.phase === 'stop') return;
  n.phase = 'stop';
  n.frame = 0;
  n.phaseClock = 0;
  n.stopFromX = n.x;
  n.stopFromZ = n.z;
  n.stopToX = n.targetX;
  n.stopToZ = n.targetZ;
  statusEl.textContent = '奶栗：刹车、转回来、坐下';
}

function stopProgress(frameFloat) {
  const t = Math.max(0, Math.min(1, frameFloat / 10));
  return 1 - Math.pow(1 - t, 2.2);
}

function settleIdle() {
  const n = state.naili;
  n.x = n.targetX;
  n.z = n.targetZ;
  n.phase = 'idle';
  n.frame = 9;
  n.phaseClock = 0;
  n.idleClock = 0;
  n.nextWanderAt = n.follow ? Infinity : performance.now() / 1000 + 3.5;
  statusEl.textContent = n.follow ? '奶栗：坐好，等小猫动' : '奶栗：坐好，等会儿自己逛';
}

function updateNaili(delta, now) {
  const n = state.naili;

  if (n.follow) {
    const t = followTarget();
    const d = metricDistance(n, t.x, t.z);
    if (d > 120) setNailiTarget(t.x, t.z);
    else if (n.phase !== 'idle' && n.phase !== 'stop') {
      n.targetX = t.x; n.targetZ = t.z;
      const dx = n.targetX - n.x;
      if (Math.abs(dx) > 12) n.dir = dx > 0 ? 1 : -1;
    }
  } else if (n.phase === 'idle' && now >= n.nextWanderAt) {
    n.nextWanderAt = now + 5.5;
    const side = n.x < WORLD_WIDTH * .52 ? 1 : -1;
    setNailiTarget(n.x + side * (260 + Math.random() * 180), .70 + Math.random() * .16);
  }

  if (n.phase === 'idle') {
    n.idleClock += delta;
    n.frame = 9 + Math.floor(n.idleClock * SEGMENTS.idle.fps) % (SEGMENTS.idle.count - 9);
    return;
  }

  if (n.phase === 'rise') {
    n.phaseClock += delta;
    let f = n.phaseClock * SEGMENTS.rise.fps;
    const remaining = metricDistance(n, n.targetX, n.targetZ);
    if (f >= 25 && remaining <= 88) {
      beginStop();
      return;
    }
    if (f >= 63 && remaining > 88) f = 55 + ((f - 55) % 8);
    n.frame = Math.min(f, 65);
    const scale = riseMoveScale(n.frame);
    if (scale > 0) movePointToward(n, n.targetX, n.targetZ, NAILI_SPEED * scale, delta);
    return;
  }

  if (n.phase === 'stop') {
    n.phaseClock += delta;
    const f = n.phaseClock * SEGMENTS.stop.fps;
    n.frame = Math.min(f, SEGMENTS.stop.count - 1);
    const p = stopProgress(f);
    n.x = n.stopFromX + (n.stopToX - n.stopFromX) * p;
    n.z = n.stopFromZ + (n.stopToZ - n.stopFromZ) * p;
    if (f >= SEGMENTS.stop.count) settleIdle();
  }
}

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const { scale, ox, oy } = worldTransform();
  const x = (clientX - rect.left - ox) / scale;
  const y = (clientY - rect.top - oy) / scale;
  const z = (y - scene.wallBottom) / (scene.floorBottom - scene.wallBottom);
  return { x, z };
}

canvas.addEventListener('pointerup', (event) => {
  const p = screenToWorld(event.clientX, event.clientY);
  if (p.z < .55 || p.z > .96) return;
  setPlayerTarget(p.x, p.z);
});

document.querySelector('#runLeft').addEventListener('click', () => {
  state.naili.follow = false;
  followBtn.textContent = '叫奶栗跟着我';
  setNailiTarget(330, .78, state.naili.phase === 'idle');
});

document.querySelector('#runRight').addEventListener('click', () => {
  state.naili.follow = false;
  followBtn.textContent = '叫奶栗跟着我';
  setNailiTarget(1110, .80, state.naili.phase === 'idle');
});

followBtn.addEventListener('click', () => {
  const n = state.naili;
  n.follow = !n.follow;
  if (n.follow) {
    n.nextWanderAt = Infinity;
    followBtn.textContent = '让奶栗自由跑';
    const t = followTarget();
    setNailiTarget(t.x, t.z);
    statusEl.textContent = '奶栗：跟着小猫';
  } else {
    followBtn.textContent = '叫奶栗跟着我';
    n.nextWanderAt = performance.now() / 1000 + 1.2;
    statusEl.textContent = '奶栗：自由活动';
  }
});

let last = performance.now();
function frame(ts) {
  const delta = Math.min(.04, (ts - last) / 1000 || .016);
  last = ts;
  updatePlayer(delta);
  updateNaili(delta, ts / 1000);
  render();
  requestAnimationFrame(frame);
}

await preload();
resize();
addEventListener('resize', resize, { passive: true });
followBtn.textContent = '让奶栗自由跑';
statusEl.textContent = '奶栗：高清动态版 · 现在跟着小猫';
requestAnimationFrame(frame);
