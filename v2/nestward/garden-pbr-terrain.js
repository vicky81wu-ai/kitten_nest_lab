import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from './garden-hq-visuals.js';

const BASE = 'https://cdn.jsdelivr.net/gh/milnet01/Vestige@main/assets/textures/';
const TERRAIN = BASE + 'terrain/';
const FOLIAGE = BASE + 'foliage/';

const loader = new THREE.TextureLoader();

function configure(tex, { srgb = false, repeat = 1, aniso = 8 } = {}) {
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = aniso;
  tex.needsUpdate = true;
  return tex;
}

async function tex(url, options) {
  return configure(await loader.loadAsync(url), options);
}

export async function createTerrainPbrMaterial(renderer) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 4);
  const [grass, dirt, rock, sand, grassNormal] = await Promise.all([
    tex(TERRAIN + 'grass_albedo.jpg', { srgb: true, aniso }),
    tex(TERRAIN + 'dirt_albedo.jpg', { srgb: true, aniso }),
    tex(TERRAIN + 'rock_albedo.jpg', { srgb: true, aniso }),
    tex(TERRAIN + 'sand_albedo.jpg', { srgb: true, aniso }),
    tex(TERRAIN + 'grass_normal.png', { repeat: 54, aniso })
  ]);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: .9,
    metalness: 0,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(.42, .42),
    vertexColors: false
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tGrass = { value: grass };
    shader.uniforms.tDirt = { value: dirt };
    shader.uniforms.tRock = { value: rock };
    shader.uniforms.tSand = { value: sand };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vNWTerrainPos;\nvarying float vNWTerrainSlope;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvNWTerrainPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNWTerrainSlope = 1.0 - clamp(objectNormal.y, 0.0, 1.0);'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D tGrass;
        uniform sampler2D tDirt;
        uniform sampler2D tRock;
        uniform sampler2D tSand;
        varying vec3 vNWTerrainPos;
        varying float vNWTerrainSlope;

        float nwSegmentDistance(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }`
      )
      .replace(
        '#include <map_fragment>',
        `{
          vec2 uvA = vNWTerrainPos.xz * 0.105;
          vec2 uvB = vNWTerrainPos.xz * 0.061 + vec2(12.7, 7.1);
          vec3 grassA = texture2D(tGrass, uvA).rgb;
          vec3 grassB = texture2D(tGrass, uvB).rgb;
          vec3 grassC = mix(grassA, grassB, 0.32);
          vec3 dirtC = texture2D(tDirt, uvA * 0.86).rgb;
          vec3 rockC = texture2D(tRock, uvA * 0.72).rgb;
          vec3 sandC = texture2D(tSand, uvA * 0.92).rgb;

          float shore = 1.0 - smoothstep(0.38, 1.15, vNWTerrainPos.y);
          float rockW = smoothstep(0.16, 0.52, vNWTerrainSlope) * smoothstep(1.0, 3.8, vNWTerrainPos.y);

          // A worn path from the cottage toward the dock, blended rather than painted.
          float pathD = nwSegmentDistance(vNWTerrainPos.xz, vec2(77.5, -10.5), vec2(60.5, -0.2));
          float pathW = (1.0 - smoothstep(0.65, 2.15, pathD)) * smoothstep(0.8, 2.3, vNWTerrainPos.y);

          vec3 baseC = mix(grassC, sandC, shore);
          baseC = mix(baseC, dirtC, pathW * 0.72);
          baseC = mix(baseC, rockC, rockW * 0.82);
          // Keep the world sunny on mobile; upstream vertex colors were intentionally dark.
          diffuseColor.rgb *= baseC * 1.18;
        }`
      );
  };
  mat.customProgramCacheKey = () => 'nw-max-pbr-terrain-v4';
  return mat;
}

function makeCrossGeometry(width, height) {
  const a = new THREE.PlaneGeometry(width, height, 1, 3);
  a.translate(0, height / 2, 0);
  const b = a.clone();
  b.rotateY(Math.PI / 2);
  return mergeGeometries([a, b]);
}

function windMaterial(map, {
  color = 0xffffff,
  alphaTest = .3,
  roughness = .95,
  sway = .08
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    map,
    color,
    roughness,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    alphaTest,
    vertexColors: true
  });
  const time = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNWTime = time;
    shader.uniforms.uNWSway = { value: sway };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uNWTime;\nuniform float uNWSway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float nwX = instanceMatrix[3].x;
          float nwZ = instanceMatrix[3].z;
          float nwS = sin(uNWTime * 1.35 + nwX * .09 + nwZ * .071) * uNWSway;
          nwS += sin(uNWTime * .58 + nwZ * .12) * uNWSway * .38;
          transformed.x += nwS * max(0.0, position.y);
          transformed.z += nwS * .32 * max(0.0, position.y);
        #endif`);
  };
  mat.customProgramCacheKey = () => 'nw-max-textured-vegetation';
  return { mat, time };
}

export async function createTexturedMeadow({
  renderer,
  heightAt,
  isMobile,
  exclude = () => false,
  seed = 4419
}) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 4);
  const [grassTex, whiteTex, yellowTex, purpleTex] = await Promise.all([
    tex(FOLIAGE + 'grass_blades.png', { srgb: true, aniso }),
    tex(FOLIAGE + 'flower_white.png', { srgb: true, aniso }),
    tex(FOLIAGE + 'flower_yellow.png', { srgb: true, aniso }),
    tex(FOLIAGE + 'flower_purple.png', { srgb: true, aniso })
  ]);

  // These are foliage atlases; they should not tile within a blade card.
  for (const t of [grassTex, whiteTex, yellowTex, purpleTex]) {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(1, 1);
  }

  const rnd = seededRandom(seed);
  const group = new THREE.Group();
  group.name = 'textured-meadow';

  const bladeGeo = makeCrossGeometry(.62, .82);
  const grassWind = windMaterial(grassTex, { color: 0x8da879, alphaTest: .26, sway: .09 });
  const grassCount = isMobile ? 4700 : 7600;
  const grass = new THREE.InstancedMesh(bladeGeo, grassWind.mat, grassCount);
  grass.castShadow = false;
  grass.receiveShadow = true;
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  let n = 0, attempts = 0;
  while (n < grassCount && attempts++ < grassCount * 22) {
    const ang = rnd() * Math.PI * 2;
    const r = 57 + Math.pow(rnd(), .77) * 61;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const h = heightAt(x, z);
    if (h < .32 || h > 9.2 || exclude(x, z)) continue;
    d.position.set(x, h + .018, z);
    d.rotation.set(0, rnd() * Math.PI * 2, 0);
    const s = .62 + rnd() * 1.18;
    d.scale.set(.75 + rnd() * .56, s, .75 + rnd() * .56);
    d.updateMatrix();
    grass.setMatrixAt(n, d.matrix);
    col.setHSL(.255 + (rnd() - .5) * .035, .32 + rnd() * .16, .44 + rnd() * .17);
    grass.setColorAt(n, col);
    n++;
  }
  grass.count = n;
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  group.add(grass);

  function flowerPatch(texture, hueShift, maxCount, offsetSeed) {
    const geo = makeCrossGeometry(.34, .52);
    const w = windMaterial(texture, { color: 0xffffff, alphaTest: .22, sway: .045 });
    const mesh = new THREE.InstancedMesh(geo, w.mat, maxCount);
    mesh.castShadow = false;
    const rr = seededRandom(seed + offsetSeed);
    let placed = 0, tries = 0;
    while (placed < maxCount && tries++ < maxCount * 40) {
      const ang = rr() * Math.PI * 2;
      const r = 60 + rr() * 45;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const h = heightAt(x, z);
      if (h < .6 || h > 6.8 || exclude(x, z)) continue;
      d.position.set(x, h + .025, z);
      d.rotation.set(0, rr() * Math.PI * 2, 0);
      const s = .68 + rr() * .72;
      d.scale.setScalar(s);
      d.updateMatrix();
      mesh.setMatrixAt(placed, d.matrix);
      col.setHSL(hueShift + (rr() - .5) * .02, .42, .86 + rr() * .1);
      mesh.setColorAt(placed, col);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
    return { mesh, time: w.time };
  }

  const flowerN = isMobile ? 95 : 160;
  const white = flowerPatch(whiteTex, .14, flowerN, 11);
  const yellow = flowerPatch(yellowTex, .12, Math.round(flowerN * .75), 22);
  const purple = flowerPatch(purpleTex, .78, Math.round(flowerN * .65), 33);

  // Reeds: same real blade texture, taller/slimmer, only around the waterline.
  const reedGeo = makeCrossGeometry(.42, 1.38);
  const reedWind = windMaterial(grassTex, { color: 0xb2a977, alphaTest: .26, sway: .13 });
  const reedCount = isMobile ? 780 : 1300;
  const reeds = new THREE.InstancedMesh(reedGeo, reedWind.mat, reedCount);
  reeds.castShadow = false;
  let rn = 0, rt = 0;
  while (rn < reedCount && rt++ < reedCount * 45) {
    const ang = rnd() * Math.PI * 2;
    const r = 51 + rnd() * 18;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const h = heightAt(x, z);
    if (h < -.05 || h > 1.25 || exclude(x, z)) continue;
    d.position.set(x, h + .01, z);
    d.rotation.set(0, rnd() * Math.PI * 2, 0);
    const s = .72 + rnd() * .78;
    d.scale.set(.6 + rnd() * .4, s, .6 + rnd() * .4);
    d.updateMatrix();
    reeds.setMatrixAt(rn, d.matrix);
    col.setHSL(.17 + (rnd() - .5) * .035, .28, .43 + rnd() * .18);
    reeds.setColorAt(rn, col);
    rn++;
  }
  reeds.count = rn;
  reeds.instanceMatrix.needsUpdate = true;
  if (reeds.instanceColor) reeds.instanceColor.needsUpdate = true;
  group.add(reeds);

  return {
    group,
    grass,
    reeds,
    update(time) {
      grassWind.time.value = time;
      reedWind.time.value = time;
      white.time.value = time;
      yellow.time.value = time;
      purple.time.value = time;
    },
    reduce() {
      grass.count = Math.floor(grass.count * .68);
      reeds.count = Math.floor(reeds.count * .72);
    }
  };
}
