import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createTerrain } from './vendor/luminous-lake/world/terrain.js';
import { createWater } from './vendor/luminous-lake/world/water.js';
import { createSky } from './vendor/luminous-lake/world/sky.js';
import { createAnimalsView } from './vendor/luminous-lake/world/animalsView.js';
import { createFishingBoat } from './vendor/luminous-lake/world/boat.js';
import { waveHeight } from './vendor/luminous-lake/sim/waves.js';
import {
  createCottage,
  createDock,
  pointOnDock,
  createFairies,
  createBillboardCharacter
} from './garden-hq-visuals.js';
import { createTerrainPbrMaterial } from './garden-pbr-terrain.js';
import { loadMaxAssets } from './garden-max-assets.js';

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
const WIND = .16;
const CALM = .76;
// Showcase stays in bright noon. No automatic day/night cycle.
const TIME_OF_DAY = .36;

let hintTimer = 0;
function status(s) {
  if (loadingText) loadingText.textContent = s;
}
function say(text, ms = 2600) {
  hint.textContent = text;
  hint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { hint.hidden = true; }, ms);
}
function fail(err) {
  console.error('[garden-max]', err);
  loading.classList.remove('done');
  status('加载失败：' + (err?.message || err || '未知错误'));
  loading.style.background = 'linear-gradient(#789f9a,#557973)';
}
window.addEventListener('error', (e) => fail(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => fail(e.reason));

async function loadAvatarTextures(renderer) {
  const tl = new THREE.TextureLoader();
  const urls = [
    './assets/characters/kitten-idle.png',
    './assets/characters/kitten-walk-1.png',
    './assets/characters/kitten-walk-2.png',
    './assets/characters/kitten-walk-3.png',
    './assets/characters/kitten-walk-4.png'
  ];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 4);
  const out = await Promise.all(urls.map(async (url) => {
    const t = await tl.loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    t.needsUpdate = true;
    return t;
  }));
  return { idle: out[0], walk: out.slice(1) };
}

async function boot() {
  status('初始化高清渲染器…');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
  let pixelCap = isMobile ? 1.45 : 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 62 : 52, innerWidth / innerHeight, .1, 820);

  status('重建湖岸地形…');
  const terrain = createTerrain(20260913);
  scene.add(terrain.mesh);

  status('铺真实 PBR 草地、沙岸和岩面…');
  try {
    terrain.mesh.material.dispose?.();
    terrain.mesh.material = await createTerrainPbrMaterial(renderer);
    terrain.mesh.receiveShadow = true;
  } catch (err) {
    console.warn('[garden-max] PBR terrain fallback', err);
    terrain.mesh.material = new THREE.MeshStandardMaterial({
      color: 0x88a86e, roughness: .92, metalness: 0, vertexColors: false
    });
  }

  status('铺透明湖水和动态倒影…');
  const water = createWater({ isMobile: true });
  water.refreshInterval = isMobile ? 11 : 6;
  water.normalEvery = isMobile ? 3 : 2;
  scene.add(water.mesh, water.cubeCamera);

  status('校准正午天空、阳光和空气透视…');
  const sky = createSky({});
  scene.add(sky.group);
  scene.environment = sky.envTexture;
  scene.fog = sky.fog;

  // Premium atmosphere pass. Use Poly Haven's real Misty Dawn panorama as
  // both the visible horizon and PBR light source, rather than a synthetic blue
  // dome. Keep the dynamic sun lights from Luminous Lake, but hide its visual sky.
  status('加载 Misty Dawn 真实天空、晨雾和环境光…');
  try {
    const hdr = await new RGBELoader().loadAsync(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/misty_dawn_2k.hdr'
    );
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdr;
    if ('backgroundIntensity' in scene) scene.backgroundIntensity = .92;
    if ('backgroundBlurriness' in scene) scene.backgroundBlurriness = .055;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envRT = pmrem.fromEquirectangular(hdr);
    scene.environment = envRT.texture;
    pmrem.dispose();

    // Re-parent only the dynamic light rig, then hide the old generated dome,
    // clouds and sprites so the photographed HDRI is the visible sky.
    scene.add(sky.sunLight, sky.sunLight.target, sky.hemi, sky.ambient);
    sky.group.visible = false;
  } catch (err) {
    console.warn('[garden-max] Misty Dawn HDR fallback', err);
    scene.environment = sky.envTexture;
  }

  // Real aerial perspective: closer, softer mist instead of the previous
  // crystal-clear 400 m mobile horizon.
  scene.fog = new THREE.FogExp2(0xb9c8c4, isMobile ? .0044 : .0036);
  sky.sunLight.castShadow = true;
  sky.sunLight.shadow.mapSize.set(isMobile ? 1536 : 2048, isMobile ? 1536 : 2048);
  sky.sunLight.shadow.camera.left = -72;
  sky.sunLight.shadow.camera.right = 72;
  sky.sunLight.shadow.camera.top = 72;
  sky.sunLight.shadow.camera.bottom = -72;
  sky.sunLight.shadow.camera.near = 3;
  sky.sunLight.shadow.camera.far = 240;
  sky.sunLight.shadow.bias = -.00045;

  // Independent daylight fill prevents mobile shadow maps from turning the shore
  // into a silhouette while preserving directional modelling.
  const fill = new THREE.HemisphereLight(0xe8f2ef, 0x596853, .42);
  const ambientFill = new THREE.AmbientLight(0xfff7ea, .07);
  scene.add(fill, ambientFill);

  const cottageX = 78.5, cottageZ = -11.5;
  const dockInfo = createDock({ heightAt: terrain.heightAt, x: 56.5, z: 0 });
  scene.add(dockInfo.group);

  const excludeNear = (x, z) => {
    if (Math.hypot(x - cottageX, z - cottageZ) < 13.3) return true;
    if (Math.abs(z - dockInfo.z) < 4.8 && x > 48.5 && x < 65) return true;
    if (Math.hypot(x - 69.5, z + 1) < 4.8) return true;
    return false;
  };

  // The previous foliage-atlas cards produced black/flat clumps on iPhone.
  // Premium ground cover now comes from real 3D GLB grass, ferns and scrub in
  // loadMaxAssets(), so keep the card meadow out of this comparison build.
  status('切换到全 3D 草丛和林下植被…');
  let meadow = null;

  status('载入真实针叶林、草丛、房子和 150 万面游艇…');
  const maxAssets = await loadMaxAssets({
    scene,
    renderer,
    heightAt: terrain.heightAt,
    isMobile,
    exclude: excludeNear,
    cottagePosition: new THREE.Vector3(cottageX, 0, cottageZ),
    boatPosition: new THREE.Vector3(51.2, .18, -2.6),
    onProgress: status
  });

  // Keep robust fallbacks, but only reveal them when a remote CC0 asset fails.
  if (!maxAssets.cottageRoot) {
    const fallbackCottage = createCottage({ heightAt: terrain.heightAt, x: cottageX, z: cottageZ });
    scene.add(fallbackCottage.group);
  }

  const boatRoot = maxAssets.boatRoot;
  if (!maxAssets.loaded.includes('boat')) {
    const fallbackBoat = createFishingBoat();
    fallbackBoat.group.scale.setScalar(1.42);
    fallbackBoat.group.position.set(0, 0, 0);
    boatRoot.add(fallbackBoat.group);
  }

  status('放回飞鸟、鱼、鹿、狐狸和湖边精灵…');
  const animals = createAnimalsView({ heightAt: terrain.heightAt, seed: 909 });
  scene.add(animals.group);
  const fairies = createFairies({ isMobile });
  scene.add(fairies.points);

  status('接回 NW 高清人物和走路帧…');
  const avatar = createBillboardCharacter('./assets/characters/kitten-idle.png', { width: 2.78, height: 5.22 });
  avatar.sprite.castShadow = false; // use the soft ground blob; never cast a rectangular billboard shadow
  scene.add(avatar.group);
  avatar.group.position.set(69.5, terrain.heightAt(69.5, -1) + .03, -1);

  let avatarFrames = null;
  try {
    avatarFrames = await loadAvatarTextures(renderer);
    avatar.sprite.material.map = avatarFrames.idle;
    avatar.sprite.material.needsUpdate = true;
  } catch (err) {
    console.warn('[garden-max] avatar animation textures failed', err);
  }

  // Hide soft particles from live reflection; house, real trees and boat remain reflected.
  water.hiddenFromReflection = [
    sky.cloudGroup,
    sky.moonHalo,
    sky.stars,
    animals.group,
    animals.fireflyPoints,
    fairies.points,
    avatar.group,
    ...(meadow ? [meadow.group] : [])
  ];

  status('加近景环境遮蔽和接触阴影…');
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const ssaoPass = new SSAOPass(scene, camera, innerWidth, innerHeight);
  ssaoPass.kernelRadius = isMobile ? 7 : 10;
  ssaoPass.minDistance = .0025;
  ssaoPass.maxDistance = .11;
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(ssaoPass);
  composer.addPass(outputPass);
  // Foliage uses alpha cards. Mobile SSAO override materials would treat those
  // cards as opaque rectangles, so keep SSAO for desktop and use real shadows
  // plus the daylight fill on iPhone.
  ssaoPass.enabled = !isMobile;
  let ssaoEnabled = !isMobile;
  composer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.6));

  const move = { x: 0, y: 0 };
  const keys = new Set();
  const boatState = { active: false, speed: 0, yaw: 0 };
  let stickPointer = null;
  let camDrag = null;
  const camPointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartCameraDistance = 0;
  let camYaw = 1.86;
  let camPitch = .31;
  let camDistance = 10.4;
  let bob = 0;
  let worldTime = 0;
  let qualityTimer = 0;
  let fpsAccum = 0;
  let fpsFrames = 0;
  let qualityReduced = false;
  let firstSky = true;
  let walking = false;

  function onDock(x, z) {
    return pointOnDock(x, z, dockInfo);
  }
  function groundY(x, z) {
    return onDock(x, z) ? dockInfo.topY + .09 : terrain.heightAt(x, z) + .03;
  }
  function cottageBlocked(x, z) {
    const dx = x - cottageX, dz = z - cottageZ;
    return Math.abs(dx) < 6.2 && Math.abs(dz) < 5.5;
  }
  function canWalk(x, z) {
    const r = Math.hypot(x, z);
    if (r > 150 || cottageBlocked(x, z)) return false;
    if (onDock(x, z)) return true;
    return terrain.heightAt(x, z) > .17;
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

  // Camera is fully user-owned: one finger orbits, two fingers pinch-zoom.
  // Never snap the yaw back after the user rotates it.
  cameraPad.style.touchAction = 'none';

  function currentPinchDistance() {
    const pts = [...camPointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  cameraPad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    camPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cameraPad.setPointerCapture(e.pointerId);

    if (camPointers.size === 1) {
      camDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (camPointers.size === 2) {
      camDrag = null;
      pinchStartDistance = Math.max(1, currentPinchDistance());
      pinchStartCameraDistance = camDistance;
    }
  });

  cameraPad.addEventListener('pointermove', (e) => {
    if (!camPointers.has(e.pointerId)) return;
    e.preventDefault();
    camPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (camPointers.size >= 2) {
      const d = Math.max(1, currentPinchDistance());
      camDistance = clamp(pinchStartCameraDistance * (pinchStartDistance / d), 5.0, 34);
      return;
    }

    if (!camDrag || camDrag.id !== e.pointerId) {
      camDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      return;
    }

    camYaw -= (e.clientX - camDrag.x) * .0056;
    camPitch = clamp(camPitch - (e.clientY - camDrag.y) * .0044, .08, 1.12);
    camDrag.x = e.clientX;
    camDrag.y = e.clientY;
  });

  function releaseCameraPointer(e) {
    camPointers.delete(e.pointerId);
    if (camPointers.size === 1) {
      const [id, p] = camPointers.entries().next().value;
      camDrag = { id, x: p.x, y: p.y };
    } else {
      camDrag = null;
    }
    pinchStartDistance = 0;
  }

  cameraPad.addEventListener('pointerup', releaseCameraPointer);
  cameraPad.addEventListener('pointercancel', releaseCameraPointer);
  addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('wheel', (e) => {
    camDistance = clamp(camDistance + Math.sign(e.deltaY) * .65, 5.0, 34);
  }, { passive: true });

  function nearBoat() {
    if (boatState.active) return false;
    // Real-scale 10.6 m narrowboat is ~32 NW units long at the current
    // character scale, so allow boarding from the dock beside the hull
    // instead of requiring the avatar to reach the boat's centre in water.
    return avatar.group.position.distanceTo(boatRoot.position) < 34.0;
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
    say('上船了。左下摇杆控制速度和转向。', 3200);
  }
  function leaveBoat() {
    boatState.active = false;
    boatState.speed = 0;
    avatar.group.position.set(61.1, groundY(61.1, 0), 0);
    say('回到码头。');
  }

  action.addEventListener('click', () => {
    if (boatState.active) leaveBoat();
    else if (nearBoat()) boardBoat();
    else say('沿着小路往码头走，船就在水边。');
  });
  $('#back').addEventListener('click', () => { location.href = './index.html'; });
  $('#help').addEventListener('click', () => { helpPanel.hidden = false; });
  $('#closeHelp').addEventListener('click', () => { helpPanel.hidden = true; });
  helpPanel.addEventListener('click', (e) => { if (e.target === helpPanel) helpPanel.hidden = true; });

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const localPassenger = new THREE.Vector3(.05, maxAssets.boatPassengerY ?? 1.10, .05);
  const passengerWorld = new THREE.Vector3();

  function inputVector() {
    const k = keyboardInput();
    const useStick = Math.abs(move.x) + Math.abs(move.y) > .05;
    return { x: useStick ? move.x : k.x, y: useStick ? move.y : k.y };
  }

  function setAvatarFrame(isWalking) {
    if (!avatarFrames) return;
    let next = avatarFrames.idle;
    if (isWalking) {
      const idx = Math.floor(worldTime * 7.3) % avatarFrames.walk.length;
      next = avatarFrames.walk[idx];
    }
    if (avatar.sprite.material.map !== next) {
      avatar.sprite.material.map = next;
      avatar.sprite.material.needsUpdate = true;
    }
  }

  function updateAvatar(dt) {
    if (boatState.active) {
      passengerWorld.copy(localPassenger);
      boatRoot.localToWorld(passengerWorld);
      avatar.group.position.copy(passengerWorld);
      avatar.shadow.visible = false;
      walking = false;
      setAvatarFrame(false);
      return;
    }

    avatar.shadow.visible = true;
    const inp = inputVector();
    const mag = clamp(Math.hypot(inp.x, inp.y), 0, 1);
    walking = mag > .05;
    setAvatarFrame(walking);
    if (walking) {
      forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
      right.set(-forward.z, 0, forward.x);
      dir.copy(forward).multiplyScalar(inp.y).addScaledVector(right, inp.x).normalize();
      const speed = 5.05;
      const nx = avatar.group.position.x + dir.x * speed * dt;
      const nz = avatar.group.position.z + dir.z * speed * dt;
      if (canWalk(nx, nz)) {
        avatar.group.position.x = nx;
        avatar.group.position.z = nz;
        avatar.group.position.y = groundY(nx, nz);
      }
      bob += dt * 10.2;
      avatar.sprite.position.y = Math.abs(Math.sin(bob)) * .018;
    } else {
      avatar.sprite.position.y = 0;
      bob = 0;
    }
  }

  let shoreWarnAt = 0;
  function updateBoat(dt) {
    if (!boatState.active) {
      const x = boatRoot.position.x, z = boatRoot.position.z;
      const surface = waveHeight(x, z, worldTime, CALM, WIND);
      boatRoot.position.y = surface * .82 + .13;
      boatRoot.rotation.x = Math.sin(worldTime * .71) * .009;
      boatRoot.rotation.z = Math.cos(worldTime * .61) * .012;
      return;
    }

    const inp = inputVector();
    const throttle = inp.y, steer = inp.x;
    boatState.speed += throttle * dt * 3.85;
    boatState.speed *= Math.pow(.974, dt * 60);
    boatState.speed = clamp(boatState.speed, -1.6, 5.55);
    const steerGrip = .34 + .66 * Math.min(1, Math.abs(boatState.speed) / 2.2);
    boatState.yaw -= steer * dt * 1.2 * steerGrip * Math.sign(boatState.speed || 1);

    dir.set(Math.cos(boatState.yaw), 0, -Math.sin(boatState.yaw));
    const nx = boatRoot.position.x + dir.x * boatState.speed * dt;
    const nz = boatRoot.position.z + dir.z * boatState.speed * dt;
    const r = Math.hypot(nx, nz);
    if (r < 57.5 && r > 4.5) {
      boatRoot.position.x = nx;
      boatRoot.position.z = nz;
    } else {
      boatState.speed *= .28;
      if (worldTime > shoreWarnAt) {
        shoreWarnAt = worldTime + 1.3;
        say('浅水碰岸了，转回湖心一点。', 950);
      }
    }

    const x = boatRoot.position.x, z = boatRoot.position.z;
    const surface = waveHeight(x, z, worldTime, CALM, WIND);
    const e = 1.2;
    const sx = (waveHeight(x + e, z, worldTime, CALM, WIND) - waveHeight(x - e, z, worldTime, CALM, WIND)) / (2 * e);
    const sz = (waveHeight(x, z + e, worldTime, CALM, WIND) - waveHeight(x, z - e, worldTime, CALM, WIND)) / (2 * e);
    boatRoot.position.y = surface * .86 + .13;
    boatRoot.rotation.y = boatState.yaw;
    boatRoot.rotation.x = clamp(sz * .42, -.11, .11);
    boatRoot.rotation.z = clamp(-sx * .42 - steer * .03, -.12, .12);
  }

  function updateBillboard() {
    const dx = camera.position.x - avatar.group.position.x;
    const dz = camera.position.z - avatar.group.position.z;
    avatar.sprite.rotation.y = Math.atan2(dx, dz);
  }

  function updateCamera(dt) {
    const target = (boatState.active ? boatRoot.position : avatar.group.position).clone();
    target.y += boatState.active ? 2.0 : 2.45;
    // Deliberately no auto-follow / no yaw recenter. Wherever the user leaves
    // the camera is where it stays, on foot and while boating.
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
    if (qualityTimer < 5) return;
    const fps = fpsFrames / fpsAccum;
    qualityTimer = fpsAccum = 0;
    fpsFrames = 0;
    if (!qualityReduced && isMobile && fps < 31) {
      qualityReduced = true;
      pixelCap = 1.12;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
      composer.setPixelRatio(1);
      ssaoPass.enabled = false;
      ssaoEnabled = false;
      water.refreshInterval = 15;
      water.normalEvery = 4;
      meadow?.reduce();
      say('已自动减少后期负担，3D模型和场景布局保留。', 2200);
    }
  }

  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = camera.aspect < .8 ? 62 : 52;
    camera.updateProjectionMatrix();
    composer.setSize(innerWidth, innerHeight);
    if (ssaoEnabled) composer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.6));
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 180));
  resize();

  const clock = new THREE.Clock();
  let firstFrame = true;

  function frame() {
    const dt = Math.min(.04, Math.max(.001, clock.getDelta()));
    worldTime += dt;

    sky.update(TIME_OF_DAY, .035, 0, dt, WIND, firstSky);
    sky.sunLight.position.x += 60;
    sky.sunLight.target.position.set(60, 0, 0);
    sky.sunLight.target.updateMatrixWorld();
    sky.sunLight.intensity *= 1.12;
    sky.hemi.intensity = Math.max(.60, sky.hemi.intensity);
    firstSky = false;

    water.setCalmLook(CALM);
    water.setNightLook(0);
    water.update(worldTime, CALM, WIND);

    meadow?.update(worldTime);
    fairies.update(worldTime);
    animals.update(dt, worldTime, {
      density: .68,
      calmness: CALM,
      wind: WIND,
      fireflyVis: 0,
      fireflyCap: 0
    });

    updateAvatar(dt);
    updateBoat(dt);
    updateCamera(dt);
    updateBillboard();
    updateAction();
    updateQuality(dt);

    water.updateReflection(renderer, scene);
    composer.render();

    if (firstFrame) firstFrame = false;
    requestAnimationFrame(frame);
  }

  // Start with lake, cottage and real foreground trees in frame.
  camera.position.set(77, 8.2, 9.5);
  camera.lookAt(67, 2.2, -2);

  status('最后编译阳光、材质和环境遮蔽…');
  // Compile after all assets are present so the user never sees shader pop-in.
  try {
    await renderer.compileAsync?.(scene, camera);
  } catch (err) {
    console.warn('[garden-max] compileAsync skipped', err);
  }

  frame();
  requestAnimationFrame(() => {
    loading.classList.add('done');
    const note = maxAssets.failed.length
      ? '晨雾森林版已开。个别外部资产走了备用版本。'
      : '晨雾森林版已开。Misty Dawn 天空、3D 草丛、针叶林和高模游艇都已载入。';
    say(note, 4300);
  });
}

boot().catch(fail);
