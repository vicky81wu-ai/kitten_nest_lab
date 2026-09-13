import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';

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
const coarse = matchMedia('(pointer: coarse)').matches;
const clamp = THREE.MathUtils.clamp;
const TAU = Math.PI * 2;
let hintTimer = 0;

function say(text, ms = 2600) {
  hint.textContent = text;
  hint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.hidden = true, ms);
}
function rngFactory(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const rnd = rngFactory(20260913);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !coarse || devicePixelRatio < 2,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.45 : 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc4d3c7, 0.0068);

const camera = new THREE.PerspectiveCamera(51, innerWidth / innerHeight, 0.1, 700);
camera.position.set(10, 8, 14);

scene.add(new THREE.HemisphereLight(0xe7f5ff, 0x66724f, 2.05));
const sun = new THREE.DirectionalLight(0xfff1cf, 3.7);
sun.position.set(-35, 58, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;
sun.shadow.bias = -0.00025;
scene.add(sun);

loadingText.textContent = '先把天空和湖面铺起来…';
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const skyU = sky.material.uniforms;
skyU.turbidity.value = 7.4;
skyU.rayleigh.value = 1.8;
skyU.mieCoefficient.value = 0.006;
skyU.mieDirectionalG.value = 0.79;
const sunVec = new THREE.Vector3();
sunVec.setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(90 - 36),
  THREE.MathUtils.degToRad(140)
);
skyU.sunPosition.value.copy(sunVec);

const waterNormals = new THREE.TextureLoader().load(
  'https://threejs.org/examples/textures/waternormals.jpg',
  (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
);
const water = new Water(new THREE.PlaneGeometry(520, 520), {
  textureWidth: coarse ? 512 : 1024,
  textureHeight: coarse ? 512 : 1024,
  waterNormals,
  sunDirection: sunVec.clone().normalize(),
  sunColor: 0xffefc8,
  waterColor: 0x315f68,
  distortionScale: 2.45,
  fog: true
});
water.rotation.x = -Math.PI / 2;
water.position.y = -0.34;
scene.add(water);

const world = new THREE.Group();
scene.add(world);

function material(color, roughness = .85, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
const M = {
  sand: material(0xc9b988, .96),
  grass: material(0x728c58, .94),
  grass2: material(0x8ca16b, .95),
  earth: material(0x715b42, 1),
  wood: material(0x74492f, .84),
  wood2: material(0xa2744d, .84),
  roof: material(0x594b43, .9),
  stone: material(0x7c8175, 1),
  stone2: material(0xa2a596, 1),
  leaf: material(0x526f4d, .92),
  leaf2: material(0x78906a, .92),
  pink: material(0xc48384, .85),
  cream: material(0xead8ad, .9),
  hull: material(0x88583f, .75),
  trim: material(0xf0ddb7, .78),
  metal: material(0x344541, .45, .22),
  skin: material(0xe9c8b0, .8),
  dress: material(0xe9dfd4, .88),
  hair: material(0xb9b1a8, .77),
  dark: material(0x5a5855, .82)
};

function makeMesh(geometry, mat, opt = {}) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(opt.x || 0, opt.y || 0, opt.z || 0);
  m.rotation.set(opt.rx || 0, opt.ry || 0, opt.rz || 0);
  m.castShadow = opt.cast !== false;
  m.receiveShadow = opt.receive !== false;
  return m;
}

loadingText.textContent = '把岸线和草坡垫起来…';
const beach = makeMesh(new THREE.CylinderGeometry(29, 31, 1.35, 64), M.sand, { y: -.95 });
beach.scale.set(1.14, 1, .82);
world.add(beach);
const grass = makeMesh(new THREE.CylinderGeometry(26.8, 28.6, 1.4, 64), M.grass, { y: -.18 });
grass.scale.set(1.13, 1, .82);
world.add(grass);
const hill = makeMesh(new THREE.CylinderGeometry(15.8, 18.5, 1.7, 48), M.grass2, { x: -5, y: .95, z: -3 });
hill.scale.set(1.28, 1, .82);
world.add(hill);

function islandMetric(x, z) {
  return Math.hypot(x / 31.2, z / 25.2);
}
function walkable(x, z) {
  return islandMetric(x, z) < .86;
}
function heightAt(x, z) {
  if (Math.hypot((x + 5) / 20, (z + 3) / 14) < .68) return 1.82;
  return .55;
}
function addRock(x, z, s) {
  const r = makeMesh(new THREE.DodecahedronGeometry(.7 * s, 0), rnd() > .7 ? M.stone2 : M.stone, {
    x, y: .05 + .22 * s, z, ry: rnd() * TAU
  });
  r.scale.set(1.2, .7 + rnd() * .35, .92);
  world.add(r);
}
for (let i = 0; i < 34; i++) {
  const a = rnd() * TAU;
  const d = 26 + rnd() * 4;
  addRock(Math.cos(a) * d * 1.13, Math.sin(a) * d * .82, .45 + rnd() * .85);
}

function addTree(x, z, s = 1, light = false) {
  const g = new THREE.Group();
  g.add(makeMesh(new THREE.CylinderGeometry(.16*s, .24*s, 2.5*s, 7), M.wood, { y: 1.25*s }));
  for (let i = 0; i < 4; i++) {
    const crown = makeMesh(new THREE.IcosahedronGeometry((1.02 + i*.09)*s, 1), light ? M.leaf2 : M.leaf, {
      x: (i - 1.5) * .36*s,
      y: (2.6 + Math.sin(i)*.24)*s,
      z: ((i % 2)-.5)*.4*s,
      ry: rnd()*TAU
    });
    crown.scale.y = .82;
    g.add(crown);
  }
  g.position.set(x, heightAt(x,z) - .54, z);
  g.rotation.y = rnd()*TAU;
  world.add(g);
}

const clear = (x,z) =>
  Math.hypot(x+7,z+4)>8 &&
  Math.hypot(x-18,z-3)>9 &&
  Math.hypot(x-2,z-5)>7;

for (let i = 0; i < 72; i++) {
  const a = rnd()*TAU;
  const d = 8 + rnd()*17;
  const x = Math.cos(a)*d*1.1;
  const z = Math.sin(a)*d*.8;
  if (walkable(x,z) && clear(x,z)) addTree(x,z,.68+rnd()*.72,i%3===0);
}

function addBush(x,z,s=1,flowers=false) {
  const g = new THREE.Group();
  for(let i=0;i<5;i++){
    const b=makeMesh(new THREE.IcosahedronGeometry((.38+rnd()*.2)*s,1),i%3?M.leaf:M.leaf2,{
      x:(rnd()-.5)*.85*s,y:.34*s+rnd()*.2*s,z:(rnd()-.5)*.7*s
    });
    g.add(b);
  }
  if(flowers) for(let i=0;i<5;i++) g.add(makeMesh(new THREE.SphereGeometry(.07*s,6,5),i%2?M.pink:M.cream,{
    x:(rnd()-.5)*.8*s,y:.65*s+rnd()*.22*s,z:(rnd()-.5)*.62*s
  }));
  g.position.set(x,heightAt(x,z)-.54,z);
  world.add(g);
}
for(let i=0;i<50;i++){
  const a=rnd()*TAU,d=5+rnd()*18,x=Math.cos(a)*d*1.08,z=Math.sin(a)*d*.8;
  if(walkable(x,z)&&clear(x,z))addBush(x,z,.6+rnd()*.65,i%4===0);
}

loadingText.textContent = '把湖边小屋扶正…';
const cabin = new THREE.Group();
cabin.add(makeMesh(new THREE.BoxGeometry(7.6,3.9,5.8),M.wood2,{y:2.25}));
const roof=makeMesh(new THREE.ConeGeometry(5.5,3.1,4),M.roof,{y:5.55,ry:Math.PI/4});
roof.scale.z=.75;cabin.add(roof);
cabin.add(makeMesh(new THREE.BoxGeometry(8.5,.3,2.4),M.wood,{y:.3,z:3.18}));
cabin.add(makeMesh(new THREE.BoxGeometry(1.2,2.45,.14),M.roof,{y:1.85,z:2.98}));
const glassMat=new THREE.MeshPhysicalMaterial({color:0xb8d9db,transparent:true,opacity:.6,roughness:.1,transmission:.12});
for(const x of [-2.15,2.15]){
  cabin.add(makeMesh(new THREE.BoxGeometry(1.55,1.55,.12),M.wood,{x,y:2.45,z:2.98}));
  cabin.add(makeMesh(new THREE.PlaneGeometry(1.18,1.18),glassMat,{x,y:2.45,z:3.05,cast:false}));
}
cabin.position.set(-7,1.25,-5);
cabin.rotation.y=.12;
world.add(cabin);

function addLamp(x,z){
  const g=new THREE.Group();
  g.add(makeMesh(new THREE.CylinderGeometry(.04,.06,2.2,8),M.metal,{y:1.1}));
  g.add(makeMesh(new THREE.SphereGeometry(.15,9,7),new THREE.MeshBasicMaterial({color:0xffe8a6}),{y:2.17,cast:false,receive:false}));
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffe5a0,transparent:true,opacity:.26,depthWrite:false}));
  halo.position.y=2.17;halo.scale.set(.9,.9,1);g.add(halo);
  g.position.set(x,heightAt(x,z)-.54,z);world.add(g);
}
addLamp(-3,-.7);addLamp(-11,-1.4);

loadingText.textContent = '搭码头、放木船…';
const dockPos = new THREE.Vector3(24,.25,3.5);
const dock = new THREE.Group();
for(let i=0;i<10;i++){
  dock.add(makeMesh(new THREE.BoxGeometry(1.02,.18,8.8),i%2?M.wood:M.wood2,{x:(i-4.5)*.96}));
}
for(const x of [-4.1,4.1])for(const z of [-3.4,3.4])dock.add(makeMesh(new THREE.CylinderGeometry(.1,.13,2.6,8),M.wood,{x,y:-.8,z}));
dock.position.copy(dockPos);dock.rotation.y=Math.PI/2;world.add(dock);

function makeBoat(){
  const g=new THREE.Group();
  const hull=makeMesh(new THREE.SphereGeometry(2.25,24,12),M.hull,{y:.18});
  hull.scale.set(.72,.38,1.42);g.add(hull);
  const cutter=makeMesh(new THREE.BoxGeometry(1.55,.45,4.8),M.trim,{y:.5});
  g.add(cutter);
  for(const z of [-1.4,0,1.35])g.add(makeMesh(new THREE.BoxGeometry(1.7,.18,.42),M.wood2,{y:.78,z}));
  const side1=makeMesh(new THREE.BoxGeometry(.1,.17,5.1),M.trim,{x:-.78,y:.73});
  const side2=side1.clone();side2.position.x=.78;g.add(side1,side2);
  return g;
}
const boat=makeBoat();
boat.position.set(31,-.12,3.5);
boat.rotation.y=Math.PI/2;
scene.add(boat);

loadingText.textContent = '叫醒岸边的小精灵…';
const fairies=[];
for(let i=0;i<(coarse?18:28);i++){
  const g=new THREE.Group();
  const c=i%3===0?0xffe7a2:i%3===1?0xc6f0d6:0xd7d1ff;
  g.add(makeMesh(new THREE.SphereGeometry(.075,8,6),new THREE.MeshBasicMaterial({color:c}),{cast:false,receive:false}));
  const wingMat=new THREE.MeshBasicMaterial({color:0xf5fff2,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false});
  const w1=makeMesh(new THREE.CircleGeometry(.13,10),wingMat,{x:-.1,ry:.7,cast:false,receive:false});
  const w2=w1.clone();w2.position.x=.1;w2.rotation.y=-.7;g.add(w1,w2);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({color:c,transparent:true,opacity:.22,depthWrite:false}));
  halo.scale.set(.65,.65,1);g.add(halo);
  const a=rnd()*TAU,d=4+rnd()*20;
  g.userData.base=new THREE.Vector3(Math.cos(a)*d,1.2+rnd()*3.6,Math.sin(a)*d*.78);
  g.userData.phase=rnd()*TAU;g.userData.speed=.4+rnd()*.55;
  g.position.copy(g.userData.base);scene.add(g);fairies.push(g);
}

function makeAvatar(){
  const g=new THREE.Group();
  g.add(makeMesh(new THREE.CylinderGeometry(.32,.43,.88,10),M.dress,{y:1.12}));
  g.add(makeMesh(new THREE.ConeGeometry(.62,.95,12),M.dress,{y:.48}));
  g.add(makeMesh(new THREE.SphereGeometry(.34,16,12),M.skin,{y:1.94}));
  const hair=makeMesh(new THREE.SphereGeometry(.37,16,12),M.hair,{y:2.03,z:-.04});
  hair.scale.set(.98,.94,.94);g.add(hair);
  g.add(makeMesh(new THREE.CylinderGeometry(.08,.08,.62,8),M.skin,{x:-.18,y:-.08}));
  g.add(makeMesh(new THREE.CylinderGeometry(.08,.08,.62,8),M.skin,{x:.18,y:-.08}));
  g.add(makeMesh(new THREE.BoxGeometry(.2,.16,.34),M.dark,{x:-.18,y:-.43,z:.08}));
  g.add(makeMesh(new THREE.BoxGeometry(.2,.16,.34),M.dark,{x:.18,y:-.43,z:.08}));
  return g;
}
const avatar=makeAvatar();
avatar.position.set(7,heightAt(7,4)+.55,4);
world.add(avatar);

const move={x:0,y:0};
const keys=new Set();
const boatState={active:false,speed:0,yaw:Math.PI/2};
let stickPointer=null;
let camDrag=null;
let camYaw=-2.4;
let camPitch=.42;
let camDistance=9.5;
let bob=0;

function keyboardInput(){
  let x=0,y=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))y++;
  if(keys.has('KeyS')||keys.has('ArrowDown'))y--;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;
  if(keys.has('KeyD')||keys.has('ArrowRight'))x++;
  const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l};
}
function setStick(e){
  const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,l=Math.hypot(dx,dy);
  if(l>max){dx*=max/l;dy*=max/l}
  move.x=dx/max;move.y=-dy/max;
  knob.style.transform='translate('+dx+'px,'+dy+'px)';
}
stick.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);setStick(e)});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)setStick(e)});
function releaseStick(e){if(stickPointer!==null&&e.pointerId!==stickPointer)return;stickPointer=null;move.x=move.y=0;knob.style.transform='translate(0,0)'}
stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);

cameraPad.addEventListener('pointerdown',e=>{camDrag={id:e.pointerId,x:e.clientX,y:e.clientY};cameraPad.setPointerCapture(e.pointerId)});
cameraPad.addEventListener('pointermove',e=>{
  if(!camDrag||camDrag.id!==e.pointerId)return;
  camYaw-=(e.clientX-camDrag.x)*.0062;
  camPitch=clamp(camPitch-(e.clientY-camDrag.y)*.0048,.15,.72);
  camDrag.x=e.clientX;camDrag.y=e.clientY;
});
cameraPad.addEventListener('pointerup',e=>{if(camDrag?.id===e.pointerId)camDrag=null});
cameraPad.addEventListener('pointercancel',e=>{if(camDrag?.id===e.pointerId)camDrag=null});
addEventListener('keydown',e=>{keys.add(e.code);if(e.code.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('wheel',e=>camDistance=clamp(camDistance+Math.sign(e.deltaY)*.7,6.2,14.5),{passive:true});

function nearBoat(){
  if(boatState.active)return false;
  const p=avatar.getWorldPosition(new THREE.Vector3());
  return p.distanceTo(boat.position)<5.1;
}
function updateAction(){
  if(boatState.active){action.textContent='下船';action.classList.add('ready');mode.textContent='小船航行'}
  else if(nearBoat()){action.textContent='上船';action.classList.add('ready');mode.textContent='码头边'}
  else{action.textContent='去码头';action.classList.remove('ready');mode.textContent='岸上散步'}
}
function board(){
  boatState.active=true;boatState.speed=0;
  avatar.parent.remove(avatar);boat.add(avatar);avatar.position.set(0,1,-.5);avatar.rotation.set(0,0,0);
  say('上船了。左下摇杆控制航向和速度。',3200);
}
function leaveBoat(){
  boatState.active=false;boatState.speed=0;
  avatar.parent.remove(avatar);world.add(avatar);
  avatar.position.set(22,heightAt(22,3.5)+.55,3.5);
  say('回岸上了。小船会停在你离开的地方。');
}
action.addEventListener('click',()=>{if(boatState.active)leaveBoat();else if(nearBoat())board();else say('沿着右边岸线去码头，木船真的可以开。')});
$('#back').addEventListener('click',()=>location.href='./index.html');
$('#help').addEventListener('click',()=>helpPanel.hidden=false);
$('#closeHelp').addEventListener('click',()=>helpPanel.hidden=true);
helpPanel.addEventListener('click',e=>{if(e.target===helpPanel)helpPanel.hidden=true});

const forward=new THREE.Vector3(),right=new THREE.Vector3(),dir=new THREE.Vector3();
function updateAvatar(dt){
  if(boatState.active)return;
  const k=keyboardInput();
  const useStick=Math.abs(move.x)+Math.abs(move.y)>.05;
  const ix=useStick?move.x:k.x,iy=useStick?move.y:k.y;
  const mag=clamp(Math.hypot(ix,iy),0,1);
  if(mag>.05){
    forward.set(Math.sin(camYaw),0,Math.cos(camYaw));
    right.set(forward.z,0,-forward.x);
    dir.copy(forward).multiplyScalar(iy).addScaledVector(right,ix).normalize();
    const nx=avatar.position.x+dir.x*4.2*dt,nz=avatar.position.z+dir.z*4.2*dt;
    if(walkable(nx,nz)){avatar.position.x=nx;avatar.position.z=nz;avatar.position.y=heightAt(nx,nz)+.55}
    const target=Math.atan2(dir.x,dir.z);
    let d=Math.atan2(Math.sin(target-avatar.rotation.y),Math.cos(target-avatar.rotation.y));
    avatar.rotation.y+=d*Math.min(1,dt*10);
    bob+=dt*12;avatar.position.y+=Math.sin(bob)*.022;
  } else bob=0;
}
let shoreWarn=0;
function updateBoat(dt,t){
  if(!boatState.active){
    boat.position.y=-.1+Math.sin(t*1.5)*.04;boat.rotation.z=Math.sin(t*.8)*.012;return;
  }
  const k=keyboardInput(),useStick=Math.abs(move.x)+Math.abs(move.y)>.05;
  const steer=useStick?move.x:k.x,throttle=useStick?move.y:k.y;
  boatState.speed+=throttle*dt*4.2;
  boatState.speed*=Math.pow(.965,dt*60);
  boatState.speed=clamp(boatState.speed,-2.1,6.3);
  boatState.yaw-=steer*dt*1.35*(.45+.55*Math.min(1,Math.abs(boatState.speed)/2.5))*Math.sign(boatState.speed||1);
  dir.set(Math.sin(boatState.yaw),0,Math.cos(boatState.yaw));
  const nx=boat.position.x+dir.x*boatState.speed*dt,nz=boat.position.z+dir.z*boatState.speed*dt;
  if(islandMetric(nx,nz)>.98){boat.position.x=nx;boat.position.z=nz}
  else{boatState.speed*=.35;if(t>shoreWarn){shoreWarn=t+1.3;say('浅水碰岸了，转出去一点。',900)}}
  boat.rotation.y=boatState.yaw;
  boat.position.y=-.11+Math.sin(t*1.8+boat.position.x*.06)*.055;
  boat.rotation.z=THREE.MathUtils.lerp(boat.rotation.z,-steer*.07,.08);
  boat.rotation.x=THREE.MathUtils.lerp(boat.rotation.x,Math.sin(t*1.9)*.012-.009*boatState.speed,.06);
}
function updateFairies(t){
  for(const f of fairies){
    const b=f.userData.base,p=f.userData.phase,s=f.userData.speed;
    f.position.set(b.x+Math.sin(t*s+p)*1.15,b.y+Math.sin(t*s*1.7+p)*.34,b.z+Math.cos(t*s*.83+p)*.78);
    f.rotation.y=t*s;
    if(f.children[1])f.children[1].rotation.z=Math.sin(t*15+p)*.3;
    if(f.children[2])f.children[2].rotation.z=-Math.sin(t*15+p)*.3;
  }
}
function lerpAngle(a,b,t){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t}
function updateCamera(dt){
  const target=boatState.active?boat.position.clone().add(new THREE.Vector3(0,1.4,0)):avatar.position.clone().add(new THREE.Vector3(0,1.35,0));
  if(boatState.active)camYaw=lerpAngle(camYaw,boatState.yaw+Math.PI,.012);
  const cp=Math.cos(camPitch),sp=Math.sin(camPitch);
  const desired=new THREE.Vector3(target.x+Math.sin(camYaw)*cp*camDistance,target.y+sp*camDistance,target.z+Math.cos(camYaw)*cp*camDistance);
  camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);
}
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.45:2));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,180));

const clock=new THREE.Clock();
function frame(){
  const dt=Math.min(.033,clock.getDelta()),t=clock.elapsedTime;
  updateAvatar(dt);updateBoat(dt,t);updateFairies(t);updateCamera(dt);updateAction();
  water.material.uniforms.time.value+=dt*.42;
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
setTimeout(()=>{loading.classList.add('done');say('湖岸试验场开了。先沿右边走去码头看看。',3800)},850);
frame();
