import { SCENES, WORLD_HEIGHT, actorScale, groundY, clamp } from './world-model.js';

const canvas = document.querySelector('#stage');
const ctx = canvas.getContext('2d', { alpha: false });
const statusEl = document.querySelector('#status');
const scene = SCENES.indoor;
const WORLD_WIDTH = scene.width;
const NAILI_SPEED = 126;
const DPR_CAP = 2;

const state = {
  x: scene.spawn.naili.x,
  z: scene.spawn.naili.z,
  targetX: scene.spawn.naili.x,
  targetZ: scene.spawn.naili.z,
  dir: 1,
  phase: 'idle',
  frame: 9,
  frameClock: 0,
  idleClock: 0,
  pendingAutoAt: performance.now() / 1000 + 2.2
};

const sheets = {};
const staticAssets = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadChunkedWebp(name, parts) {
  const texts = await Promise.all(
    Array.from({ length: parts }, (_, i) =>
      fetch(`./naili-motion-lab-assets/${name}.${i}.b64`).then((r) => {
        if (!r.ok) throw new Error(`${name}.${i}.b64 ${r.status}`);
        return r.text();
      })
    )
  );
  const raw = atob(texts.join('').replace(/\s+/g, ''));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  return img;
}

async function preload() {
  const [world, kitten, hubby, idle, rise, stop] = await Promise.all([
    loadImage('./assets/indoor-world.webp'),
    loadImage('./assets/characters/kitten-idle.png'),
    loadImage('./assets/characters/hubby-idle.png'),
    loadImage('./naili-motion-lab-assets/idle.webp'),
    loadChunkedWebp('rise', 2),
    loadChunkedWebp('stop', 2)
  ]);
  Object.assign(staticAssets, { world, kitten, hubby });
  Object.assign(sheets, {
    idle: { img: idle, cell: 20, cols: 8, count: 48, fps: 8 },
    rise: { img: rise, cell: 16, cols: 8, count: 66, fps: 12 },
    stop: { img: stop, cell: 16, cols: 8, count: 45, fps: 12 }
  });
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
  return (scene.actorHeights?.[role] || (role === 'naili' ? 72 : 176)) * perspective;
}

function drawStaticActor(img, x, z, role, nativeFacing = 1) {
  const h = actorHeight(role, z);
  const w = h * (img.width / img.height);
  const y = groundY(scene, z);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(nativeFacing, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

function currentSheet() {
  return sheets[state.phase] || sheets.idle;
}

function drawNaili() {
  const sheet = currentSheet();
  const frame = Math.max(0, Math.min(sheet.count - 1, Math.floor(state.frame)));
  const sx = (frame % sheet.cols) * sheet.cell;
  const sy = Math.floor(frame / sheet.cols) * sheet.cell;
  const h = actorHeight('naili', state.z);
  const w = h;
  const y = groundY(scene, state.z);

  ctx.save();
  ctx.translate(state.x, y);
  ctx.scale(state.dir, 1);
  ctx.drawImage(sheet.img, sx, sy, sheet.cell, sheet.cell, -w / 2, -h, w, h);
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
  ctx.drawImage(staticAssets.world, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawStaticActor(staticAssets.kitten, scene.spawn.player.x, scene.spawn.player.z, 'player', 1);
  drawStaticActor(staticAssets.hubby, scene.spawn.hubby.x, scene.spawn.hubby.z, 'hubby', -1);
  drawNaili();
  ctx.restore();
}

function distanceToTarget() {
  const dx = state.targetX - state.x;
  const dz = (state.targetZ - state.z) * 520;
  return Math.hypot(dx, dz);
}

function moveToward(delta, scale) {
  const dx = state.targetX - state.x;
  const dz = (state.targetZ - state.z) * 520;
  const metric = Math.hypot(dx, dz);
  if (metric < 0.001 || scale <= 0) return;
  const step = Math.min(metric, NAILI_SPEED * delta * scale);
  state.x += dx / metric * step;
  state.z += (dz / metric) * step / 520;
}

function riseMoveScale(frame) {
  if (frame <= 13) return 0;
  if (frame <= 20) return .15;
  if (frame <= 24) return .35 + (frame - 21) / 3 * .5;
  return 1;
}

function stopMoveScale(frame) {
  if (frame <= 5) return 1;
  if (frame <= 10) return .85 - (frame - 6) / 4 * .65;
  return 0;
}

function beginRun(targetX, targetZ) {
  if (state.phase !== 'idle') return;
  const dx = targetX - state.x;
  if (Math.abs(dx) < 70) return;
  state.targetX = clamp(targetX, 150, WORLD_WIDTH - 150);
  state.targetZ = clamp(targetZ, .70, .86);
  state.dir = dx >= 0 ? 1 : -1;
  state.phase = 'rise';
  state.frame = 0;
  state.frameClock = 0;
  statusEl.textContent = '奶栗起身了';
}

function beginStop() {
  state.phase = 'stop';
  state.frame = 0;
  state.frameClock = 0;
  statusEl.textContent = '奶栗刹车坐下';
}

function settleIdle() {
  state.x = state.targetX;
  state.z = state.targetZ;
  state.phase = 'idle';
  state.frame = 9;
  state.frameClock = 0;
  state.idleClock = 0;
  state.pendingAutoAt = performance.now() / 1000 + 2.3;
  statusEl.textContent = '奶栗静坐';
}

function update(delta, now) {
  if (state.phase === 'idle') {
    state.idleClock += delta;
    state.frame = 9 + Math.floor(state.idleClock * sheets.idle.fps) % (sheets.idle.count - 9);
    if (now >= state.pendingAutoAt) {
      const right = state.x < WORLD_WIDTH * .56;
      beginRun(right ? 1020 : 420, right ? .79 : .77);
    }
    return;
  }

  const sheet = currentSheet();
  state.frameClock += delta;
  const nextFrame = Math.floor(state.frameClock * sheet.fps);

  if (state.phase === 'rise') {
    let f = nextFrame;
    const remaining = distanceToTarget();
    if (f >= 25 && remaining <= 91) {
      beginStop();
      return;
    }
    if (f > 62 && remaining > 91) {
      f = 56 + ((f - 56) % 7);
    }
    f = Math.min(f, 62);
    state.frame = f;
    moveToward(delta, riseMoveScale(f));
    return;
  }

  if (state.phase === 'stop') {
    state.frame = Math.min(nextFrame, sheet.count - 1);
    moveToward(delta, stopMoveScale(state.frame));
    if (nextFrame >= sheet.count) settleIdle();
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
  if (p.z < .58 || p.z > .96) return;
  state.pendingAutoAt = Infinity;
  beginRun(p.x, p.z);
});

document.querySelector('#runLeft').addEventListener('click', () => {
  state.pendingAutoAt = Infinity;
  beginRun(390, .78);
});
document.querySelector('#runRight').addEventListener('click', () => {
  state.pendingAutoAt = Infinity;
  beginRun(1090, .80);
});
document.querySelector('#auto').addEventListener('click', () => {
  if (state.phase === 'idle') state.pendingAutoAt = performance.now() / 1000 + .35;
});

let last = performance.now();
function frame(ts) {
  const delta = Math.min(.05, (ts - last) / 1000);
  last = ts;
  update(delta, ts / 1000);
  render();
  requestAnimationFrame(frame);
}

await preload();
resize();
addEventListener('resize', resize);
statusEl.textContent = '奶栗静坐';
requestAnimationFrame(frame);
