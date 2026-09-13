import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { seededRandom } from './garden-hq-visuals.js';

const loader = new GLTFLoader();
const MAX_ANISO = 8;

const URLS = {
  mapleA: './assets/3d-cc0/MapleTree_1.gltf',
  mapleB: './assets/3d-cc0/MapleTree_4.gltf',
  birch: './assets/3d-cc0/BirchTree_2.gltf',
  bushLarge: './assets/3d-cc0/Bush_Large_Flowers.gltf',
  bushSmall: './assets/3d-cc0/Bush_Small_Flowers.gltf',
  oak: 'https://cdn.3dassets.dev/assets/28312/v1/model.glb',
  cottage: 'https://cdn.3dassets.dev/assets/32485/v1/model.glb',
  highBoat: 'https://cdn.jsdelivr.net/gh/bob6664569/open-water@main/site/assets/boats/motoryacht_10.7r.glb',
  coniferTall: 'https://cdn.3dassets.dev/assets/32683/v1/model.glb',
  coniferMid: 'https://cdn.3dassets.dev/assets/32684/v1/model.glb',
  coniferYoung: 'https://cdn.3dassets.dev/assets/32685/v1/model.glb',
  undergrowth: 'https://cdn.3dassets.dev/assets/32689/v1/model.glb',
  fern: 'https://cdn.3dassets.dev/assets/32690/v1/model.glb',
  grassClump: 'https://cdn.3dassets.dev/assets/28386/v1/model.glb',
  fallenLog: 'https://cdn.3dassets.dev/assets/32687/v1/model.glb',
  boatHull: 'https://cdn.3dassets.dev/assets/31642/v1/model.glb',
  boatRudder: 'https://cdn.3dassets.dev/assets/31644/v1/model.glb',
  boatVent: 'https://cdn.3dassets.dev/assets/31646/v1/model.glb',
  boatChimney: 'https://cdn.3dassets.dev/assets/31647/v1/model.glb',
  boatRope: 'https://cdn.3dassets.dev/assets/31648/v1/model.glb',
  boatHook: 'https://cdn.3dassets.dev/assets/31650/v1/model.glb',
  boulder: 'https://cdn.3dassets.dev/assets/32688/v1/model.glb'
};

function prep(root, renderer, { castShadow = true, receiveShadow = true } = {}) {
  const aniso = Math.min(MAX_ANISO, renderer.capabilities.getMaxAnisotropy?.() || 4);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = castShadow;
    o.receiveShadow = receiveShadow;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    for (const mat of materials) {
      if (!mat) continue;
      if ('roughness' in mat && !Number.isFinite(mat.roughness)) mat.roughness = .78;
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = aniso;
        mat.map.needsUpdate = true;
      }
      if (mat.normalMap) {
        mat.normalMap.anisotropy = aniso;
        mat.normalMap.needsUpdate = true;
      }
      if (mat.alphaTest > 0 || mat.name?.toLowerCase().includes('leaf')) {
        mat.alphaTest = Math.max(.28, mat.alphaTest || 0);
        mat.transparent = false;
        mat.depthWrite = true;
        mat.side = THREE.DoubleSide;
      }
      mat.needsUpdate = true;
    }
  });
  return root;
}

function normalizeModel(root, {
  targetHeight = null,
  targetLongest = null,
  bottom = 0,
  centerXZ = true,
  rotateLongestToX = false
} = {}) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());

  if (rotateLongestToX && size.z > size.x * 1.08) {
    root.rotation.y += Math.PI / 2;
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
  }

  const source = targetHeight ? size.y : Math.max(size.x, size.z);
  const target = targetHeight ?? targetLongest ?? source;
  if (source > 0 && target) {
    const s = target / source;
    root.scale.multiplyScalar(s);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
  }

  const center = box.getCenter(new THREE.Vector3());
  const min = box.min.clone();
  if (centerXZ) {
    root.position.x -= center.x;
    root.position.z -= center.z;
  }
  root.position.y += bottom - min.y;
  root.updateMatrixWorld(true);
  return root;
}

async function loadPrepared(url, renderer, options = {}) {
  const gltf = await loader.loadAsync(url);
  const root = prep(gltf.scene || gltf.scenes?.[0], renderer, options);
  return root;
}

function asNormalizedHolder(root, norm) {
  normalizeModel(root, norm);
  const holder = new THREE.Group();
  holder.add(root);
  return holder;
}

function clonePlaced(template, x, y, z, scale, rotationY, shadow = false) {
  const c = template.clone(true);
  c.position.set(x, y, z);
  c.rotation.y += rotationY;
  c.scale.multiplyScalar(scale);
  c.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = shadow;
      o.receiveShadow = true;
    }
  });
  return c;
}

function validSpot(x, z, heightAt, exclude) {
  const h = heightAt(x, z);
  return h > .35 && h < 9.5 && !exclude(x, z);
}

function makeInstancedCopies(template, matrices, name, { castShadow = false, receiveShadow = true } = {}) {
  const group = new THREE.Group();
  group.name = name;
  template.updateMatrixWorld(true);
  const composed = new THREE.Matrix4();

  template.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.material) return;
    const inst = new THREE.InstancedMesh(o.geometry, o.material, matrices.length);
    inst.name = name + '-' + (o.name || 'mesh');
    inst.castShadow = castShadow;
    inst.receiveShadow = receiveShadow;
    inst.frustumCulled = true;
    for (let i = 0; i < matrices.length; i++) {
      composed.multiplyMatrices(matrices[i], o.matrixWorld);
      inst.setMatrixAt(i, composed);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  });
  return group;
}

function placementMatrix(x, y, z, scale, yaw, tiltX = 0, tiltZ = 0) {
  const d = new THREE.Object3D();
  d.position.set(x, y, z);
  d.rotation.set(tiltX, yaw, tiltZ);
  d.scale.setScalar(scale);
  d.updateMatrix();
  return d.matrix.clone();
}

function meshTriangleCount(mesh) {
  if (!mesh?.isMesh || !mesh.geometry?.getAttribute('position')) return 0;
  const g = mesh.geometry;
  return Math.floor((g.index ? g.index.count : g.getAttribute('position').count) / 3);
}

export async function loadMaxAssets({
  scene,
  renderer,
  heightAt,
  isMobile,
  exclude = () => false,
  cottagePosition = new THREE.Vector3(79, 0, -12),
  boatPosition = new THREE.Vector3(51.4, .18, -2.6),
  onProgress = () => {}
}) {
  const result = {
    natureGroup: new THREE.Group(),
    cottageRoot: null,
    boatRoot: new THREE.Group(),
    failed: [],
    loaded: []
  };
  result.natureGroup.name = 'max-asset-nature';
  result.boatRoot.name = 'max-detail-boat-root';

  onProgress('铺真实针叶林、蕨类和立体林下植被…');
  const natureEntries = [
    ['coniferTall', URLS.coniferTall],
    ['coniferMid', URLS.coniferMid],
    ['coniferYoung', URLS.coniferYoung],
    ['undergrowth', URLS.undergrowth],
    ['fern', URLS.fern],
    ['grassClump', URLS.grassClump],
    ['fallenLog', URLS.fallenLog]
  ];

  const models = {};
  await Promise.all(natureEntries.map(async ([key, url]) => {
    try {
      models[key] = await loadPrepared(url, renderer, { castShadow: false, receiveShadow: true });
      result.loaded.push(key);
    } catch (err) {
      console.warn('[garden-max] premium nature failed', key, err);
      result.failed.push(key);
    }
  }));

  const rnd = seededRandom(202609132109);
  const treePoints = [];
  const treeMatrices = { coniferTall: [], coniferMid: [], coniferYoung: [] };
  const treeTarget = isMobile ? 118 : 170;
  let attempts = 0;
  while (treePoints.length < treeTarget && attempts++ < treeTarget * 80) {
    const ang = rnd() * Math.PI * 2;
    const r = 63 + Math.pow(rnd(), .72) * 92;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const h = heightAt(x, z);
    if (h < .65 || h > 13.5 || exclude(x, z)) continue;

    let crowded = false;
    for (const p of treePoints) {
      if (Math.hypot(p.x - x, p.z - z) < 3.2) { crowded = true; break; }
    }
    if (crowded) continue;

    const pick = rnd();
    const key = pick < .45 ? 'coniferTall' : (pick < .82 ? 'coniferMid' : 'coniferYoung');
    if (!models[key]) continue;
    const s = .82 + rnd() * .52;
    treeMatrices[key].push(placementMatrix(x, h, z, s, rnd() * Math.PI * 2));
    treePoints.push({ x, z });
  }

  for (const key of Object.keys(treeMatrices)) {
    if (!models[key] || !treeMatrices[key].length) continue;
    result.natureGroup.add(makeInstancedCopies(
      models[key],
      treeMatrices[key],
      'premium-' + key,
      { castShadow: !isMobile, receiveShadow: true }
    ));
  }

  function scatterGround(key, count, r0, r1, hMin, hMax, scaleMin, scaleMax, seedOffset) {
    if (!models[key]) return;
    const rr = seededRandom(202609132109 + seedOffset);
    const matrices = [];
    let tries = 0;
    while (matrices.length < count && tries++ < count * 40) {
      const ang = rr() * Math.PI * 2;
      const r = r0 + Math.pow(rr(), .88) * (r1 - r0);
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const h = heightAt(x, z);
      if (h < hMin || h > hMax || exclude(x, z)) continue;
      const s = scaleMin + rr() * (scaleMax - scaleMin);
      matrices.push(placementMatrix(
        x, h + .015, z, s, rr() * Math.PI * 2,
        (rr() - .5) * .025, (rr() - .5) * .025
      ));
    }
    result.natureGroup.add(makeInstancedCopies(
      models[key], matrices, 'premium-' + key,
      { castShadow: false, receiveShadow: true }
    ));
  }

  // Mesh ground cover: no billboard cards. The near shore gets real 3D clumps,
  // while the existing PBR terrain carries the distant meadow colour.
  scatterGround('grassClump', isMobile ? 760 : 1250, 54, 108, .38, 7.8, .72, 1.55, 31);
  scatterGround('undergrowth', isMobile ? 250 : 390, 58, 118, .55, 9.2, .70, 1.35, 47);
  scatterGround('fern', isMobile ? 135 : 220, 61, 122, .65, 8.0, .68, 1.32, 59);

  if (models.fallenLog) {
    const rr = seededRandom(202609132781);
    const logs = [];
    let tries = 0;
    while (logs.length < (isMobile ? 10 : 16) && tries++ < 500) {
      const ang = rr() * Math.PI * 2;
      const r = 66 + rr() * 50;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const h = heightAt(x, z);
      if (h < .7 || h > 7.5 || exclude(x, z)) continue;
      logs.push(placementMatrix(x, h + .02, z, .78 + rr() * .34, rr() * Math.PI * 2));
    }
    result.natureGroup.add(makeInstancedCopies(
      models.fallenLog, logs, 'premium-fallen-log',
      { castShadow: !isMobile, receiveShadow: true }
    ));
  }

  // Textured mossy rocks replace the old close-up dodecahedron placeholders.
  try {
    onProgress('摆真实苔石和岸边细节…');
    const rawRock = await loadPrepared(URLS.boulder, renderer, { castShadow: false, receiveShadow: true });
    const rockModel = asNormalizedHolder(rawRock, { targetLongest: 2.55, bottom: 0, centerXZ: true });
    const rockRnd = seededRandom(2026091388);
    for (let i = 0, tries = 0; i < (isMobile ? 14 : 22) && tries < 400; tries++) {
      const ang = rockRnd() * Math.PI * 2;
      const r = 54 + rockRnd() * 48;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const h = heightAt(x, z);
      if (h < .12 || h > 6.2 || exclude(x, z)) continue;
      const s = .48 + rockRnd() * .92;
      result.natureGroup.add(clonePlaced(rockModel, x, h, z, s, rockRnd() * Math.PI * 2, i < 4));
      i++;
    }
    result.loaded.push('boulder');
  } catch (err) {
    console.warn('[garden-max] boulder failed', err);
    result.failed.push('boulder');
  }

  scene.add(result.natureGroup);

  onProgress('载入高细节湖边小屋…');
  try {
    const rawHouse = await loadPrepared(URLS.cottage, renderer, { castShadow: true, receiveShadow: true });
    const house = asNormalizedHolder(rawHouse, { targetLongest: 11.6, bottom: 0, centerXZ: true });
    house.position.set(cottagePosition.x, heightAt(cottagePosition.x, cottagePosition.z) + .04, cottagePosition.z);
    house.rotation.y = -Math.PI * .46;
    house.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(house);
    result.cottageRoot = house;
    result.loaded.push('cottage');
  } catch (err) {
    console.warn('[garden-max] cottage failed', err);
    result.failed.push('cottage');
  }

  onProgress('载入原始约 150 万三角面的二进制 GLB 游艇（不减面）…');
  try {
    // Clean diagnostic: this is the exact browser-ready source that the earlier
    // 480k yacht test simplified at runtime. Here we load the original GLB as-is:
    // no OBJ text parsing, no ZIP inflation, no decimation, no runtime LOD.
    const rawBoat = await loadPrepared(URLS.highBoat, renderer, {
      castShadow: true,
      receiveShadow: true
    });
    rawBoat.name = 'motoryacht-full-1p5m-glb-test';

    let triangles = 0;
    rawBoat.traverse((o) => { triangles += meshTriangleCount(o); });
    console.info('[garden-max] full binary GLB yacht triangles', triangles);

    const boatVisual = asNormalizedHolder(rawBoat, {
      targetLongest: 32.48,
      bottom: 0,
      centerXZ: true,
      rotateLongestToX: true
    });
    boatVisual.position.y = -.30;
    result.boatRoot.add(boatVisual);
    result.boatTriangles = triangles;
    result.boatPassengerY = 1.10;
    result.loaded.push('boat');
  } catch (err) {
    console.warn('[garden-max] full 1.5M binary GLB yacht failed', err);
    result.failed.push('boat');
  }
  result.boatRoot.position.copy(boatPosition);
  scene.add(result.boatRoot);

  return result;
}

export const MAX_ASSET_SOURCES = {
  quaterniusNature: 'CC0 — 3DAssets.dev damp conifer forest set (tall/mid/young conifers, undergrowth, ferns, grass, mossy logs)',
  cottage: 'CC0 — 3DAssets.dev asset 32485',
  boat: 'CC BY 4.0 — motoryacht 35 by angelo raffaele catalano; original ~1.5M-triangle binary GLB, no decimation',
  oak: 'CC0 — 3DAssets.dev asset 28312',
  boulder: 'CC0 — 3DAssets.dev asset 32688'
};
