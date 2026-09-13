import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const up = new THREE.Vector3(0, 1, 0);

export function seededRandom(seed = 1234) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTexture(size, draw, { repeat = 1, srgb = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  return tex;
}

export function createGroundDetailTexture() {
  const rnd = seededRandom(8117);
  return canvasTexture(384, (ctx, s) => {
    ctx.fillStyle = '#dedcc8';
    ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const grain = (rnd() - .5) * 32;
      const moss = rnd() < .055 ? -18 : 0;
      d[i] = Math.max(150, Math.min(245, d[i] + grain + moss));
      d[i + 1] = Math.max(155, Math.min(245, d[i + 1] + grain + moss * .45));
      d[i + 2] = Math.max(145, Math.min(238, d[i + 2] + grain + moss * .2));
    }
    ctx.putImageData(img, 0, 0);
    ctx.globalAlpha = .13;
    for (let i = 0; i < 460; i++) {
      const x = rnd() * s, y = rnd() * s, r = 1 + rnd() * 4;
      ctx.fillStyle = rnd() > .55 ? '#6f795e' : '#b89d73';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }, { repeat: 30 });
}

function woodTexture() {
  const rnd = seededRandom(713);
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#8d6847';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 42) {
      const g = ctx.createLinearGradient(0, y, 0, y + 42);
      g.addColorStop(0, '#9d7754');
      g.addColorStop(.5, '#876246');
      g.addColorStop(1, '#79563f');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, s, 42);
      ctx.fillStyle = 'rgba(48,30,20,.30)';
      ctx.fillRect(0, y + 40, s, 2);
    }
    ctx.globalAlpha = .18;
    for (let i = 0; i < 240; i++) {
      ctx.strokeStyle = rnd() > .5 ? '#402d22' : '#d0a379';
      ctx.lineWidth = .5 + rnd();
      ctx.beginPath();
      const x = rnd() * s, y = rnd() * s;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 35, y + (rnd() - .5) * 7, x + 70, y + (rnd() - .5) * 8, x + 130, y + (rnd() - .5) * 5);
      ctx.stroke();
    }
  }, { repeat: 3.5 });
}

function roofTexture() {
  const rnd = seededRandom(811);
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#3f413a';
    ctx.fillRect(0, 0, s, s);
    const w = 56, h = 34;
    for (let row = 0; row < Math.ceil(s / h) + 1; row++) {
      const off = row % 2 ? -w / 2 : 0;
      for (let x = off; x < s; x += w) {
        const v = 52 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${v},${v + 5},${v + 1})`;
        ctx.fillRect(x + 1, row * h + 1, w - 2, h - 2);
        ctx.strokeStyle = 'rgba(18,19,17,.55)';
        ctx.strokeRect(x + 1, row * h + 1, w - 2, h - 2);
      }
    }
  }, { repeat: 2.6 });
}

export function createCottage({ heightAt, x = 78, z = -11 }) {
  const group = new THREE.Group();
  group.name = 'hq-cottage';

  const baseY = heightAt(x, z);
  const woodTex = woodTexture();
  const roofTex = roofTexture();
  const wallMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xc6ad8d, roughness: .72, metalness: 0 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe8dfcb, roughness: .72 });
  const deckMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x907154, roughness: .82 });
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, color: 0x727067, roughness: .88 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x77776f, roughness: .98 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fc7d2, roughness: .08, metalness: 0, transmission: .18,
    transparent: true, opacity: .54, envMapIntensity: 1.35
  });
  const warmMat = new THREE.MeshBasicMaterial({ color: 0xffd69a, transparent: true, opacity: .32, depthWrite: false });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(11.8, .34, 9.0), deckMat);
  deck.position.y = .22;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  const house = new THREE.Mesh(new THREE.BoxGeometry(8.7, 4.7, 6.4), wallMat);
  house.position.y = 2.72;
  house.castShadow = house.receiveShadow = true;
  group.add(house);

  const slabGeo = new THREE.BoxGeometry(9.6, .34, 4.35);
  const leftRoof = new THREE.Mesh(slabGeo, roofMat);
  leftRoof.position.set(0, 5.65, -1.73);
  leftRoof.rotation.x = .56;
  leftRoof.castShadow = true;
  const rightRoof = leftRoof.clone();
  rightRoof.position.z = 1.73;
  rightRoof.rotation.x = -.56;
  group.add(leftRoof, rightRoof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.25, 1.0), stoneMat);
  chimney.position.set(-2.65, 6.1, .55);
  chimney.castShadow = true;
  group.add(chimney);

  // Front facade: lake-facing windows, door and warm interior glow.
  const frontZ = 3.23;
  const windowGeo = new THREE.PlaneGeometry(1.7, 1.65);
  for (const wx of [-2.55, 2.55]) {
    const glow = new THREE.Mesh(windowGeo, warmMat);
    glow.position.set(wx, 2.85, frontZ + .006);
    group.add(glow);
    const glass = new THREE.Mesh(windowGeo, glassMat);
    glass.position.set(wx, 2.85, frontZ + .012);
    group.add(glass);
    for (const ox of [-.9, .9]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(.09, 1.88, .10), trimMat);
      frame.position.set(wx + ox * .85, 2.85, frontZ + .07);
      group.add(frame);
    }
    for (const oy of [-.88, .88]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.88, .09, .10), trimMat);
      frame.position.set(wx, 2.85 + oy * .88, frontZ + .07);
      group.add(frame);
    }
    const v = new THREE.Mesh(new THREE.BoxGeometry(.075, 1.75, .10), trimMat);
    v.position.set(wx, 2.85, frontZ + .075);
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.75, .075, .10), trimMat);
    h.position.set(wx, 2.85, frontZ + .075);
    group.add(v, h);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.38, 2.7, .14), new THREE.MeshStandardMaterial({ color: 0x55483f, roughness: .82 }));
  door.position.set(0, 1.75, frontZ + .08);
  group.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd3b77a, metalness: .55, roughness: .33 }));
  knob.position.set(.45, 1.8, frontZ + .18);
  group.add(knob);

  // Porch roof + slim columns.
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.2, .18, 2.35), roofMat);
  porchRoof.position.set(0, 4.25, 4.2);
  porchRoof.rotation.x = -.06;
  porchRoof.castShadow = true;
  group.add(porchRoof);
  for (const px of [-2.7, 2.7]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(.18, 3.75, .18), trimMat);
    col.position.set(px, 2.15, 4.65);
    col.castShadow = true;
    group.add(col);
  }

  // Porch rails: enough geometry to read as an actual dwelling, not a box.
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.1, .12, .12), trimMat);
    rail.position.set(side * 3.75, 1.25, 4.8);
    rail.rotation.y = Math.PI / 2;
    group.add(rail);
    for (let i = 0; i < 5; i++) {
      const bal = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.05, .08), trimMat);
      bal.position.set(side * 3.75, .82, 3.55 + i * .62);
      group.add(bal);
    }
  }

  // Warm exterior sconces.
  for (const lx of [-1.05, 1.05]) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(.11, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdfaf, emissive: 0xffa84b, emissiveIntensity: 2.6, roughness: .2 })
    );
    bulb.position.set(lx, 3.1, frontZ + .28);
    group.add(bulb);
    const light = new THREE.PointLight(0xffc477, 3.2, 8, 2);
    light.position.copy(bulb.position);
    group.add(light);
  }

  group.position.set(x, baseY + .03, z);
  group.rotation.y = -Math.PI / 2;
  return { group, baseY };
}

function crossBladeGeometry() {
  const a = new THREE.PlaneGeometry(.11, .72, 1, 3);
  a.translate(0, .36, 0);
  const b = a.clone();
  b.rotateY(Math.PI / 2);
  return mergeGeometries([a, b]);
}

export function createGrassField({ heightAt, isMobile = false, seed = 6677, exclude = () => false }) {
  const rnd = seededRandom(seed);
  const count = isMobile ? 5200 : 9000;
  const geo = crossBladeGeometry();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x78945d, roughness: 1, metalness: 0, side: THREE.DoubleSide,
    alphaTest: 0, vertexColors: true
  });
  const windUniform = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGrassTime = windUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uGrassTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float rootX = instanceMatrix[3].x;
          float rootZ = instanceMatrix[3].z;
          float sway = sin(uGrassTime * 1.55 + rootX * .11 + rootZ * .087) * .075;
          sway += sin(uGrassTime * .71 + rootZ * .13) * .035;
          transformed.x += sway * max(0.0, position.y) * 1.25;
          transformed.z += sway * max(0.0, position.y) * .45;
        #endif`
      );
  };
  mat.customProgramCacheKey = () => 'nw-hq-grass-v2';

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const cA = new THREE.Color(0x5f7f49), cB = new THREE.Color(0xa0a96b);
  let placed = 0, attempts = 0;
  while (placed < count && attempts < count * 18) {
    attempts++;
    const a = rnd() * TAU;
    const r = 57 + Math.pow(rnd(), .72) * 55;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = heightAt(x, z);
    if (h < .25 || h > 9.5 || exclude(x, z)) continue;
    dummy.position.set(x, h + .02, z);
    dummy.rotation.set(0, rnd() * TAU, (rnd() - .5) * .09);
    const s = .55 + rnd() * 1.18;
    dummy.scale.set(.7 + rnd() * .7, s, .7 + rnd() * .7);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    col.lerpColors(cA, cB, rnd());
    if (rnd() < .07) col.offsetHSL(.03, -.08, .09);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return {
    mesh,
    update(time) { windUniform.value = time; }
  };
}

export function createDetailedTrees({ heightAt, isMobile = false, seed = 9091, exclude = () => false }) {
  const rnd = seededRandom(seed);
  const treeCount = isMobile ? 16 : 25;
  const trunkGeo = new THREE.CylinderGeometry(.26, .42, 5.4, 9);
  trunkGeo.translate(0, 2.7, 0);
  const branchGeo = new THREE.CylinderGeometry(.065, .15, 2.8, 7);
  branchGeo.translate(0, 1.4, 0);
  const leafGeo = new THREE.IcosahedronGeometry(.72, 1);
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5b4632, roughness: .97 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f7448, roughness: .9, vertexColors: true });

  const trunks = new THREE.InstancedMesh(trunkGeo, barkMat, treeCount);
  const branchesPer = 9;
  const leavesPer = isMobile ? 30 : 44;
  const branches = new THREE.InstancedMesh(branchGeo, barkMat, treeCount * branchesPer);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, treeCount * leavesPer);
  trunks.castShadow = branches.castShadow = leaves.castShadow = true;
  trunks.receiveShadow = branches.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const leafColor = new THREE.Color();
  const leafA = new THREE.Color(0x375c3a), leafB = new THREE.Color(0x789063);
  let ti = 0, bi = 0, li = 0, attempts = 0;
  const trees = [];

  while (ti < treeCount && attempts++ < 1500) {
    const a = rnd() * TAU;
    const r = 62 + rnd() * 50;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = heightAt(x, z);
    if (h < .5 || h > 9.5 || exclude(x, z)) continue;
    let tooNear = false;
    for (const t of trees) if (Math.hypot(t.x - x, t.z - z) < 5.5) { tooNear = true; break; }
    if (tooNear) continue;
    const scale = .72 + rnd() * .78;
    const rot = rnd() * TAU;
    trees.push({ x, z, h, scale, rot });

    dummy.position.set(x, h, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(ti++, dummy.matrix);

    const crownY = h + 4.2 * scale;
    for (let j = 0; j < branchesPer; j++) {
      const ang = rot + j / branchesPer * TAU + (rnd() - .5) * .5;
      const len = (1.45 + rnd() * 2.2) * scale;
      const start = new THREE.Vector3(x, h + (2.0 + rnd() * 2.35) * scale, z);
      const end = new THREE.Vector3(
        x + Math.cos(ang) * len,
        crownY + (rnd() - .28) * 2.0 * scale,
        z + Math.sin(ang) * len
      );
      pos.copy(start).lerp(end, .5);
      dir.copy(end).sub(start);
      const L = dir.length();
      dir.normalize();
      quat.setFromUnitVectors(up, dir);
      dummy.position.copy(pos);
      dummy.quaternion.copy(quat);
      dummy.scale.set(scale, L / 2.8, scale);
      dummy.updateMatrix();
      branches.setMatrixAt(bi++, dummy.matrix);
    }

    for (let j = 0; j < leavesPer; j++) {
      const ang = rnd() * TAU;
      const rr = Math.sqrt(rnd()) * 3.0 * scale;
      const yy = crownY + (rnd() - .4) * 3.6 * scale;
      dummy.position.set(x + Math.cos(ang) * rr, yy, z + Math.sin(ang) * rr);
      dummy.rotation.set(rnd() * .3, rnd() * TAU, rnd() * .3);
      dummy.scale.set((.55 + rnd() * .85) * scale, (.45 + rnd() * .8) * scale, (.55 + rnd() * .85) * scale);
      dummy.updateMatrix();
      leaves.setMatrixAt(li, dummy.matrix);
      leafColor.lerpColors(leafA, leafB, rnd());
      if (rnd() < .08) leafColor.setHex(0xa59157);
      leaves.setColorAt(li, leafColor);
      li++;
    }
  }
  trunks.count = ti; branches.count = bi; leaves.count = li;
  trunks.instanceMatrix.needsUpdate = branches.instanceMatrix.needsUpdate = leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  const group = new THREE.Group();
  group.name = 'hq-near-forest';
  group.add(trunks, branches, leaves);
  return group;
}

export function createBackgroundForest({ heightAt, isMobile = false, seed = 2341 }) {
  const rnd = seededRandom(seed);
  const count = isMobile ? 210 : 360;
  const trunkGeo = new THREE.CylinderGeometry(.16, .29, 2.6, 6);
  trunkGeo.translate(0, 1.3, 0);
  const coneGeo = new THREE.ConeGeometry(1.65, 4.3, 9);
  coneGeo.translate(0, 3.7, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4d3929, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x294e36, roughness: .94, vertexColors: true });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crowns = new THREE.InstancedMesh(coneGeo, leafMat, count);
  trunks.castShadow = crowns.castShadow = false;
  const d = new THREE.Object3D(), c = new THREE.Color();
  const a = new THREE.Color(0x234432), b = new THREE.Color(0x4d6b43);
  let n = 0, attempts = 0;
  while (n < count && attempts++ < count * 20) {
    const ang = rnd() * TAU;
    const r = 90 + Math.pow(rnd(), .58) * 88;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    const h = heightAt(x, z);
    if (h < 1.4 || h > 18) continue;
    const s = .65 + rnd() * 1.5;
    d.position.set(x, h, z);
    d.rotation.set(0, rnd() * TAU, 0);
    d.scale.set(s, s, s);
    d.updateMatrix();
    trunks.setMatrixAt(n, d.matrix);
    crowns.setMatrixAt(n, d.matrix);
    c.lerpColors(a, b, rnd());
    crowns.setColorAt(n, c);
    n++;
  }
  trunks.count = crowns.count = n;
  trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  const group = new THREE.Group();
  group.add(trunks, crowns);
  return group;
}

export function createRocks({ heightAt, isMobile = false, seed = 5001, exclude = () => false }) {
  const rnd = seededRandom(seed);
  const count = isMobile ? 65 : 110;
  const geo = new THREE.DodecahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d8277, roughness: 1, vertexColors: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const d = new THREE.Object3D(), col = new THREE.Color();
  let n = 0, attempts = 0;
  while (n < count && attempts++ < count * 18) {
    const ang = rnd() * TAU, r = 54 + rnd() * 72;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r, h = heightAt(x, z);
    if (h < -.05 || h > 13 || exclude(x, z)) continue;
    const s = .22 + rnd() * .9;
    d.position.set(x, h + s * .26, z);
    d.rotation.set(rnd(), rnd() * TAU, rnd());
    d.scale.set(s * (1 + rnd() * .7), s * (.45 + rnd() * .45), s * (.8 + rnd() * .4));
    d.updateMatrix();
    mesh.setMatrixAt(n, d.matrix);
    col.setHSL(.19 + (rnd() - .5) * .04, .05 + rnd() * .08, .43 + rnd() * .16);
    mesh.setColorAt(n, col);
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

export function createDock({ heightAt, x = 61.5, z = 0 }) {
  const group = new THREE.Group();
  group.name = 'hq-dock';
  const woodTex = woodTexture();
  const mat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x9b7654, roughness: .86 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5e452f, roughness: .94 });
  const topY = .56;
  const length = 17;
  const width = 3.7;
  for (let i = 0; i < 17; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(.92, .16, width), mat);
    plank.position.set(x - length / 2 + .55 + i, topY, z);
    plank.castShadow = plank.receiveShadow = true;
    group.add(plank);
  }
  for (const px of [x - 7.6, x - 2.5, x + 2.7, x + 7.5]) {
    for (const pz of [-1.55, 1.55]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.11, .15, 2.8, 9), dark);
      post.position.set(px, -.35, z + pz);
      post.castShadow = true;
      group.add(post);
    }
  }
  // mooring lamps at the shore end
  for (const pz of [-1.55, 1.55]) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffe4b1, emissive: 0xffb45c, emissiveIntensity: 2.8 })
    );
    lamp.position.set(x + 7.45, 1.15, z + pz);
    group.add(lamp);
  }
  return { group, x, z, topY, length, width };
}

export function pointOnDock(x, z, dock) {
  return Math.abs(z - dock.z) <= dock.width * .62 && x >= dock.x - dock.length * .52 && x <= dock.x + dock.length * .52;
}

export function createFairies({ isMobile = false, seed = 8911 }) {
  const rnd = seededRandom(seed);
  const count = isMobile ? 26 : 42;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const bases = [];
  const colorChoices = [new THREE.Color(0xffe8a2), new THREE.Color(0xc7f2da), new THREE.Color(0xd5cfff)];
  for (let i = 0; i < count; i++) {
    const ang = rnd() * TAU;
    const r = 59 + rnd() * 37;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r, y = .9 + rnd() * 4;
    bases.push(new THREE.Vector3(x, y, z));
    phases[i] = rnd() * TAU;
    const c = colorChoices[i % colorChoices.length];
    colors.set([c.r * 1.4, c.g * 1.3, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const tex = canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s/2,s/2,1,s/2,s/2,s*.48);
    g.addColorStop(0,'rgba(255,255,236,1)');
    g.addColorStop(.18,'rgba(255,246,190,.95)');
    g.addColorStop(.5,'rgba(220,244,210,.34)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,s,s);
  }, { srgb: true });
  const mat = new THREE.PointsMaterial({
    map: tex, size: .72, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    update(t) {
      for (let i = 0; i < count; i++) {
        const b = bases[i], p = phases[i];
        positions[i*3] = b.x + Math.sin(t*.52+p)*1.05;
        positions[i*3+1] = b.y + Math.sin(t*1.23+p)*.34;
        positions[i*3+2] = b.z + Math.cos(t*.43+p)*.82;
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

export function createBillboardCharacter(textureUrl, { width = 2.7, height = 5.0 } = {}) {
  const group = new THREE.Group();
  group.name = 'kitten-3d-billboard';
  const tex = new THREE.TextureLoader().load(textureUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, alphaTest: .035, roughness: .78,
    metalness: 0, side: THREE.DoubleSide
  });
  const geo = new THREE.PlaneGeometry(width, height);
  geo.translate(0, height/2, 0);
  const sprite = new THREE.Mesh(geo, mat);
  sprite.castShadow = true;
  sprite.renderOrder = 4;
  group.add(sprite);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.82, 28),
    new THREE.MeshBasicMaterial({ color: 0x18241d, transparent: true, opacity: .25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI/2;
  shadow.scale.set(1, .42, 1);
  shadow.position.y = .025;
  group.add(shadow);
  return { group, sprite, shadow };
}
