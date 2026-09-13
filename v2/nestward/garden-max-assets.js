import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptSimplifier } from 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.25.0/meshopt_simplifier.module.js';
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

function meshTriangleCount(mesh) {
  if (!mesh?.isMesh || !mesh.geometry?.getAttribute('position')) return 0;
  const g = mesh.geometry;
  return Math.floor((g.index ? g.index.count : g.getAttribute('position').count) / 3);
}

async function simplifyRootToBudget(root, targetTriangles = 480000) {
  await MeshoptSimplifier.ready;

  const candidates = [];
  let fixedTriangles = 0;
  let sourceTriangles = 0;

  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.getAttribute('position')) return;
    const tris = meshTriangleCount(o);
    sourceTriangles += tris;

    // GLTFLoader normally creates one Three mesh per glTF primitive. Skip rare
    // multi-material/grouped or non-indexed geometries rather than risk damaging
    // material ranges in this visual test.
    const g = o.geometry;
    if (!g.index || (g.groups?.length || 0) > 1 || tris < 64) {
      fixedTriangles += tris;
      return;
    }
    candidates.push({ mesh: o, tris });
  });

  const reducibleSource = candidates.reduce((s, x) => s + x.tris, 0);
  const reducibleTarget = Math.max(0, targetTriangles - fixedTriangles);
  const ratio = reducibleSource > 0 ? Math.min(1, reducibleTarget / reducibleSource) : 1;

  for (const { mesh, tris } of candidates) {
    if (ratio >= .995) continue;
    const g = mesh.geometry;
    const pos = g.getAttribute('position');
    const positions = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      positions[i * 3] = pos.getX(i);
      positions[i * 3 + 1] = pos.getY(i);
      positions[i * 3 + 2] = pos.getZ(i);
    }

    const src = new Uint32Array(g.index.count);
    for (let i = 0; i < g.index.count; i++) src[i] = g.index.getX(i);

    const wanted = Math.max(3, Math.floor((src.length * ratio) / 3) * 3);
    let simplified;
    try {
      [simplified] = MeshoptSimplifier.simplify(src, positions, 3, wanted, .06, ['Permissive']);
      // Some CAD-like meshes can get stuck on seams. Only use the aggressive
      // fallback when the normal simplifier is still far over the requested LOD.
      if (simplified.length > wanted * 1.18) {
        [simplified] = MeshoptSimplifier.simplifySloppy(src, positions, 3, null, wanted, .08);
      }
    } catch (err) {
      console.warn('[garden-max] meshopt simplify skipped on mesh', mesh.name, err);
      continue;
    }

    if (simplified?.length >= 3 && simplified.length < src.length) {
      g.setIndex(new THREE.BufferAttribute(simplified, 1));
      g.computeBoundingBox();
      g.computeBoundingSphere();
    }
  }

  let finalTriangles = 0;
  root.traverse((o) => { finalTriangles += meshTriangleCount(o); });
  console.info('[garden-max] yacht LOD', { sourceTriangles, finalTriangles, targetTriangles });
  return { sourceTriangles, finalTriangles };
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

  onProgress('载入真实树木和灌木模型…');
  const natureEntries = [
    ['mapleA', URLS.mapleA, { targetHeight: 8.0 }],
    ['mapleB', URLS.mapleB, { targetHeight: 7.2 }],
    ['birch', URLS.birch, { targetHeight: 8.7 }],
    ['oak', URLS.oak, { targetHeight: 7.0 }],
    ['bushLarge', URLS.bushLarge, { targetHeight: 1.7 }],
    ['bushSmall', URLS.bushSmall, { targetHeight: 1.05 }]
  ];

  const models = {};
  await Promise.all(natureEntries.map(async ([key, url, norm]) => {
    try {
      const root = await loadPrepared(url, renderer, { castShadow: false, receiveShadow: true });
      models[key] = asNormalizedHolder(root, norm);
      result.loaded.push(key);
    } catch (err) {
      console.warn('[garden-max] model failed', key, err);
      result.failed.push(key);
    }
  }));

  const rnd = seededRandom(2026091315);
  const treeKeys = ['mapleA', 'mapleB', 'birch', 'oak'].filter((k) => models[k]);
  const treeTarget = isMobile ? 36 : 52;
  const trees = [];
  let attempts = 0;
  while (trees.length < treeTarget && attempts++ < treeTarget * 60 && treeKeys.length) {
    // Concentrate true modeled trees around the shore/playable cottage zone.
    const ang = rnd() * Math.PI * 2;
    const r = 58 + Math.pow(rnd(), .88) * 55;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    if (!validSpot(x, z, heightAt, exclude)) continue;
    let crowded = false;
    for (const p of trees) {
      if (Math.hypot(p.x - x, p.z - z) < 4.0) { crowded = true; break; }
    }
    if (crowded) continue;
    const key = treeKeys[Math.floor(rnd() * treeKeys.length)];
    const scale = .72 + rnd() * .65;
    const shadow = trees.length < (isMobile ? 12 : 24);
    const c = clonePlaced(models[key], x, heightAt(x, z), z, scale, rnd() * Math.PI * 2, shadow);
    result.natureGroup.add(c);
    trees.push({ x, z });
  }

  const bushKeys = ['bushLarge', 'bushSmall'].filter((k) => models[k]);
  const bushTarget = isMobile ? 58 : 82;
  for (let i = 0, tries = 0; i < bushTarget && tries < bushTarget * 35 && bushKeys.length; tries++) {
    const ang = rnd() * Math.PI * 2;
    const r = 54 + Math.pow(rnd(), .8) * 48;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    if (!validSpot(x, z, heightAt, exclude)) continue;
    const key = bushKeys[Math.floor(rnd() * bushKeys.length)];
    const scale = .55 + rnd() * .72;
    result.natureGroup.add(clonePlaced(models[key], x, heightAt(x, z), z, scale, rnd() * Math.PI * 2, false));
    i++;
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

  onProgress('载入并整理约 48 万三角面的高精度游艇…');
  try {
    // Source: motoryacht 35 by angelo raffaele catalano, CC BY 4.0.
    // The browser-ready source is ~1.5M triangles. For this comparison build
    // we reduce only its index buffers to a ~480k-triangle LOD while retaining
    // the original vertex attributes, materials and textures.
    const rawBoat = await loadPrepared(URLS.highBoat, renderer, {
      castShadow: true,
      receiveShadow: true
    });
    const lodInfo = await simplifyRootToBudget(rawBoat, 480000);

    rawBoat.name = 'motoryacht-480k-test';
    const boatVisual = asNormalizedHolder(rawBoat, {
      // Source is a ~10.7 m motor yacht. Keep it at the same real-world class
      // as the previous 10.6 m narrowboat instead of toy-scaling it.
      targetLongest: 32.48,
      bottom: 0,
      centerXZ: true,
      rotateLongestToX: true
    });
    boatVisual.position.y = -.30;
    result.boatRoot.add(boatVisual);
    result.boatTriangles = lodInfo.finalTriangles;
    result.loaded.push('boat');
  } catch (err) {
    console.warn('[garden-max] 480k yacht failed; falling back to 45k canal boat', err);
    try {
      const [
        hull, rudder, ventA, ventB, chimney, rope, hook
      ] = await Promise.all([
        loadPrepared(URLS.boatHull, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatRudder, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatVent, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatVent, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatChimney, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatRope, renderer, { castShadow: true, receiveShadow: true }),
        loadPrepared(URLS.boatHook, renderer, { castShadow: true, receiveShadow: true })
      ]);
      const fallback = new THREE.Group();
      fallback.add(hull);
      rudder.position.set(0, .04, -5.22);
      ventA.position.set(-.43, 2.03, .95);
      ventB.position.set(.43, 2.03, .12);
      chimney.position.set(.52, 1.98, -1.05);
      rope.position.set(-.42, .62, -3.70);
      rope.rotation.y = .42;
      hook.position.set(.82, .72, -2.45);
      fallback.add(rudder, ventA, ventB, chimney, rope, hook);
      const boatVisual = asNormalizedHolder(fallback, {
        targetLongest: 32.18,
        bottom: 0,
        centerXZ: true,
        rotateLongestToX: true
      });
      boatVisual.position.y = -.28;
      result.boatRoot.add(boatVisual);
      result.boatTriangles = 45256;
      result.loaded.push('boat');
    } catch (fallbackErr) {
      console.warn('[garden-max] fallback boat failed', fallbackErr);
      result.failed.push('boat');
    }
  }
  result.boatRoot.position.copy(boatPosition);
  scene.add(result.boatRoot);

  return result;
}

export const MAX_ASSET_SOURCES = {
  quaterniusNature: 'CC0 — Quaternius Ultimate Stylized Nature',
  cottage: 'CC0 — 3DAssets.dev asset 32485',
  boat: 'CC BY 4.0 — motoryacht 35 by angelo raffaele catalano; ~480k-triangle runtime LOD from 1.5M source',
  oak: 'CC0 — 3DAssets.dev asset 28312',
  boulder: 'CC0 — 3DAssets.dev asset 32688'
};
