import * as THREE from 'three';
import { createTerrain } from './vendor/luminous-lake/world/terrain.js';
import { createWater } from './vendor/luminous-lake/world/water.js';
import { createSky } from './vendor/luminous-lake/world/sky.js';
import { createAnimalsView } from './vendor/luminous-lake/world/animalsView.js';
import { createFishingBoat } from './vendor/luminous-lake/world/boat.js';
import { waveHeight } from './vendor/luminous-lake/sim/waves.js';
import {
  createGroundDetailTexture,
  createCottage,
  createGrassField,
  createDetailedTrees,
  createBackgroundForest,
  createRocks,
  createDock,
  pointOnDock,
  createFairies,
  createBillboardCharacter
} from './garden-hq-visuals.js';

const $ = (q) => document.querySelector(q);
const canvas = $('#world3d');
const loading = $('#loading');
const loadingText = $('#loadingText');
const hint = $('#hint');
const mode = $('#mode');
const action = $('#action');
const stick = $('#stick');
const knob = $('#knob');
const cameraPad = $('#cameraPad');
const helpPanel = $('#helpPanel');

const isMobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 720;
const clamp = THREE.MathUtils.clamp;
const WIND = .22;
const CALM = .72;
const TIME_OF_DAY = .34;
let hintTimer = 0;

function status(s) {
  if (loadingText) loadingText.textContent = s;
}
function say(text, ms = 2600) {
  hint.textContent = text;
  hint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.hidden = true, ms);
}
function fail(err) {
  console.error(err);
  loading.classList.remove('done');
  status('加载失败：' + (err?.message || err || '未知错误'));
  loading.style.background = 'linear-gradient(#779b91,#54746c)';
}
window.addEventListener('error', (e) => fail(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => fail(e.reason));

let renderer;
try {
  status('初始化高清渲染器…');
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
} catch (err) {
  fail(err);
  throw err;
}

let pixelCap = isMobile ? 1.55 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.03;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 62 : 52, innerWidth / innerHeight, .1, 820);

status('重建有起伏的湖岸地形…');
const terrain = createTerrain(20260913);
scene.add(terrain.mesh);
const groundDetail = createGroundDetailTexture();
terrain.mesh.material.map = groundDetail;
terrain.mesh.material.bumpMap = groundDetail;
terrain.mesh.material.bumpScale = .14;
terrain.mesh.material.needsUpdate = true;

status('铺透明水体和动态倒影…');
const water = createWater({ isMobile: true });
water.refreshInterval = isMobile ? 7 : 4;
water.normalEvery = isMobile ? 3 : 2;
scene.add(water.mesh, water.cubeCamera);

status('调整天空、自然光和空气透视…');
const sky = createSky({});
scene.add(sky.group);
scene.environment = sky.envTexture;
scene.fog = sky.fog;
sky.fog.near = isMobile ? 150 : 170;
sky.fog.far = isMobile ? 380 : 450;
sky.sunLight.castShadow = true;
sky.sunLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
sky.sunLight.shadow.camera.left = -65;
sky.sunLight.shadow.camera.right = 65;
sky.sunLight.shadow.camera.top = 65;
sky.sunLight.shadow.camera.bottom = -65;
sky.sunLight.shadow.camera.far = 220;

const cottageX = 78, cottageZ = -11;
const dockInfo = createDock({ heightAt: terrain.heightAt, x: 56.5, z: 0 });
scene.add(dockInfo.group);

const excludeNear = (x, z) => {
  if (Math.hypot(x - cottageX, z - cottageZ) < 13.5) return true;
  if (Math.abs(z - dockInfo.z) < 5.5 && x > 49 && x < 73) return true;
  if (Math.hypot(x - 72, z + 1) < 5.5) return true;
  return false;
};

status('把湖边小屋、树林和草地换成精细版…');
const cottage = createCottage({ heightAt: terrain.heightAt, x: cottageX, z: cottageZ });
scene.add(cottage.group);

const backgroundForest = createBackgroundForest({ heightAt: terrain.heightAt, isMobile });
scene.add(backgroundForest);

const detailedTrees = createDetailedTrees({ heightAt: terrain.heightAt, isMobile, exclude: excludeNear });
scene.add(detailedTrees);

const grass = createGrassField({ heightAt: terrain.heightAt, isMobile, exclude: excludeNear });
scene.add(grass.mesh);

const rocks = createRocks({ heightAt: terrain.heightAt, isMobile, exclude: excludeNear });
scene.add(rocks);

status('放回动物、鱼和岸边的小精灵…');
const animals = createAnimalsView({ heightAt: terrain.heightAt, seed: 909 });
scene.add(animals.group);

const fairies = createFairies({ isMobile });
scene.add(fairies.points);

status('把 NW 小猫接进 3D 世界…');
const avatar = createBillboardCharacter('./assets/kitten.png', { width: 2.7, height: 5.15 });
scene.add(avatar.group);
avatar.group.position.set(72, terrain.heightAt(72, -1) + .03, -1);

status('把木船停到码头边…');
const boat = createFishingBoat();
boat.group.scale.setScalar(1.42);
boat.group.position.set(51.4, .18, -2.6);
boat.group.rotation.y = 0;
scene.add(boat.group);

water.hiddenFromReflection = [
  sky.cloudGroup,
  sky.moonHalo,
  sky.stars,
  animals.fireflyPoints,
  fairies.points
];

const move = { x: 0, y: 0 };
const keys = new Set();
const boatState = { active: false, speed: 0, yaw: 0 };
let stickPointer = null;
let camDrag = null;
let camYaw = Math.PI / 2;
let camPitch = .34;
let camDistance = 10.4;
let bob = 0;
let worldTime = 0;
let qualityTimer = 0;
let fpsAccum = 0;
let fpsFrames = 0;
let qualityReduced = false;
let firstSky = true;

function onDock(x, z) {
  return pointOnDock(x, z, dockInfo);
}
function groundY(x, z) {
  return onDock(x, z) ? dockInfo.topY + .09 : terrain.heightAt(x, z) + .03;
}
function cottageBlocked(x, z) {
  const dx = x - cottageX, dz = z - cottageZ;
  // cottage is rotated 90°, so keep a soft rectangular collision zone.
  return Math.abs(dx) < 4.7 && Math.abs(dz) < 5.7;
}
function canWalk(x, z) {
  const r = Math.hypot(x, z);
  if (r > 148 || cottageBlocked(x, z)) return false;
  if (onDock(x, z)) return true;
  return terrain.heightAt(x, z) > .18;
}

function keyboardInput() {
  let x = 0, y = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y++;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y--;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x--;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

function setStick(e) {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const max = 36, l = Math.hypot(dx, dy);
  if (l > max) { dx *= max / l; dy *= max / l; }
  move.x = dx / max;
  move.y = -dy / max;
  knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
}
stick.addEventListener('pointerdown', (e) => {
  stickPointer = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  setStick(e);
});
stick.addEventListener('pointermove', (e) => {
  if (e.pointerId === stickPointer) setStick(e);
});
function releaseStick(e) {
  if (stickPointer !== null && e.pointerId !== stickPointer) return;
  stickPointer = null;
  move.x = move.y = 0;
  knob.style.transform = 'translate(0,0)';
}
stick.addEventListener('pointerup', releaseStick);
stick.addEventListener('pointercancel', releaseStick);

cameraPad.addEventListener('pointerdown', (e) => {
  camDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  cameraPad.setPointerCapture(e.pointerId);
});
cameraPad.addEventListener('pointermove', (e) => {
  if (!camDrag || camDrag.id !== e.pointerId) return;
  camYaw -= (e.clientX - camDrag.x) * .0058;
  camPitch = clamp(camPitch - (e.clientY - camDrag.y) * .0045, .16, .66);
  camDrag.x = e.clientX;
  camDrag.y = e.clientY;
});
cameraPad.addEventListener('pointerup', (e) => { if (camDrag?.id === e.pointerId) camDrag = null; });
cameraPad.addEventListener('pointercancel', (e) => { if (camDrag?.id === e.pointerId) camDrag = null; });
addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('wheel', (e) => {
  camDistance = clamp(camDistance + Math.sign(e.deltaY) * .65, 6.2, 16);
}, { passive: true });

function nearBoat() {
  if (boatState.active) return false;
  const p = avatar.group.position;
  return p.distanceTo(boat.group.position) < 5.6;
}
function updateAction() {
  if (boatState.active) {
    action.textContent = '下船';
    action.classList.add('ready');
    mode.textContent = '湖面航行';
  } else if (nearBoat()) {
    action.textContent = '上船';
    action.classList.add('ready');
    mode.textContent = '码头边';
  } else {
    action.textContent = '去码头';
    action.classList.remove('ready');
    mode.textContent = '湖岸散步';
  }
}

function boardBoat() {
  boatState.active = true;
  boatState.speed = 0;
  say('上船了。左下摇杆控制速度和转向。', 3300);
}
function leaveBoat() {
  boatState.active = false;
  boatState.speed = 0;
  avatar.group.position.set(61.2, groundY(61.2, 0), 0);
  say('回到码头。');
}

action.addEventListener('click', () => {
  if (boatState.active) leaveBoat();
  else if (nearBoat()) boardBoat();
  else say('顺着湖岸往左前方走，码头和木船就在水边。');
});
$('#back').addEventListener('click', () => { location.href = './index.html'; });
$('#help').addEventListener('click', () => { helpPanel.hidden = false; });
$('#closeHelp').addEventListener('click', () => { helpPanel.hidden = true; });
helpPanel.addEventListener('click', (e) => { if (e.target === helpPanel) helpPanel.hidden = true; });

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const dir = new THREE.Vector3();
const localPassenger = new THREE.Vector3(.25, 1.02, 0);
const passengerWorld = new THREE.Vector3();

function inputVector() {
  const k = keyboardInput();
  const useStick = Math.abs(move.x) + Math.abs(move.y) > .05;
  return { x: useStick ? move.x : k.x, y: useStick ? move.y : k.y };
}

function updateAvatar(dt) {
  if (boatState.active) {
    passengerWorld.copy(localPassenger);
    boat.group.localToWorld(passengerWorld);
    avatar.group.position.copy(passengerWorld);
    avatar.group.position.y += .08;
    avatar.shadow.visible = false;
    return;
  }

  avatar.shadow.visible = true;
  const inp = inputVector();
  const mag = clamp(Math.hypot(inp.x, inp.y), 0, 1);
  if (mag > .05) {
    forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    right.set(-forward.z, 0, forward.x);
    dir.copy(forward).multiplyScalar(inp.y).addScaledVector(right, inp.x).normalize();
    const speed = 5.0;
    const nx = avatar.group.position.x + dir.x * speed * dt;
    const nz = avatar.group.position.z + dir.z * speed * dt;
    if (canWalk(nx, nz)) {
      avatar.group.position.x = nx;
      avatar.group.position.z = nz;
      avatar.group.position.y = groundY(nx, nz);
    }
    bob += dt * 10.5;
    avatar.sprite.position.y = Math.abs(Math.sin(bob)) * .025;
  } else {
    avatar.sprite.position.y = 0;
    bob = 0;
  }
}

let shoreWarnAt = 0;
function updateBoat(dt) {
  if (!boatState.active) {
    const x = boat.group.position.x, z = boat.group.position.z;
    const surface = waveHeight(x, z, worldTime, CALM, WIND);
    boat.group.position.y = surface * .82 + .18;
    boat.group.rotation.x = Math.sin(worldTime * .7) * .012;
    boat.group.rotation.z = Math.cos(worldTime * .63) * .014;
    return;
  }

  const inp = inputVector();
  const throttle = inp.y;
  const steer = inp.x;
  boatState.speed += throttle * dt * 3.9;
  boatState.speed *= Math.pow(.973, dt * 60);
  boatState.speed = clamp(boatState.speed, -1.7, 5.7);
  const steerGrip = .35 + .65 * Math.min(1, Math.abs(boatState.speed) / 2.2);
  boatState.yaw -= steer * dt * 1.22 * steerGrip * Math.sign(boatState.speed || 1);

  dir.set(Math.cos(boatState.yaw), 0, -Math.sin(boatState.yaw));
  const nx = boat.group.position.x + dir.x * boatState.speed * dt;
  const nz = boat.group.position.z + dir.z * boatState.speed * dt;
  const r = Math.hypot(nx, nz);
  if (r < 57.5 && r > 4.5) {
    boat.group.position.x = nx;
    boat.group.position.z = nz;
  } else {
    boatState.speed *= .28;
    if (worldTime > shoreWarnAt) {
      shoreWarnAt = worldTime + 1.4;
      say(r >= 57.5 ? '浅水碰岸了，转回湖心一点。' : '湖心这边先留一点距离。', 950);
    }
  }

  const x = boat.group.position.x, z = boat.group.position.z;
  const surface = waveHeight(x, z, worldTime, CALM, WIND);
  const e = 1.2;
  const sx = (waveHeight(x + e, z, worldTime, CALM, WIND) - waveHeight(x - e, z, worldTime, CALM, WIND)) / (2 * e);
  const sz = (waveHeight(x, z + e, worldTime, CALM, WIND) - waveHeight(x, z - e, worldTime, CALM, WIND)) / (2 * e);
  boat.group.position.y = surface * .86 + .18;
  boat.group.rotation.y = boatState.yaw;
  boat.group.rotation.x = clamp(sz * .45, -.12, .12);
  boat.group.rotation.z = clamp(-sx * .45 - steer * .035, -.13, .13);
}

function updateBillboard() {
  // Keep the high-resolution 2D NW character facing the camera in the 3D world.
  const dx = camera.position.x - avatar.group.position.x;
  const dz = camera.position.z - avatar.group.position.z;
  avatar.sprite.rotation.y = Math.atan2(dx, dz);
}

function updateCamera(dt) {
  const target = (boatState.active ? boat.group.position : avatar.group.position).clone();
  target.y += boatState.active ? 2.1 : 2.45;

  if (boatState.active && !camDrag) {
    const behind = boatState.yaw + Math.PI / 2;
    let d = Math.atan2(Math.sin(behind - camYaw), Math.cos(behind - camYaw));
    camYaw += d * Math.min(.025, dt * 1.25);
  }

  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  const desired = new THREE.Vector3(
    target.x + Math.sin(camYaw) * cp * camDistance,
    target.y + sp * camDistance,
    target.z + Math.cos(camYaw) * cp * camDistance
  );
  camera.position.lerp(desired, 1 - Math.pow(.0025, dt));
  camera.lookAt(target);
}

function updateQuality(dt) {
  qualityTimer += dt;
  fpsAccum += dt;
  fpsFrames++;
  if (qualityTimer < 4.5) return;
  const fps = fpsFrames / fpsAccum;
  qualityTimer = fpsAccum = 0;
  fpsFrames = 0;
  if (!qualityReduced && isMobile && fps < 36) {
    qualityReduced = true;
    pixelCap = 1.15;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
    water.refreshInterval = 12;
    water.normalEvery = 4;
    grass.mesh.count = Math.floor(grass.mesh.count * .68);
    say('已自动切到流畅画质，场景内容不变。', 2200);
  }
}

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < .8 ? 62 : 52;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 180));
resize();

const clock = new THREE.Clock();
let firstFrame = true;
function frame() {
  const dt = Math.min(.04, Math.max(.001, clock.getDelta()));
  worldTime += dt;

  sky.update(TIME_OF_DAY, .08, 0, dt, WIND, firstSky);
  // Keep the sun direction from Luminous Lake, but center the shadow frustum on
  // the playable cottage/shore instead of the middle of the lake.
  sky.sunLight.position.x += 60;
  sky.sunLight.target.position.set(60, 0, 0);
  sky.sunLight.target.updateMatrixWorld();
  firstSky = false;

  water.setCalmLook(CALM);
  water.setNightLook(0);
  water.update(worldTime, CALM, WIND);

  grass.update(worldTime);
  fairies.update(worldTime);
  animals.update(dt, worldTime, {
    density: .76,
    calmness: CALM,
    wind: WIND,
    fireflyVis: .20,
    fireflyCap: isMobile ? 55 : 90
  });

  updateAvatar(dt);
  updateBoat(dt);
  updateCamera(dt);
  updateBillboard();
  updateAction();
  updateQuality(dt);

  water.updateReflection(renderer, scene);
  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    loading.classList.add('done');
    say('精细湖岸开了。草、树林、小屋、动物和船都换了新底座。', 4000);
  }
  requestAnimationFrame(frame);
}

try {
  status('最后整理手机画质和倒影…');
  camera.position.set(82, 8, 8);
  camera.lookAt(66, 2, -1);
  frame();
} catch (err) {
  fail(err);
}
