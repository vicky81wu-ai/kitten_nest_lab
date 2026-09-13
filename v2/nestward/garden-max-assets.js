import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { seededRandom } from './garden-hq-visuals.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
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
  premiumJacaranda: './assets/premium/polyhaven-jacaranda.glb',
  boatHull: 'https://cdn.3dassets.dev/assets/31642/v1/model.glb',
  boatRudder: 'https://cdn.3dassets.dev/assets/31644/v1/model.glb',
  boatVent: 'https://cdn.3dassets.dev/assets/31646/v1/model.glb',
  boatChimney: 'https://cdn.3dassets.dev/assets/31647/v1/model.glb',
  boatRope: 'https://cdn.3dassets.dev/assets/31648/v1/model.glb',
  boatHook: 'https://cdn.3dassets.dev/assets/31650/v1/model.glb',
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
    forestRoot: null,
    boatRoot: new THREE.Group(),
    failed: [],
    loaded: []
  };
  result.natureGroup.name = 'max-asset-nature';
  result.boatRoot.name = 'max-detail-boat-root';

  onProgress('载入 Poly Haven 31 万面写真树（不减面）…');
  try {
    const rawTree = await loadPrepared(
      URLS.premiumJacaranda,
      renderer,
      { castShadow: false, receiveShadow: true }
    );

    let treeTriangles = 0;
    rawTree.traverse((o) => { treeTriangles += meshTriangleCount(o); });
    console.info('[garden-max] premium Poly Haven tree triangles', treeTriangles);

    // Keep the full source geometry. World-size normalization changes only the
    // transform — it does not simplify, decimate or rebuild either mesh.
    normalizeModel(rawTree, { targetHeight: 15.8, bottom: 0, centerXZ: true });

    // A few hero trees share one full-resolution geometry/material set through
    // GPU instancing. This gives us million-plus visible tree triangles without
    // multiplying the 62 MB source asset in memory.
    const treeSpots = [
      [61.5, -17.0, 1.00, .38],
      [74.5, -20.5, .94, 2.12],
      [84.0, -15.0, 1.08, 4.46],
      [88.5, 8.5, .92, 5.65],
      [58.0, 12.0, 1.04, 3.31],
      [94.0, 20.0, .90, 1.18]
    ];
    const treeMatrices = [];
    for (const [x,z,s,yaw] of treeSpots) {
      const y = heightAt(x,z);
      if (y > .25) treeMatrices.push(placementMatrix(x,y,z,s,yaw));
    }
    const heroTrees = makeInstancedCopies(
      rawTree, treeMatrices, 'polyhaven-jacaranda-fullres',
      { castShadow: false, receiveShadow: true }
    );
    result.natureGroup.add(heroTrees);

    result.premiumTrees = heroTrees;
    result.treeTriangles = treeTriangles;
    result.loaded.push('premiumJacaranda');
  } catch (err) {
    // Deliberately do NOT resurrect the old 500-triangle cone forest here.
    // If the premium source fails, the photo HDRI remains as distant woodland.
    console.warn('[garden-max] premium Poly Haven vegetation failed', err);
    result.failed.push('premiumTree');
  }

  // Low-poly boulders were visually below the premium asset tier and are
  // intentionally omitted from this comparison build.
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
  premiumNature: 'CC0 — Poly Haven Jacaranda Tree; full source mesh, Meshopt transport compression only',
  cottage: 'CC0 — 3DAssets.dev asset 32485',
  boat: 'CC BY 4.0 — motoryacht 35 by angelo raffaele catalano; original ~1.5M-triangle binary GLB, no decimation',
  oak: 'CC0 — 3DAssets.dev asset 28312',
};
