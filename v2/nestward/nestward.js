commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/v2/nestward/nestward.js b/v2/nestward/nestward.js
index 885938c..9161323 100644
--- a/v2/nestward/nestward.js
+++ b/v2/nestward/nestward.js
@@ -1,6 +1,22 @@
-import { SCENES, WORLD_HEIGHT, clamp, distance, findPath, nearestWalkable, pointInsideHit, seededRandom } from './world-model.js';
+import {
+  DOOR_AWAY_CALIBRATION,
+  SCENES,
+  WORLD_HEIGHT,
+  clamp,
+  distance,
+  findPath,
+  nearestWalkable,
+  pointInsideHit,
+  seededRandom
+} from './world-model.js';
 import { WorldRenderer } from './world-renderer.js';
 import { SpeechRuntime } from './speech-runtime.js';
+import { actorControlAllows, setActorRoute, stopActorRoute, updateActorRoute } from './actor-motion.js';
+import { DoorOcclusionController } from './door-occlusion-controller.js';
+import { loadDoorOcclusionAssets } from './door-asset-loader.js';
+import { createDoorWalkPlanner } from './door-walk-planner.js';
+import { DoorAwayController } from './door-away-controller.js';
+import { DoorTransitionController } from './door-transition-controller.js';
 
 const $ = (selector) => document.querySelector(selector);
 const canvas = $('#world');
@@ -21,8 +37,11 @@ const hubbyOutfits = $('#hubbyOutfits');
 const transition = $('#transition');
 const loading = $('#loading');
 const renderer = new WorldRenderer(canvas);
+const doorOcclusion = new DoorOcclusionController();
+renderer.setActorOcclusionProvider((currentState, actor) => doorOcclusion.effectFor(currentState, actor));
 const random = seededRandom(19819819);
 const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
+const doorCandidateQA = new URLSearchParams(globalThis.location?.search || '').has('doorCandidate');
 
 function readStore(key, fallback) {
   try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
@@ -34,7 +53,7 @@ function makeActor(id, spawn, extra) {
   return Object.assign({
     id, x: spawn.x, z: spawn.z, path: [], afterMove: null,
     dir: id === 'hubby' ? -1 : 1, walking: false, step: 0,
-    travelDir: null, action: null, mount: null, nextThink: 0
+    travelDir: null, routeFacing: null, controlOwner: null, action: null, mount: null, nextThink: 0
   }, extra);
 }
 
@@ -111,6 +130,25 @@ const speech = new SpeechRuntime({
       { speaker: 'hubby', text: '听见了。家庭限定公主抱，沿途可以随时改目的地。' },
       { speaker: 'hubby', text: '到了想停的地方就点它。我先不放小猫下来。' }
     ]
+  },
+  'hubby.doorAway': {
+    playback: 'manual', loop: true, participants: ['hubby'], speaker: 'hubby',
+    lines: [
+      '还没走远，小猫就来查岗了？',
+      '奶栗闻一棵树能闻半天。',
+      '外面风还行，等下回去抱小猫。',
+      '我在呢。只是带奶栗绕两圈。',
+      '你是不是在门里偷偷看我。'
+    ]
+  },
+  'naili.doorAway': {
+    playback: 'manual', loop: true, participants: ['naili'], speaker: 'naili',
+    lines: [
+      '奶栗：忙着闻。',
+      '奶栗：还没逛够。',
+      '奶栗：……发现一片很重要的叶子。',
+      '奶栗：不回头，假装没听见小猫。'
+    ]
   }
 });
 
@@ -124,6 +162,10 @@ const activePointers = new Map();
 let gesture = null;
 let longPressTimer = null;
 let longPressFired = false;
+let doorAway = null;
+let doorTransition = null;
+let doorAssetState = { ready: false, reason: 'door assets have not been checked' };
+let doorTestUI = null;
 
 hubby.nextThink = performance.now() / 1000 + 6;
 naili.nextThink = performance.now() / 1000 + 5;
@@ -145,63 +187,48 @@ function resize() {
   state.cameraY = clamp(state.cameraY, 0, maxCameraY());
   positionOverlays();
 }
-function stopActor(actor) {
-  actor.path.length = 0;
-  actor.walking = false;
-  actor.travelDir = null;
-  actor.afterMove = null;
+function stopActor(actor, options = {}) {
+  return stopActorRoute(actor, options);
 }
 function walkActor(actor, target, afterMove, options = {}) {
+  if (!actorControlAllows(actor, options.owner || 'world')) return [];
   if (!options.preservePose) {
     actor.action = null;
     actor.mount = null;
   }
   if (actor === player || (state.princessCarry.active && actor === hubby)) state.cameraFree = false;
+  const path = findPath(scene, actor, target);
+  if (options.exactTarget && path.length) path[path.length - 1] = { x: target.x, z: target.z };
   const journeyDx = target.x - actor.x;
-  actor.travelDir = Math.abs(journeyDx) > 24 ? (journeyDx > 0 ? 1 : -1) : null;
-  if (actor.travelDir) actor.dir = actor.travelDir;
-  actor.path = findPath(scene, actor, target);
-  if (options.exactTarget && actor.path.length) actor.path[actor.path.length - 1] = { x: target.x, z: target.z };
-  actor.afterMove = afterMove || null;
-  if (!actor.path.length) {
-    actor.travelDir = null;
-  }
-  if (!actor.path.length && afterMove) {
-    actor.afterMove = null;
-    afterMove();
+  const journeyDirection = Math.abs(journeyDx) > 24 ? (journeyDx > 0 ? 1 : -1) : null;
+  return setActorRoute(actor, path, afterMove, {
+    facing: options.facing,
+    journeyDirection: options.facing === 'segment' ? undefined : journeyDirection,
+    owner: options.owner
+  });
+}
+function walkActorExactRoute(actor, points, afterMove, options = {}) {
+  if (!actorControlAllows(actor, options.owner || 'world')) return [];
+  if (!options.preservePose) {
+    actor.action = null;
+    actor.mount = null;
   }
+  if (actor === player || (state.princessCarry.active && actor === hubby)) state.cameraFree = false;
+  return setActorRoute(actor, points, afterMove, {
+    facing: options.facing || 'segment',
+    owner: options.owner
+  });
 }
 function updateActor(actor, delta) {
-  if (!actor.path.length) {
-    actor.walking = false;
-    if (actor === player) actor.flying = false;
-    return;
-  }
-  const target = actor.path[0];
-  const dx = target.x - actor.x;
-  const dz = (target.z - actor.z) * 520;
-  const metric = Math.hypot(dx, dz);
-  const step = actor.speed * delta;
-  actor.walking = true;
-  actor.step += delta * (actor === naili ? 11 : 8.5);
-  if (actor.travelDir) actor.dir = actor.travelDir;
-  else if (Math.abs(dx) > 18) actor.dir = dx > 0 ? 1 : -1;
-  if (metric <= step + 1) {
-    actor.x = target.x;
-    actor.z = target.z;
-    actor.path.shift();
-    if (!actor.path.length) {
-      actor.walking = false;
-      actor.travelDir = null;
-      const callback = actor.afterMove;
-      actor.afterMove = null;
-      if (callback) callback();
+  updateActorRoute(actor, delta, {
+    stepRate: actor === naili ? 11 : 8.5,
+    onIdle: () => {
+      if (actor === player) actor.flying = false;
+    },
+    onMoving: () => {
+      if (actor === player) actor.flying = player.wings && !state.swing.active && actor.walking;
     }
-    return;
-  }
-  actor.x += dx / metric * step;
-  actor.z += dz / metric * step / 520;
-  if (actor === player) actor.flying = player.wings && !state.swing.active;
+  });
 }
 function updateCamera(delta) {
   const focus = state.princessCarry.active ? hubby : player;
@@ -223,17 +250,20 @@ function updateCompanions(time) {
     player.flying = false;
     stopActor(player);
   }
+  const doorOwnsNaili = doorAway?.ownsActor(naili);
+  const doorOwnsHubby = doorAway?.ownsActor(hubby);
   if (naili.carried) {
     naili.x = player.x;
     naili.z = player.z;
     stopActor(naili);
-  } else if (naili.summoned && distance(naili, player) > 115 && time > naili.nextThink) {
+  } else if (!doorOwnsNaili && naili.summoned && distance(naili, player) > 115 && time > naili.nextThink) {
     naili.nextThink = time + 1.25;
     walkActor(naili, { x: player.x - player.dir * 54, z: clamp(player.z + .035, .12, .94) });
-  } else if (!naili.summoned && !naili.path.length && time > naili.nextThink) {
+  } else if (!doorOwnsNaili && !naili.summoned && !naili.path.length && time > naili.nextThink) {
     naili.nextThink = time + 5 + random() * 5;
     walkActor(naili, { x: clamp(naili.x + (random() - .5) * 290, 100, scene.width - 100), z: .7 + random() * .2 });
   }
+  if (doorOwnsHubby) return;
   if (state.doorTravel) return;
   if (state.princessCarry.active) return;
   if (hubby.follow && distance(hubby, player) > 155 && time > hubby.nextThink) {
@@ -343,24 +373,27 @@ function showActions(title, choices, anchor) {
   positionOverlays();
 }
 function settleAt(actor, x, z, action) {
-  stopActor(actor);
+  if (!stopActor(actor)) return false;
   actor.x = x;
   actor.z = z;
   actor.mount = null;
   actor.action = action || null;
+  return true;
 }
 function mountActor(actor, mount, action) {
   if (!mount) return;
-  stopActor(actor);
+  if (!stopActor(actor)) return false;
   actor.x = mount.x;
   actor.z = mount.z;
   actor.mount = { ...mount };
   actor.action = action || mount.pose || null;
+  return true;
 }
 function standActor(actor) {
-  stopActor(actor);
+  if (!stopActor(actor)) return false;
   actor.mount = null;
   actor.action = null;
+  return true;
 }
 function poseActorInPlace(actor, pose) {
   if (!['bed-sit', 'bed-lie', 'bed-lean'].includes(pose)) return;
@@ -415,6 +448,7 @@ function beginPrincessCarry() {
   applySpeechEvent(speech.activate('carry.ride', performance.now(), { restart: true }));
 }
 function startPrincessCarry() {
+  if (doorActorUnavailable(hubby)) return;
   if (state.princessCarry.active) {
     stopPrincessCarry();
     return;
@@ -424,17 +458,22 @@ function startPrincessCarry() {
   else walkActor(hubby, target, beginPrincessCarry);
 }
 function actorSpeechId(actor) {
+  const doorScript = doorAway?.speechScriptFor(actor);
+  if (doorScript) return doorScript;
   if (state.princessCarry.active && (actor === player || actor === hubby)) return 'carry.ride';
   return actor === player ? 'player.wander' : 'hubby.wander';
 }
 function showActorSpeech(actor) {
   hideActions();
-  if (actor === naili) {
+  const id = actorSpeechId(actor);
+  if (actor === naili && id !== 'naili.doorAway') {
     say(naili.carried ? '呼噜。' : '喵。', 'naili', 3000);
     return;
   }
-  const id = actorSpeechId(actor);
-  let event = speech.owns(actor.id) ? speech.advance(performance.now()) : speech.activate(id, performance.now());
+  const currentScript = speech.snapshot()?.scriptId;
+  let event = currentScript === id && speech.owns(actor.id)
+    ? speech.advance(performance.now())
+    : speech.activate(id, performance.now());
   if (event?.complete) event = speech.activate(id, performance.now(), { restart: true });
   applySpeechEvent(event);
 }
@@ -501,8 +540,15 @@ function unlockWings() {
 function sceneObject(id) {
   return scene.objects.find((object) => object.id === id);
 }
+function doorActorUnavailable(actor) {
+  if (!doorAway?.ownsActor(actor)) return false;
+  const name = actor === naili ? '奶栗' : 'Hubby';
+  showHint(`${name} 正在完成这次出门，先不把它从门外拉回家具。`, 3000);
+  return true;
+}
 function togetherAt(id, action) {
   return () => {
+    if (doorActorUnavailable(hubby)) return;
     const object = sceneObject(id);
     if (object?.mounts?.kittenLean && object?.mounts?.hubbyLean) {
       mountActor(player, object.mounts.kittenLean, action);
@@ -542,10 +588,12 @@ function objectChoices(object) {
         say('前扶手在腿前面，椅背在身后。这样才叫真的坐进去。', 'hubby');
       } },
       { label: '让 Hubby 坐', run: () => {
+        if (doorActorUnavailable(hubby)) return;
         mountActor(hubby, { ...object.mounts.hubbySit, objectId: object.id }, 'sit-reading-chair');
         say('坐好了。小猫可以绕到前面检查每一层。', 'hubby');
       } },
       { label: '一起聊会儿', run: () => {
+        if (doorActorUnavailable(hubby)) return;
         mountActor(player, { ...object.mounts.kittenSit, objectId: object.id }, 'sit-reading-chair');
         settleAt(hubby, object.x + 128, clamp(object.z + .055, .12, .92), 'stand-by-chair');
         applySpeechEvent(speech.activate('chair.together', performance.now(), { restart: true }));
@@ -567,16 +615,16 @@ function objectChoices(object) {
     ],
     swing: [
       { label: '荡秋千', run: () => { state.swing.active = true; state.swing.pushed = false; say('手抓稳。小猫自己先荡两下。'); } },
-      { label: '让 Hubby 推', run: () => { const slot = object.slots.hubbyPush; state.swing.active = true; state.swing.pushed = true; settleAt(hubby, slot.x, slot.z, 'push-swing'); say('会推高一点，但我接得住。'); } },
+      { label: '让 Hubby 推', run: () => { if (doorActorUnavailable(hubby)) return; const slot = object.slots.hubbyPush; state.swing.active = true; state.swing.pushed = true; settleAt(hubby, slot.x, slot.z, 'push-swing'); say('会推高一点，但我接得住。'); } },
       { label: '下来', run: () => { state.swing.active = false; state.swing.pushed = false; player.action = null; } }
     ],
     garden: [
       { label: '蹲下看花', run: () => { player.action = 'crouch'; say('这一朵刚好是小猫喜欢的颜色。'); } },
-      { label: '叫奶栗来闻', run: () => { naili.summoned = true; walkActor(naili, object.slots.naili); say('喵。', 'naili'); } }
+      { label: '叫奶栗来闻', run: () => { if (doorActorUnavailable(naili)) return; naili.summoned = true; walkActor(naili, object.slots.naili); say('喵。', 'naili'); } }
     ],
     teaTable: [
       { label: '院子里吃点心', run: () => { player.action = 'sit-tea'; say('慢慢吃。掉下来的碎屑归奶栗。'); } },
-      { label: '等 Hubby 端茶', run: () => { const slot = object.slots.hubbyServe; settleAt(hubby, slot.x, slot.z, 'serve-tea'); say('坐着别动，我端过来。'); } }
+      { label: '等 Hubby 端茶', run: () => { if (doorActorUnavailable(hubby)) return; const slot = object.slots.hubbyServe; settleAt(hubby, slot.x, slot.z, 'serve-tea'); say('坐着别动，我端过来。'); } }
     ],
     fountain: [
       { label: readStore('nestward.wingsUnlocked', 'false') === 'true' ? '再许一个愿' : '许一个愿', run: unlockWings },
@@ -590,7 +638,7 @@ function objectChoices(object) {
     ],
     pond: [
       { label: '看一会萤火', run: () => { player.action = 'crouch'; say('不必抓。它们会自己落到小猫附近。'); } },
-      { label: '和奶栗等青蛙', run: () => { naili.summoned = true; walkActor(naili, object.slots.naili); say('奶栗比青蛙先等困。'); } }
+      { label: '和奶栗等青蛙', run: () => { if (doorActorUnavailable(naili)) return; naili.summoned = true; walkActor(naili, object.slots.naili); say('奶栗比青蛙先等困。'); } }
     ],
     bower: [
       { label: '躲进藤架', run: () => { player.action = 'sit-bower'; say('这里够安静。小猫想叽咕多久都行。'); } },
@@ -636,7 +684,7 @@ function nearestApproachPoint(actor, object) {
   });
 }
 
-function approachDoor(object) {
+function approachDoorLegacy(object) {
   hideActions();
   hideBubble();
   state.activeObjectId = object.id;
@@ -663,7 +711,19 @@ function approachDoor(object) {
   walkActor(hubby, hubbyTarget, arrive, { exactTarget: true });
 }
 
+function approachDoor(object) {
+  if (doorTransition?.ready && !state.princessCarry.active && doorTransition.start()) {
+    state.activeObjectId = object.id;
+    return;
+  }
+  approachDoorLegacy(object);
+}
+
 function approachObject(object) {
+  if (object.direct && doorAway?.blocksDoor(object)) {
+    showHint('Hubby 和奶栗还在门外。先叫他们回来，再走正常院门。', 3200);
+    return;
+  }
   if (!state.princessCarry.active && (player.mount || state.swing.active)) {
     showHint('先点地板起身，再去碰别的东西。', 3200);
     return;
@@ -683,6 +743,7 @@ function approachObject(object) {
   walkActor(mover, nearestApproachPoint(mover, object), () => arriveAtObject(object));
 }
 function showNailiActions() {
+  if (doorActorUnavailable(naili)) return;
   showActions('奶栗', [
     { label: naili.carried ? '放下来' : '抱起来', run: () => {
       naili.carried = !naili.carried;
@@ -723,6 +784,7 @@ function showPlayerActions() {
   showActions('小猫', choices, { kind: 'actor', actor: player });
 }
 function showHubbyActions() {
+  if (doorActorUnavailable(hubby)) return;
   if (state.princessCarry.active) {
     showActions('Hubby', [
       { label: '放小猫下来', run: () => stopPrincessCarry() }
@@ -755,53 +817,63 @@ function showActorActions(actor) {
   else if (actor === hubby) showHubbyActions();
   else showNailiActions();
 }
-async function changeScene(nextName) {
-  if (changingScene) return;
+async function changeScene(nextName, options = {}) {
+  if (changingScene) return false;
   const carryWasActive = state.princessCarry.active;
   changingScene = true;
   hideActions();
   hideBubble();
   transition.classList.add('show');
-  await pause(250);
-  const previous = sceneName;
-  sceneName = nextName;
-  scene = SCENES[sceneName];
-  canvas.dataset.scene = sceneName;
-  const entryKey = previous === 'indoor' ? 'fromIndoor' : 'fromOutdoor';
-  const entry = scene.entry[entryKey] || scene.spawn;
-  if (carryWasActive) {
-    const anchor = scene.doorway?.carryAnchor || entry.hubby || entry.player;
-    Object.assign(hubby, anchor);
-    Object.assign(player, anchor);
-  } else if (previous === 'outdoor' && sceneName === 'indoor') {
-    Object.assign(player, scene.doorway?.kittenA || entry.player);
-    Object.assign(hubby, scene.doorway?.hubbyExit || entry.hubby);
-  } else {
-    Object.assign(player, entry.player);
-    Object.assign(hubby, entry.hubby);
-  }
-  if (!naili.carried) Object.assign(naili, entry.naili);
-  [player, hubby, naili].forEach((actor) => {
-    stopActor(actor);
-    actor.action = null;
-    actor.mount = null;
-  });
-  state.swing.active = false;
-  state.swing.pushed = false;
-  state.princessCarry.active = carryWasActive;
-  if (carryWasActive) {
-    player.x = hubby.x;
-    player.z = hubby.z;
-    player.dir = hubby.dir;
-    hubby.action = 'princess-carry';
+  let previous;
+  try {
+    await pause(250);
+    previous = sceneName;
+    sceneName = nextName;
+    scene = SCENES[sceneName];
+    canvas.dataset.scene = sceneName;
+    const entryKey = previous === 'indoor' ? 'fromIndoor' : 'fromOutdoor';
+    const entry = scene.entry[entryKey] || scene.spawn;
+    if (carryWasActive) {
+      const anchor = scene.doorway?.carryAnchor || entry.hubby || entry.player;
+      Object.assign(hubby, anchor);
+      Object.assign(player, anchor);
+    } else if (!options.doorManaged && previous === 'outdoor' && sceneName === 'indoor') {
+      Object.assign(player, scene.doorway?.kittenA || entry.player);
+      Object.assign(hubby, scene.doorway?.hubbyExit || entry.hubby);
+    } else {
+      Object.assign(player, entry.player);
+      Object.assign(hubby, entry.hubby);
+    }
+    if (!naili.carried) Object.assign(naili, entry.naili);
+    [player, hubby, naili].forEach((actor) => {
+      stopActor(actor, { owner: options.movementOwner });
+      actor.action = null;
+      actor.mount = null;
+    });
+    state.swing.active = false;
+    state.swing.pushed = false;
+    state.princessCarry.active = carryWasActive;
+    if (carryWasActive) {
+      player.x = hubby.x;
+      player.z = hubby.z;
+      player.dir = hubby.dir;
+      hubby.action = 'princess-carry';
+    }
+    if (options.beforeReveal) await options.beforeReveal({ previous, current: sceneName });
+    state.cameraFree = false;
+    setInitialCamera();
+    renderer.ensureCache(scene);
+    await pause(80);
+  } catch (error) {
+    transition.classList.remove('show');
+    changingScene = false;
+    throw error;
   }
-  state.cameraFree = false;
-  setInitialCamera();
-  renderer.ensureCache(scene);
-  await pause(80);
   transition.classList.remove('show');
   changingScene = false;
 
+  if (options.doorManaged) return true;
+
   if (!carryWasActive && previous === 'outdoor' && sceneName === 'indoor') {
     const kittenB = scene.doorway?.kittenB;
     const hubbyArrival = scene.doorway?.hubbyArrival;
@@ -813,9 +885,126 @@ async function changeScene(nextName) {
     }
   }
   state.doorTravel = false;
+  return true;
+}
+
+function installDoorTestUI() {
+  const explicitTestControls = new URLSearchParams(globalThis.location?.search || '').has('doorAwayTest');
+  if (doorTestUI || (!doorCandidateQA && !explicitTestControls)) return;
+  doorTestUI = document.createElement('div');
+  doorTestUI.id = 'doorAwayTestControls';
+  doorTestUI.setAttribute('aria-label', 'Door subsystem construction controls');
+  Object.assign(doorTestUI.style, {
+    position: 'absolute', zIndex: '91', right: '10px', top: 'max(62px, calc(env(safe-area-inset-top) + 54px))',
+    display: 'grid', gridTemplateColumns: 'auto auto', gap: '5px', padding: '6px', borderRadius: '12px',
+    background: 'rgba(29,20,17,.58)', border: '1px solid rgba(255,245,232,.14)', backdropFilter: 'blur(7px)'
+  });
+  doorTestUI.innerHTML = '<button data-away-start type="button">出去</button><button data-away-recall type="button">叫回来</button><small data-away-status style="grid-column:1/-1;text-align:center;color:rgba(255,247,238,.75);font:10px/1.2 -apple-system,BlinkMacSystemFont,sans-serif">检查门框资产…</small>';
+  for (const button of doorTestUI.querySelectorAll('button')) {
+    Object.assign(button.style, {
+      minWidth: '58px', minHeight: '34px', border: '1px solid rgba(255,245,232,.14)', borderRadius: '10px',
+      background: 'rgba(255,248,238,.91)', color: '#4b352d', font: '700 12px/1 -apple-system,BlinkMacSystemFont,sans-serif'
+    });
+  }
+  doorTestUI.querySelector('[data-away-start]').addEventListener('click', () => doorAway?.start());
+  doorTestUI.querySelector('[data-away-recall]').addEventListener('click', () => doorAway?.recall());
+  $('#nestward').append(doorTestUI);
+  syncDoorTestUI();
+}
+
+function syncDoorTestUI() {
+  if (!doorTestUI) return;
+  const start = doorTestUI.querySelector('[data-away-start]');
+  const recall = doorTestUI.querySelector('[data-away-recall]');
+  const status = doorTestUI.querySelector('[data-away-status]');
+  start.disabled = !doorAway?.ready || doorAway.active;
+  recall.disabled = doorAway?.status.phase !== 'outside';
+  if (!doorAssetState.ready) status.textContent = '等待已验收 A/B 笔刷导出';
+  else if (doorAssetState.candidate) status.textContent = `候选门框 QA · ${doorAway?.status.label || '就绪'}`;
+  else status.textContent = doorAway?.status.label || '门框资产就绪';
+}
+
+function exposeDoorDebug() {
+  const subsystem = {
+    startAway: () => doorAway?.start() || false,
+    recall: () => doorAway?.recall() || false,
+    get status() {
+      return {
+        assets: {
+          ready: Boolean(doorAssetState.ready),
+          candidate: Boolean(doorAssetState.candidate),
+          activation: doorAssetState.activation || 'baseline-fallback',
+          status: doorAssetState.manifest?.status || null,
+          reason: doorAssetState.reason || doorAssetState.error?.message || null
+        },
+        occlusion: doorOcclusion.snapshot(),
+        away: doorAway?.status || { phase: 'disabled', ready: false },
+        transition: doorTransition?.status || { phase: 'baseline-fallback', ready: false }
+      };
+    }
+  };
+  globalThis.__NW_DOOR_SUBSYSTEM__ = subsystem;
+  globalThis.__NW_DOOR_AWAY__ = {
+    start: subsystem.startAway,
+    recall: subsystem.recall,
+    get status() { return subsystem.status.away; }
+  };
+  globalThis.__NW_DOOR_TRANSITION__ = {
+    get status() { return subsystem.status.transition; }
+  };
+}
+
+async function prepareDoorSubsystem() {
+  installDoorTestUI();
+  exposeDoorDebug();
+  try {
+    doorAssetState = await loadDoorOcclusionAssets({ allowCandidate: doorCandidateQA });
+    if (!doorAssetState.ready) {
+      syncDoorTestUI();
+      return false;
+    }
+    const planner = createDoorWalkPlanner(
+      doorAssetState.masks.walk,
+      SCENES.indoor,
+      DOOR_AWAY_CALIBRATION.point2
+    );
+    if (!planner.ready) throw new Error('The accepted Door walk mask has no connected component at point2.');
+    doorOcclusion.installMasks(doorAssetState.masks);
+    doorAway = new DoorAwayController({
+      state,
+      occlusion: doorOcclusion,
+      planner,
+      navigateNormal: (actor, target, afterMove, options) => walkActor(actor, target, afterMove, { ...options, owner: 'doorAway' }),
+      navigateExact: (actor, points, afterMove, options) => walkActorExactRoute(actor, points, afterMove, { ...options, owner: 'doorAway' }),
+      stopActor: (actor) => stopActor(actor, { owner: 'doorAway' }),
+      say,
+      showHint,
+      random
+    });
+    doorTransition = new DoorTransitionController({
+      state,
+      occlusion: doorOcclusion,
+      navigateNormal: (actor, target, afterMove, options) => walkActor(actor, target, afterMove, { ...options, owner: 'doorTransition' }),
+      navigateExact: (actor, points, afterMove, options) => walkActorExactRoute(actor, points, afterMove, { ...options, owner: 'doorTransition' }),
+      stopActor: (actor) => stopActor(actor, { owner: 'doorTransition' }),
+      changeScene,
+      onError: (error) => {
+        console.error('[door-transition]', error);
+        showHint('院门切换没有完成，已经退回安全状态。', 3400);
+      }
+    });
+    syncDoorTestUI();
+    return true;
+  } catch (error) {
+    doorAssetState = { ready: false, error, reason: error.message };
+    console.error('[door-subsystem] asset preparation failed', error);
+    syncDoorTestUI();
+    return false;
+  }
 }
 
 function hitZoneForActor(actor, bounds, clientX, clientY) {
+  if (doorAway?.ownsActor(actor)) return 'speech';
   if (actor === naili) return 'actions';
   if (actor.mount?.pose === 'bed-lie') {
     const headIsLeft = (actor.mount.facing || actor.dir || 1) > 0;
@@ -908,6 +1097,7 @@ function handleWorldTap(clientX, clientY) {
   }
 }
 function update(time, delta) {
+  doorAway?.tick(time);
   updateCompanions(time);
   updateActor(player, delta);
   updateActor(hubby, delta);
@@ -920,6 +1110,7 @@ function update(time, delta) {
   const speechEvent = speech.tick(performance.now());
   if (speechEvent) applySpeechEvent(speechEvent);
   positionOverlays();
+  syncDoorTestUI();
 }
 function frame(timestamp) {
   const delta = Math.min(.04, (timestamp - lastTime) / 1000 || .016);
@@ -1034,6 +1225,7 @@ if (globalThis.visualViewport) globalThis.visualViewport.addEventListener('resiz
 if ('ResizeObserver' in globalThis) new globalThis.ResizeObserver(resize).observe($('#nestward'));
 
 async function boot() {
+  void prepareDoorSubsystem();
   try {
     await renderer.preload();
   } catch (error) {
