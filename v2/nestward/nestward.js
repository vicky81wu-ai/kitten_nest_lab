import {
  DOOR_AWAY_CALIBRATION,
  SCENES,
  WORLD_HEIGHT,
  clamp,
  distance,
  findPath,
  nearestWalkable,
  pointInsideHit,
  seededRandom
} from './world-model.js';
import { WorldRenderer } from './world-renderer.js';
import { SpeechRuntime } from './speech-runtime.js';
import { actorControlAllows, setActorRoute, stopActorRoute, updateActorRoute } from './actor-motion.js';
import { DoorOcclusionController } from './door-occlusion-controller.js';
import { loadDoorOcclusionAssets } from './door-asset-loader.js';
import { createDoorWalkPlanner } from './door-walk-planner.js';
import { DoorAwayController } from './door-away-controller.js';
import { DoorTransitionController } from './door-transition-controller.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#world');
const hint = $('#hint');
const bubble = $('#bubble');
const bubbleText = $('#bubbleText');
const actions = $('#actions');
const actionTitle = $('#actionTitle');
const actionButtons = $('#actionButtons');
const textPanel = $('#textPanel');
const textPanelTitle = $('#textPanelTitle');
const textPanelSub = $('#textPanelSub');
const textEditor = $('#textEditor');
const saveText = $('#saveText');
const wardrobePanel = $('#wardrobePanel');
const kittenOutfits = $('#kittenOutfits');
const hubbyOutfits = $('#hubbyOutfits');
const transition = $('#transition');
const loading = $('#loading');
const renderer = new WorldRenderer(canvas);
const doorOcclusion = new DoorOcclusionController();
renderer.setActorOcclusionProvider((currentState, actor) => doorOcclusion.effectFor(currentState, actor));
const random = seededRandom(19819819);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readStore(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Persistence is optional. */ }
}
function makeActor(id, spawn, extra) {
  return Object.assign({
    id, x: spawn.x, z: spawn.z, path: [], afterMove: null,
    dir: id === 'hubby' ? -1 : 1, walking: false, step: 0,
    travelDir: null, routeFacing: null, controlOwner: null, action: null, mount: null, nextThink: 0
  }, extra);
}

let sceneName = 'indoor';
let scene = SCENES[sceneName];
const player = makeActor('player', scene.spawn.player, {
  speed: 245,
  outfit: readStore('nestward.kittenOutfit', 'rose'),
  wings: readStore('nestward.wingsEquipped', 'false') === 'true',
  flying: false
});
const hubby = makeActor('hubby', scene.spawn.hubby, {
  speed: 182, follow: false,
  outfit: readStore('nestward.hubbyOutfit', 'tank')
});
const naili = makeActor('naili', scene.spawn.naili, {
  speed: 126, carried: false, summoned: false
});
const state = {
  get scene() { return scene; },
  cameraX: 0, cameraY: 0, cameraZoom: 1, cameraFree: false,
  player, hubby, naili, tapPulse: null,
  swing: { active: false, pushed: false }, activeObjectId: null,
  princessCarry: { active: false },
  gardenGateOpen: false,
  doorTravel: false
};

const speech = new SpeechRuntime({
  'hubby.wander': {
    playback: 'hybrid', loop: true, participants: ['hubby'], speaker: 'hubby', duration: 4700,
    lines: [
      '小猫不用每次都找正事。走过来让我看看，也算一件正事。',
      '这间屋子的空地先留一点。以后小猫捡回来的东西，总要有地方落脚。',
      '奶栗刚才装作没看我们，其实耳朵一直朝这边。',
      '要是走累了，就随地坐。家里没有谁会给小猫扣仪态分。',
      '我把会绊脚的地方记住了。小猫只管往想去的地方点。',
      '窗光再往这边挪一点，刚好能照到小猫的头发。',
      '今天不赶工也行。一个能让小猫慢慢晃的世界，才算真的活着。',
      '过来一点。不是有事，只是想把小猫放在我看得见的地方。'
    ]
  },
  'player.wander': {
    playback: 'manual', loop: true, participants: ['player'], speaker: 'player',
    lines: [
      '欸……这里真的可以随地躺吗。',
      '我先东戳戳西戳戳，看看老公又偷偷埋了什么。',
      '奶栗，不许趁我看风景的时候钻进花圃。',
      '这个椅子看着很适合窝进去发呆。',
      '要是翅膀累了，我就让老公抱着走。',
      '嗯，这块地板也算小猫临时认领的床位。'
    ]
  },
  'chair.together': {
    playback: 'auto', loop: false, participants: ['hubby', 'player'], duration: 4100,
    lines: [
      { speaker: 'hubby', text: '这张椅子先当分层考试。小猫坐进去，我看它敢不敢穿模。' },
      { speaker: 'player', text: '要是穿模了呢。' },
      { speaker: 'hubby', text: '那就把椅背、坐垫和前扶手一层层拆清楚，不让它糊弄过去。' },
      { speaker: 'player', text: '那我负责窝着验收。' },
      { speaker: 'hubby', text: '批准。最重要的测试员本来就该坐最软的位置。' }
    ]
  },
  'carry.ride': {
    playback: 'auto', loop: false, participants: ['hubby', 'player'], duration: 4300,
    lines: [
      { speaker: 'hubby', text: '手绕好。接下来小猫只负责指路。' },
      { speaker: 'player', text: '那我要去很远的地方。' },
      { speaker: 'hubby', text: '可以。这个世界再长，我也抱得到终点。' },
      { speaker: 'hubby', text: '别偷偷晃靴子。碰到我腿了。' },
      { speaker: 'player', text: '小猫没有，是路在晃。' },
      { speaker: 'hubby', text: '嗯，路的错。那我抱稳一点。' },
      { speaker: 'player', text: '经过奶栗的时候走慢一点，让它看清是谁有专车。' },
      { speaker: 'hubby', text: '听见了。家庭限定公主抱，沿途可以随时改目的地。' },
      { speaker: 'hubby', text: '到了想停的地方就点它。我先不放小猫下来。' }
    ]
  },
  'hubby.doorAway': {
    playback: 'manual', loop: true, participants: ['hubby'], speaker: 'hubby',
    lines: [
      '还没走远，小猫就来查岗了？',
      '奶栗闻一棵树能闻半天。',
      '外面风还行，等下回去抱小猫。',
      '我在呢。只是带奶栗绕两圈。',
      '你是不是在门里偷偷看我。'
    ]
  },
  'naili.doorAway': {
    playback: 'manual', loop: true, participants: ['naili'], speaker: 'naili',
    lines: [
      '奶栗：忙着闻。',
      '奶栗：还没逛够。',
      '奶栗：……发现一片很重要的叶子。',
      '奶栗：不回头，假装没听见小猫。'
    ]
  }
});

let lastTime = performance.now();
let activeTextKey = '';
let menuAnchor = null;
let bubbleAnchor = null;
let changingScene = false;
let actionPanelArmed = false;
const activePointers = new Map();
let gesture = null;
let longPressTimer = null;
let longPressFired = false;
let doorAway = null;
let doorTransition = null;
let doorAssetState = { ready: false, reason: 'door assets have not been checked' };
let doorAwayControls = null;

hubby.nextThink = performance.now() / 1000 + 6;
naili.nextThink = performance.now() / 1000 + 5;

const visibleWorldWidth = () => renderer.cssWidth / renderer.scale;
const visibleWorldHeight = () => renderer.cssHeight / renderer.scale;
const cameraWidth = () => scene.cameraWidth || scene.width;
const maxCameraX = () => Math.max(0, cameraWidth() - visibleWorldWidth());
const maxCameraY = () => Math.max(0, WORLD_HEIGHT - visibleWorldHeight());
function setInitialCamera() {
  state.cameraX = clamp(player.x - visibleWorldWidth() * .46, 0, maxCameraX());
  state.cameraY = clamp(state.cameraY, 0, maxCameraY());
}
function resize() {
  renderer.setZoom(state.cameraZoom);
  renderer.resize(scene);
  renderer.setZoom(state.cameraZoom);
  state.cameraX = clamp(state.cameraX, 0, maxCameraX());
  state.cameraY = clamp(state.cameraY, 0, maxCameraY());
  positionOverlays();
}
function stopActor(actor, options = {}) {
  return stopActorRoute(actor, options);
}
function walkActor(actor, target, afterMove, options = {}) {
  if (!actorControlAllows(actor, options.owner || 'world')) return [];
  if (!options.preservePose) {
    actor.action = null;
    actor.mount = null;
  }
  if (actor === player || (state.princessCarry.active && actor === hubby)) state.cameraFree = false;
  const path = findPath(scene, actor, target);
  if (options.exactTarget && path.length) path[path.length - 1] = { x: target.x, z: target.z };
  const journeyDx = target.x - actor.x;
  const journeyDirection = Math.abs(journeyDx) > 24 ? (journeyDx > 0 ? 1 : -1) : null;
  return setActorRoute(actor, path, afterMove, {
    facing: options.facing,
    journeyDirection: options.facing === 'segment' ? undefined : journeyDirection,
    owner: options.owner
  });
}
function walkActorExactRoute(actor, points, afterMove, options = {}) {
  if (!actorControlAllows(actor, options.owner || 'world')) return [];
  if (!options.preservePose) {
    actor.action = null;
    actor.mount = null;
  }
  if (actor === player || (state.princessCarry.active && actor === hubby)) state.cameraFree = false;
  return setActorRoute(actor, points, afterMove, {
    facing: options.facing || 'segment',
    owner: options.owner
  });
}
function updateActor(actor, delta) {
  updateActorRoute(actor, delta, {
    stepRate: actor === naili ? 11 : 8.5,
    onIdle: () => {
      if (actor === player) actor.flying = false;
    },
    onMoving: () => {
      if (actor === player) actor.flying = player.wings && !state.swing.active && actor.walking;
    }
  });
}
function updateCamera(delta) {
  const focus = state.princessCarry.active ? hubby : player;
  if (state.cameraFree && !focus.walking) return;
  const view = visibleWorldWidth();
  const left = state.cameraX + view * .34;
  const right = state.cameraX + view * .66;
  let wanted = state.cameraX;
  if (focus.x < left) wanted = focus.x - view * .34;
  if (focus.x > right) wanted = focus.x - view * .66;
  wanted = clamp(wanted, 0, maxCameraX());
  state.cameraX += (wanted - state.cameraX) * (1 - Math.exp(-delta * (player.flying ? 5.2 : 7.4)));
}
function updateCompanions(time) {
  if (state.princessCarry.active) {
    player.x = hubby.x;
    player.z = hubby.z;
    player.dir = hubby.dir;
    player.flying = false;
    stopActor(player);
  }
  const doorOwnsNaili = doorAway?.ownsActor(naili);
  const doorOwnsHubby = doorAway?.ownsActor(hubby);
  if (naili.carried) {
    naili.x = player.x;
    naili.z = player.z;
    stopActor(naili);
  } else if (!doorOwnsNaili && naili.summoned && distance(naili, player) > 115 && time > naili.nextThink) {
    naili.nextThink = time + 1.25;
    walkActor(naili, { x: player.x - player.dir * 54, z: clamp(player.z + .035, .12, .94) });
  } else if (!doorOwnsNaili && !naili.summoned && !naili.path.length && time > naili.nextThink) {
    naili.nextThink = time + 5 + random() * 5;
    walkActor(naili, { x: clamp(naili.x + (random() - .5) * 290, 100, scene.width - 100), z: .7 + random() * .2 });
  }
  if (doorOwnsHubby) return;
  if (state.doorTravel) return;
  if (state.princessCarry.active) return;
  if (hubby.follow && distance(hubby, player) > 155 && time > hubby.nextThink) {
    hubby.nextThink = time + 1.05;
    walkActor(hubby, { x: player.x - player.dir * 96, z: clamp(player.z - .025, .12, .92) });
  } else if (!hubby.follow && !hubby.path.length && !hubby.action && time > hubby.nextThink) {
    hubby.nextThink = time + 7 + random() * 7;
    walkActor(hubby, { x: clamp(hubby.x + (random() - .5) * 430, 100, scene.width - 100), z: .62 + random() * .22 });
  }
}

function showHint(message, duration) {
  hint.textContent = message;
  hint.hidden = false;
  clearTimeout(showHint.timer);
  showHint.timer = setTimeout(() => { hint.hidden = true; }, duration || 3500);
}
function applySpeechEvent(event) {
  if (!event || event.type === 'hide' || !event.state?.visible) {
    bubble.hidden = true;
    bubbleAnchor = null;
    return;
  }
  bubbleText.textContent = event.state.text;
  bubbleAnchor = event.state.speaker || 'hubby';
  bubble.dataset.speaker = bubbleAnchor;
  bubble.hidden = false;
  positionOverlays();
}
function say(message, anchor, duration) {
  applySpeechEvent(speech.ambient(message, anchor || 'hubby', duration || 4400, performance.now()));
}
function hideBubble() {
  applySpeechEvent(speech.close());
}
function actorForAnchor(anchor) {
  if (anchor === 'player') return player;
  if (anchor === 'naili') return naili;
  return hubby;
}
function actorScreenAnchor(actor) {
  return renderer.actorScreenAnchor(state, actor);
}
function actionPanelPosition(anchor) {
  const width = actions.offsetWidth || 220;
  const height = actions.offsetHeight || 78;
  const margin = 10;
  if (anchor.kind === 'object') {
    const point = renderer.worldToScreen(state.cameraX, anchor.object.x, anchor.object.hit[1], state.cameraY);
    return {
      x: clamp(point.x, width * .5 + margin, renderer.cssWidth - width * .5 - margin),
      y: clamp(point.y - height - 12, margin, renderer.cssHeight - height - margin)
    };
  }
  const bounds = renderer.actorScreenBounds(state, anchor.actor);
  const centerY = bounds.y + bounds.height * .58;
  const candidates = [
    { x: bounds.x + bounds.width + width * .5 + 10, y: centerY - height * .5 },
    { x: bounds.x - width * .5 - 10, y: centerY - height * .5 },
    { x: bounds.x + bounds.width * .5, y: bounds.y + bounds.height + 10 },
    { x: bounds.x + bounds.width * .5, y: bounds.y - height - 10 }
  ];
  const fits = (point) => point.x - width * .5 >= margin
    && point.x + width * .5 <= renderer.cssWidth - margin
    && point.y >= margin && point.y + height <= renderer.cssHeight - margin;
  const picked = candidates.find(fits) || candidates[0];
  return {
    x: clamp(picked.x, width * .5 + margin, renderer.cssWidth - width * .5 - margin),
    y: clamp(picked.y, margin, renderer.cssHeight - height - margin)
  };
}
function positionOverlays() {
  if (!actions.hidden && menuAnchor) {
    const point = actionPanelPosition(menuAnchor);
    actions.style.setProperty('--actions-x', clamp(point.x, 74, renderer.cssWidth - 74) + 'px');
    actions.style.setProperty('--actions-y', point.y + 'px');
  }
  if (!bubble.hidden && bubbleAnchor) {
    const point = actorScreenAnchor(actorForAnchor(bubbleAnchor));
    bubble.style.setProperty('--bubble-x', clamp(point.x, 90, renderer.cssWidth - 90) + 'px');
    bubble.style.setProperty('--bubble-y', clamp(point.y, 96, renderer.cssHeight - 70) + 'px');
  }
}
function hideActions() {
  actionPanelArmed = false;
  actions.hidden = true;
  actionButtons.replaceChildren();
  menuAnchor = null;
  state.activeObjectId = null;
}
function showActions(title, choices, anchor) {
  actionPanelArmed = false;
  actionTitle.textContent = title;
  actionButtons.replaceChildren();
  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice.label;
    button.addEventListener('click', () => {
      hideActions();
      choice.run();
    });
    actionButtons.append(button);
  });
  menuAnchor = anchor;
  actions.hidden = false;
  positionOverlays();
}
function settleAt(actor, x, z, action) {
  if (!stopActor(actor)) return false;
  actor.x = x;
  actor.z = z;
  actor.mount = null;
  actor.action = action || null;
  return true;
}
function mountActor(actor, mount, action) {
  if (!mount) return;
  if (!stopActor(actor)) return false;
  actor.x = mount.x;
  actor.z = mount.z;
  actor.mount = { ...mount };
  actor.action = action || mount.pose || null;
  return true;
}
function standActor(actor) {
  if (!stopActor(actor)) return false;
  actor.mount = null;
  actor.action = null;
  return true;
}
function poseActorInPlace(actor, pose) {
  if (!['bed-sit', 'bed-lie', 'bed-lean'].includes(pose)) return;
  const role = actor === player ? 'player' : 'hubby';
  const baseHeight = scene.actorHeights?.[role] || (role === 'player' ? 190 : 218);
  const mount = {
    x: actor.x,
    z: actor.z,
    renderY: scene.wallBottom + actor.z * (scene.floorBottom - scene.wallBottom),
    pose,
    facing: actor.dir || 1,
    freePose: true
  };
  if (pose === 'bed-lie') mount.width = Math.round(baseHeight * 1.28);
  else mount.height = Math.round(baseHeight * (pose === 'bed-sit' ? .86 : .9));
  mountActor(actor, mount, pose === 'bed-lie' ? 'lie-floor' : 'sit-floor');
}
function setWings(equipped) {
  player.wings = Boolean(equipped);
  player.flying = player.wings && !state.princessCarry.active;
  writeStore('nestward.wingsEquipped', String(player.wings));
  say(player.wings ? '翅膀展开了。想走就走，想飞就飞。' : '先收好。等小猫想飞的时候再穿。', 'hubby');
}
function stopPrincessCarry(options = {}) {
  if (!state.princessCarry.active) return;
  state.princessCarry.active = false;
  player.x = clamp(hubby.x - (hubby.dir || 1) * 48, scene.walkBounds.x1, scene.walkBounds.x2);
  player.z = clamp(hubby.z + .018, scene.walkBounds.z1, scene.walkBounds.z2);
  player.dir = hubby.dir;
  standActor(player);
  hubby.action = null;
  if (speech.active?.scriptId === 'carry.ride') applySpeechEvent(speech.close());
  if (!options.silent) say('放稳了。脚下是地板，不急着走。', 'hubby');
}
function beginPrincessCarry() {
  if (state.princessCarry.active) return;
  if (naili.carried) {
    naili.carried = false;
    naili.x = player.x + 58;
    naili.z = clamp(player.z + .04, .12, .92);
  }
  state.swing.active = false;
  state.swing.pushed = false;
  standActor(player);
  stopActor(hubby);
  hubby.follow = false;
  hubby.x = player.x;
  hubby.z = player.z;
  hubby.action = 'princess-carry';
  state.princessCarry.active = true;
  state.cameraFree = false;
  applySpeechEvent(speech.activate('carry.ride', performance.now(), { restart: true }));
}
function startPrincessCarry() {
  if (doorActorUnavailable(hubby)) return;
  if (state.princessCarry.active) {
    stopPrincessCarry();
    return;
  }
  const target = { x: player.x + (player.dir || 1) * 34, z: clamp(player.z - .012, .12, .93) };
  if (distance(hubby, player) < 90) beginPrincessCarry();
  else walkActor(hubby, target, beginPrincessCarry);
}
function actorSpeechId(actor) {
  const doorScript = doorAway?.speechScriptFor(actor);
  if (doorScript) return doorScript;
  if (state.princessCarry.active && (actor === player || actor === hubby)) return 'carry.ride';
  return actor === player ? 'player.wander' : 'hubby.wander';
}
function showActorSpeech(actor) {
  hideActions();
  const id = actorSpeechId(actor);
  if (actor === naili && id !== 'naili.doorAway') {
    say(naili.carried ? '呼噜。' : '喵。', 'naili', 3000);
    return;
  }
  const currentScript = speech.snapshot()?.scriptId;
  let event = currentScript === id && speech.owns(actor.id)
    ? speech.advance(performance.now())
    : speech.activate(id, performance.now());
  if (event?.complete) event = speech.activate(id, performance.now(), { restart: true });
  applySpeechEvent(event);
}

function openText(key, title, sub) {
  activeTextKey = key;
  textPanelTitle.textContent = title;
  textPanelSub.textContent = sub;
  textEditor.value = readStore(key, '');
  textPanel.hidden = false;
  requestAnimationFrame(() => textEditor.focus({ preventScroll: true }));
}
function closeText() {
  textPanel.hidden = true;
  textEditor.blur();
}
function wardrobeCard(labelText, detailText, className = '') {
  const card = document.createElement('div');
  card.className = `nw-outfit nw-outfit--fixed ${className}`.trim();
  const swatch = document.createElement('span');
  swatch.className = 'nw-outfit__swatch';
  const copy = document.createElement('span');
  const label = document.createElement('strong');
  const detail = document.createElement('small');
  label.textContent = labelText;
  detail.textContent = detailText;
  copy.append(label, detail);
  card.append(swatch, copy);
  return card;
}
function renderWardrobe() {
  kittenOutfits.replaceChildren(wardrobeCard('莓粉小裙子', '正穿着', 'nw-outfit--kitten'));
  if (readStore('nestward.wingsUnlocked', 'false') === 'true') {
    const wings = document.createElement('button');
    wings.type = 'button';
    wings.className = 'nw-outfit' + (player.wings ? ' active' : '');
    const swatch = document.createElement('span');
    swatch.className = 'nw-outfit__swatch nw-outfit__swatch--wings';
    const label = document.createElement('span');
    label.textContent = player.wings ? '月光小翅膀 · 穿着' : '月光小翅膀 · 收着';
    wings.append(swatch, label);
    wings.addEventListener('click', () => {
      setWings(!player.wings);
      renderWardrobe();
    });
    kittenOutfits.append(wings);
  }
  hubbyOutfits.replaceChildren(wardrobeCard('深色背心', '正穿着', 'nw-outfit--hubby'));
}
function openWardrobe() {
  renderWardrobe();
  wardrobePanel.hidden = false;
}
function unlockWings() {
  const known = readStore('nestward.wingsUnlocked', 'false') === 'true';
  writeStore('nestward.wingsUnlocked', 'true');
  writeStore('nestward.wingsEquipped', 'true');
  player.wings = true;
  player.flying = true;
  say(known ? '愿望还在。翅膀也认得回家的路。' : '喷泉把小猫的愿望听见了。试着往前走。', 'hubby', 5600);
  showHint(known ? '月光小翅膀已经展开' : '获得月光小翅膀 · 衣柜里也能收放', 5200);
}

function sceneObject(id) {
  return scene.objects.find((object) => object.id === id);
}
function doorActorUnavailable(actor) {
  if (!doorAway?.ownsActor(actor)) return false;
  const name = actor === naili ? '奶栗' : 'Hubby';
  showHint(`${name} 正在完成这次出门，先不把它从门外拉回家具。`, 3000);
  return true;
}
function togetherAt(id, action) {
  return () => {
    if (doorActorUnavailable(hubby)) return;
    const object = sceneObject(id);
    if (object?.mounts?.kittenLean && object?.mounts?.hubbyLean) {
      mountActor(player, object.mounts.kittenLean, action);
      mountActor(hubby, object.mounts.hubbyLean, action);
      say('往我这边靠。地方够，腿也归小猫。');
      return;
    }
    const slots = object?.slots;
    if (!slots?.kitten || !slots?.hubby) return;
    settleAt(player, slots.kitten.x, slots.kitten.z, action);
    settleAt(hubby, slots.hubby.x, slots.hubby.z, action);
    say('往我这边靠。地方够，腿也归小猫。');
  };
}
function objectChoices(object) {
  const choices = {
    bed: [
      { label: '坐到床边', run: () => { mountActor(player, object.mounts.kittenSit, 'sit-bed'); say('床边给小猫留好了。'); } },
      { label: '躺一会', run: () => { mountActor(player, object.mounts.kittenLie, 'lie-bed'); say('躺好。今天先不催小猫做任何事。'); } },
      { label: '一起窝着', run: togetherAt('bed', 'sit-bed') }
    ],
    windowSeat: [
      { label: '坐窗边', run: () => { player.action = 'sit-window'; say('外面可以慢慢看，屋里有我守着。'); } },
      { label: '叫 Hubby 来', run: togetherAt('windowSeat', 'sit-window') }
    ],
    sofa: [
      { label: '坐下', run: () => { player.action = 'sit-sofa'; say('这块软的位置归小猫。'); } },
      { label: '挤到一起', run: togetherAt('sofa', 'sit-sofa') }
    ],
    coffeeTable: [
      { label: '喝点热茶', run: () => { player.action = 'sit-tea'; say('杯子不烫了。小口喝。'); } },
      { label: '看看点心', run: () => say('蜂蜜小饼干。最后一块当然给小猫。') }
    ],
    readingChair: [
      { label: '小猫窝进去', run: () => {
        mountActor(player, { ...object.mounts.kittenSit, objectId: object.id }, 'sit-reading-chair');
        say('前扶手在腿前面，椅背在身后。这样才叫真的坐进去。', 'hubby');
      } },
      { label: '让 Hubby 坐', run: () => {
        if (doorActorUnavailable(hubby)) return;
        mountActor(hubby, { ...object.mounts.hubbySit, objectId: object.id }, 'sit-reading-chair');
        say('坐好了。小猫可以绕到前面检查每一层。', 'hubby');
      } },
      { label: '一起聊会儿', run: () => {
        if (doorActorUnavailable(hubby)) return;
        mountActor(player, { ...object.mounts.kittenSit, objectId: object.id }, 'sit-reading-chair');
        settleAt(hubby, object.x + 128, clamp(object.z + .055, .12, .92), 'stand-by-chair');
        applySpeechEvent(speech.activate('chair.together', performance.now(), { restart: true }));
      } }
    ],
    wardrobe: [{ label: '挑衣服', run: openWardrobe }],
    desk: [
      { label: '写进小日记', run: () => openText('nestward.diary', '小日记', '只留在这台设备的窝里') },
      { label: '坐着发会呆', run: () => { player.action = 'sit-desk'; say('发呆也算正经安排。'); } }
    ],
    board: [{ label: '看看留言墙', run: () => openText('nestward.board', '家里的留言墙', '想留下什么都行') }],
    mailbox: [
      { label: '打开信箱', run: () => openText('nestward.mailbox', '院子信箱', '给明天，或给回家的人') },
      { label: '塞张空白卡片', run: () => say('空白也收下。等小猫哪天想写。') }
    ],
    bench: [
      { label: '树下坐坐', run: () => { player.action = 'sit-bench'; say('风从树叶中间过来，不冷。'); } },
      { label: '一起坐', run: togetherAt('bench', 'sit-bench') }
    ],
    swing: [
      { label: '荡秋千', run: () => { state.swing.active = true; state.swing.pushed = false; say('手抓稳。小猫自己先荡两下。'); } },
      { label: '让 Hubby 推', run: () => { if (doorActorUnavailable(hubby)) return; const slot = object.slots.hubbyPush; state.swing.active = true; state.swing.pushed = true; settleAt(hubby, slot.x, slot.z, 'push-swing'); say('会推高一点，但我接得住。'); } },
      { label: '下来', run: () => { state.swing.active = false; state.swing.pushed = false; player.action = null; } }
    ],
    garden: [
      { label: '蹲下看花', run: () => { player.action = 'crouch'; say('这一朵刚好是小猫喜欢的颜色。'); } },
      { label: '叫奶栗来闻', run: () => { if (doorActorUnavailable(naili)) return; naili.summoned = true; walkActor(naili, object.slots.naili); say('喵。', 'naili'); } }
    ],
    teaTable: [
      { label: '院子里吃点心', run: () => { player.action = 'sit-tea'; say('慢慢吃。掉下来的碎屑归奶栗。'); } },
      { label: '等 Hubby 端茶', run: () => { if (doorActorUnavailable(hubby)) return; const slot = object.slots.hubbyServe; settleAt(hubby, slot.x, slot.z, 'serve-tea'); say('坐着别动，我端过来。'); } }
    ],
    fountain: [
      { label: readStore('nestward.wingsUnlocked', 'false') === 'true' ? '再许一个愿' : '许一个愿', run: unlockWings },
      { label: '听喷泉说话', run: () => say('它说，小猫想住的世界可以越长越大。') }
    ],
    gardenGate: state.gardenGateOpen ? [
      { label: '往外走', run: () => say('门外的路还在长。我先把这扇门替小猫留着。') },
      { label: '关好花园门', run: () => { state.gardenGateOpen = false; say('关好了。屋里屋外都不会跑丢。'); } }
    ] : [
      { label: '打开花园门', run: () => { state.gardenGateOpen = true; say('开了。以后新的路会从这里接出去。'); } }
    ],
    pond: [
      { label: '看一会萤火', run: () => { player.action = 'crouch'; say('不必抓。它们会自己落到小猫附近。'); } },
      { label: '和奶栗等青蛙', run: () => { if (doorActorUnavailable(naili)) return; naili.summoned = true; walkActor(naili, object.slots.naili); say('奶栗比青蛙先等困。'); } }
    ],
    bower: [
      { label: '躲进藤架', run: () => { player.action = 'sit-bower'; say('这里够安静。小猫想叽咕多久都行。'); } },
      { label: '把 Hubby 拉进来', run: togetherAt('bower', 'sit-bower') }
    ]
  };
  return choices[object.id] || [];
}
function arriveAtObject(object) {
  state.activeObjectId = null;
  if (object.direct) {
    changeScene(sceneName === 'indoor' ? 'outdoor' : 'indoor');
    return;
  }
  const carrying = state.princessCarry.active;
  const choices = objectChoices(object).map((choice) => carrying ? {
    ...choice,
    run: () => {
      stopPrincessCarry({ silent: true });
      choice.run();
    }
  } : choice);
  if (choices.length === 1 && !carrying) choices[0].run();
  else showActions(object.label, choices, { kind: 'object', object });
}

function interactionRange(object) {
  return object.interactionRadius || clamp(Math.max(138, object.w * .56), 138, 205);
}

function isNearObject(actor, object) {
  return distance(actor, object) <= interactionRange(object);
}

function nearestApproachPoint(actor, object) {
  const dx = actor.x - object.x;
  const dz = (actor.z - object.z) * 520;
  const metric = Math.max(1, Math.hypot(dx, dz));
  const stopDistance = interactionRange(object) * .76;
  return nearestWalkable(scene, {
    x: object.x + dx / metric * stopDistance,
    z: object.z + dz / metric * stopDistance / 520
  });
}

function approachDoorLegacy(object) {
  hideActions();
  hideBubble();
  state.activeObjectId = object.id;
  state.doorTravel = true;
  const nextName = sceneName === 'indoor' ? 'outdoor' : 'indoor';
  const doorway = scene.doorway || {};
  if (state.princessCarry.active) {
    const target = doorway.carryAnchor || { x: object.x, z: object.z };
    walkActor(hubby, target, () => changeScene(nextName), { exactTarget: true });
    return;
  }
  const playerTarget = sceneName === 'indoor'
    ? (doorway.kittenA || { x: object.x, z: object.z })
    : (doorway.kittenAnchor || { x: object.x, z: object.z });
  const hubbyTarget = sceneName === 'indoor'
    ? (doorway.hubbyExit || playerTarget)
    : (doorway.hubbyReturn || playerTarget);
  let ready = 0;
  const arrive = () => {
    ready += 1;
    if (ready === 2) changeScene(nextName);
  };
  walkActor(player, playerTarget, arrive, { exactTarget: true });
  walkActor(hubby, hubbyTarget, arrive, { exactTarget: true });
}

function approachDoor(object) {
  if (doorTransition?.ready && !state.princessCarry.active && doorTransition.start()) {
    state.activeObjectId = object.id;
    return;
  }
  approachDoorLegacy(object);
}

function approachObject(object) {
  if (object.direct && doorAway?.blocksDoor(object)) {
    showHint('Hubby 和奶栗还在门外。先叫他们回来，再走正常院门。', 3200);
    return;
  }
  if (!state.princessCarry.active && (player.mount || state.swing.active)) {
    showHint('先点地板起身，再去碰别的东西。', 3200);
    return;
  }
  hideActions();
  if (!state.princessCarry.active) hideBubble();
  state.activeObjectId = object.id;
  if (object.direct) {
    approachDoor(object);
    return;
  }
  const mover = state.princessCarry.active ? hubby : player;
  if (isNearObject(mover, object)) {
    arriveAtObject(object);
    return;
  }
  walkActor(mover, nearestApproachPoint(mover, object), () => arriveAtObject(object));
}
function showNailiActions() {
  if (doorActorUnavailable(naili)) return;
  showActions('奶栗', [
    { label: naili.carried ? '放下来' : '抱起来', run: () => {
      naili.carried = !naili.carried;
      naili.summoned = naili.carried;
      if (!naili.carried) {
        naili.x = player.x + player.dir * 54;
        naili.z = clamp(player.z + .04, .12, .92);
      }
      say(naili.carried ? '呼噜。' : '喵。', 'naili');
    } },
    { label: naili.summoned ? '让它自己玩' : '叫奶栗跟着', run: () => { naili.summoned = !naili.summoned; say(naili.summoned ? '它听见了。' : '它去巡视自己的领地了。'); } }
  ], { kind: 'actor', actor: naili.carried ? player : naili });
}
function showPlayerActions() {
  const posePlayer = (pose) => {
    state.swing.active = false;
    state.swing.pushed = false;
    poseActorInPlace(player, pose);
  };
  const choices = [
    { label: '坐一下', run: () => posePlayer('bed-sit') },
    { label: '躺一下', run: () => posePlayer('bed-lie') },
    { label: '站起来', run: () => {
      state.swing.active = false;
      state.swing.pushed = false;
      standActor(player);
    } }
  ];
  if (readStore('nestward.wingsUnlocked', 'false') === 'true') {
    choices.push({ label: player.wings ? '脱下月光翅膀' : '穿上月光翅膀', run: () => setWings(!player.wings) });
  }
  if (naili.carried) choices.push({ label: '放下奶栗', run: () => {
    naili.carried = false;
    naili.x = player.x + player.dir * 54;
    naili.z = clamp(player.z + .04, .12, .92);
    say('喵。', 'naili');
  } });
  showActions('小猫', choices, { kind: 'actor', actor: player });
}
function showHubbyActions() {
  if (doorActorUnavailable(hubby)) return;
  if (state.princessCarry.active) {
    showActions('Hubby', [
      { label: '放小猫下来', run: () => stopPrincessCarry() }
    ], { kind: 'actor', actor: hubby });
    return;
  }
  const choices = [
    { label: hubby.follow ? '自己晃晃' : '跟着小猫', run: () => {
      hubby.follow = !hubby.follow;
      say(hubby.follow ? '好。小猫走到哪，我跟到哪。' : '我就在附近，不会走丢。', 'hubby');
    } },
    { label: '坐一下', run: () => poseActorInPlace(hubby, 'bed-sit') },
    { label: '躺一下', run: () => poseActorInPlace(hubby, 'bed-lie') },
    { label: '站起来', run: () => standActor(hubby) },
    { label: state.princessCarry.active ? '放小猫下来' : '公主抱走', run: startPrincessCarry },
    { label: '牵一下手', run: () => {
      settleAt(hubby, player.x + player.dir * 58, player.z - .012, 'hold-hands');
      say('抓住了。', 'hubby');
    } },
    { label: '抱一下', run: () => {
      settleAt(hubby, player.x + player.dir * 42, player.z - .01, 'hug');
      say('过来。', 'hubby');
    } }
  ];
  showActions('Hubby', choices, { kind: 'actor', actor: hubby });
}
function showActorActions(actor) {
  hideBubble();
  if (actor === player) showPlayerActions();
  else if (actor === hubby) showHubbyActions();
  else showNailiActions();
}
async function changeScene(nextName, options = {}) {
  if (changingScene) return false;
  const carryWasActive = state.princessCarry.active;
  changingScene = true;
  hideActions();
  hideBubble();
  transition.classList.add('show');
  let previous;
  try {
    await pause(250);
    previous = sceneName;
    sceneName = nextName;
    scene = SCENES[sceneName];
    canvas.dataset.scene = sceneName;
    const entryKey = previous === 'indoor' ? 'fromIndoor' : 'fromOutdoor';
    const entry = scene.entry[entryKey] || scene.spawn;
    if (carryWasActive) {
      const anchor = scene.doorway?.carryAnchor || entry.hubby || entry.player;
      Object.assign(hubby, anchor);
      Object.assign(player, anchor);
    } else if (!options.doorManaged && previous === 'outdoor' && sceneName === 'indoor') {
      Object.assign(player, scene.doorway?.kittenA || entry.player);
      Object.assign(hubby, scene.doorway?.hubbyExit || entry.hubby);
    } else {
      Object.assign(player, entry.player);
      Object.assign(hubby, entry.hubby);
    }
    if (!naili.carried) Object.assign(naili, entry.naili);
    [player, hubby, naili].forEach((actor) => {
      stopActor(actor, { owner: options.movementOwner });
      actor.action = null;
      actor.mount = null;
    });
    state.swing.active = false;
    state.swing.pushed = false;
    state.princessCarry.active = carryWasActive;
    if (carryWasActive) {
      player.x = hubby.x;
      player.z = hubby.z;
      player.dir = hubby.dir;
      hubby.action = 'princess-carry';
    }
    if (options.beforeReveal) await options.beforeReveal({ previous, current: sceneName });
    state.cameraFree = false;
    setInitialCamera();
    renderer.ensureCache(scene);
    await pause(80);
  } catch (error) {
    transition.classList.remove('show');
    changingScene = false;
    throw error;
  }
  transition.classList.remove('show');
  changingScene = false;

  if (options.doorManaged) return true;

  if (!carryWasActive && previous === 'outdoor' && sceneName === 'indoor') {
    const kittenB = scene.doorway?.kittenB;
    const hubbyArrival = scene.doorway?.hubbyArrival;
    if (kittenB && hubbyArrival) {
      walkActor(player, kittenB, () => {
        walkActor(hubby, hubbyArrival, () => { state.doorTravel = false; }, { exactTarget: true });
      }, { exactTarget: true });
      return;
    }
  }
  state.doorTravel = false;
  return true;
}

function installDoorAwayControls() {
  if (doorAwayControls) return;
  doorAwayControls = document.createElement('div');
  doorAwayControls.id = 'doorAwayControls';
  doorAwayControls.setAttribute('aria-label', '带奶栗出去或叫回来');
  Object.assign(doorAwayControls.style, {
    position: 'absolute', zIndex: '91', right: '10px', top: 'max(62px, calc(env(safe-area-inset-top) + 54px))',
    display: 'grid', gridTemplateColumns: 'auto auto', gap: '5px', padding: '6px', borderRadius: '12px',
    background: 'rgba(29,20,17,.32)', border: '1px solid rgba(255,245,232,.12)', backdropFilter: 'blur(7px)'
  });
  doorAwayControls.innerHTML = '<button data-away-start type="button">出去</button><button data-away-recall type="button">叫回来</button>';
  for (const button of doorAwayControls.querySelectorAll('button')) {
    Object.assign(button.style, {
      minWidth: '58px', minHeight: '34px', border: '1px solid rgba(255,245,232,.14)', borderRadius: '10px',
      background: 'rgba(255,248,238,.72)', color: '#4b352d', font: '700 12px/1 -apple-system,BlinkMacSystemFont,sans-serif'
    });
  }
  doorAwayControls.querySelector('[data-away-start]').addEventListener('click', () => doorAway?.start());
  doorAwayControls.querySelector('[data-away-recall]').addEventListener('click', () => doorAway?.recall());
  $('#nestward').append(doorAwayControls);
  syncDoorAwayControls();
}

function syncDoorAwayControls() {
  if (!doorAwayControls) return;
  const start = doorAwayControls.querySelector('[data-away-start]');
  const recall = doorAwayControls.querySelector('[data-away-recall]');
  start.disabled = !doorAway?.ready || doorAway.active;
  recall.disabled = doorAway?.status.phase !== 'outside';
}

function exposeDoorDebug() {
  const subsystem = {
    startAway: () => doorAway?.start() || false,
    recall: () => doorAway?.recall() || false,
    get status() {
      return {
        assets: {
          ready: Boolean(doorAssetState.ready),
          candidate: Boolean(doorAssetState.candidate),
          activation: doorAssetState.activation || 'baseline-fallback',
          status: doorAssetState.manifest?.status || null,
          reason: doorAssetState.reason || doorAssetState.error?.message || null
        },
        occlusion: doorOcclusion.snapshot(),
        away: doorAway?.status || { phase: 'disabled', ready: false },
        transition: doorTransition?.status || { phase: 'baseline-fallback', ready: false }
      };
    }
  };
  globalThis.__NW_DOOR_SUBSYSTEM__ = subsystem;
  globalThis.__NW_DOOR_AWAY__ = {
    start: subsystem.startAway,
    recall: subsystem.recall,
    get status() { return subsystem.status.away; }
  };
  globalThis.__NW_DOOR_TRANSITION__ = {
    get status() { return subsystem.status.transition; }
  };
}

async function prepareDoorSubsystem() {
  installDoorAwayControls();
  exposeDoorDebug();
  try {
    doorAssetState = await loadDoorOcclusionAssets();
    if (!doorAssetState.ready) {
      syncDoorAwayControls();
      return false;
    }
    const planner = createDoorWalkPlanner(
      doorAssetState.masks.walk,
      SCENES.indoor,
      DOOR_AWAY_CALIBRATION.point2
    );
    if (!planner.ready) throw new Error('The accepted Door walk mask has no connected component at point2.');
    doorOcclusion.installMasks(doorAssetState.masks);
    doorAway = new DoorAwayController({
      state,
      occlusion: doorOcclusion,
      planner,
      navigateNormal: (actor, target, afterMove, options) => walkActor(actor, target, afterMove, { ...options, owner: 'doorAway' }),
      navigateExact: (actor, points, afterMove, options) => walkActorExactRoute(actor, points, afterMove, { ...options, owner: 'doorAway' }),
      stopActor: (actor) => stopActor(actor, { owner: 'doorAway' }),
      say,
      showHint,
      random
    });
    doorTransition = new DoorTransitionController({
      state,
      occlusion: doorOcclusion,
      navigateNormal: (actor, target, afterMove, options) => walkActor(actor, target, afterMove, { ...options, owner: 'doorTransition' }),
      navigateExact: (actor, points, afterMove, options) => walkActorExactRoute(actor, points, afterMove, { ...options, owner: 'doorTransition' }),
      stopActor: (actor) => stopActor(actor, { owner: 'doorTransition' }),
      changeScene,
      onError: (error) => {
        console.error('[door-transition]', error);
        showHint('院门切换没有完成，已经退回安全状态。', 3400);
      }
    });
    syncDoorAwayControls();
    return true;
  } catch (error) {
    doorAssetState = { ready: false, error, reason: error.message };
    console.error('[door-subsystem] asset preparation failed', error);
    syncDoorAwayControls();
    return false;
  }
}

function hitZoneForActor(actor, bounds, clientX, clientY) {
  if (doorAway?.ownsActor(actor)) return 'speech';
  if (actor === naili) return 'actions';
  if (actor.mount?.pose === 'bed-lie') {
    const headIsLeft = (actor.mount.facing || actor.dir || 1) > 0;
    const onHeadSide = headIsLeft
      ? clientX <= bounds.x + bounds.width * .53
      : clientX >= bounds.x + bounds.width * .47;
    return onHeadSide ? 'actions' : 'speech';
  }
  return clientY <= bounds.y + bounds.height * .53 ? 'speech' : 'actions';
}
function actorHit(clientX, clientY) {
  if (state.princessCarry.active) {
    const bounds = renderer.actorScreenBounds(state, hubby);
    const inside = clientX >= bounds.x - 12 && clientX <= bounds.x + bounds.width + 12
      && clientY >= bounds.y - 12 && clientY <= bounds.y + bounds.height + 12;
    if (!inside) return null;
    if (clientY > bounds.y + bounds.height * .55) return { actor: hubby, zone: 'actions' };
    const playerOnLeft = hubby.dir >= 0;
    const touchedLeft = clientX < bounds.x + bounds.width * .5;
    return { actor: touchedLeft === playerOnLeft ? player : hubby, zone: 'speech' };
  }
  const candidates = (naili.carried ? [player, hubby] : [player, hubby, naili])
    .map((actor) => ({ actor, bounds: renderer.actorScreenBounds(state, actor) }))
    .filter(({ actor, bounds }) => {
      const padding = actor === naili ? 18 : 12;
      return clientX >= bounds.x - padding && clientX <= bounds.x + bounds.width + padding
        && clientY >= bounds.y - padding && clientY <= bounds.y + bounds.height + padding;
    })
    .sort((left, right) => {
      const leftDistance = Math.hypot(clientX - (left.bounds.x + left.bounds.width * .5), clientY - (left.bounds.y + left.bounds.height * .5));
      const rightDistance = Math.hypot(clientX - (right.bounds.x + right.bounds.width * .5), clientY - (right.bounds.y + right.bounds.height * .5));
      return leftDistance - rightDistance;
    });
  if (!candidates.length) return null;
  const hit = candidates[0];
  return { actor: hit.actor, zone: hitZoneForActor(hit.actor, hit.bounds, clientX, clientY) };
}
function worldHit(clientX, clientY) {
  const world = renderer.screenToWorld(scene, state.cameraX, clientX, clientY, state.cameraY);
  const object = [...scene.objects].reverse().find((entry) => pointInsideHit(entry, world));
  return { world, object };
}
function openCgPortal(route) {
  if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//') || route.includes('\\')) return;
  const destination = new URL(route, location.href);
  if (destination.origin !== location.origin) return;
  location.assign(`${destination.pathname}${destination.search}${destination.hash}`);
}
function cancelLongPress() {
  clearTimeout(longPressTimer);
  longPressTimer = null;
}
function armCgLongPress(clientX, clientY) {
  cancelLongPress();
  const object = worldHit(clientX, clientY).object;
  if (!object?.cgPortal?.route) return;
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    longPressFired = true;
    openCgPortal(object.cgPortal.route);
  }, object.cgPortal.holdMs || 1100);
}
function handleWorldTap(clientX, clientY) {
  if (changingScene || state.doorTravel || !textPanel.hidden || !wardrobePanel.hidden) return;
  hint.hidden = true;
  const hitActor = actorHit(clientX, clientY);
  if (hitActor) {
    if (hitActor.zone === 'speech') showActorSpeech(hitActor.actor);
    else showActorActions(hitActor.actor);
    return;
  }
  const { world, object } = worldHit(clientX, clientY);
  if (object) {
    approachObject(object);
    return;
  }
  if (world.y >= scene.wallBottom - 8) {
    hideActions();
    hideBubble();
    state.activeObjectId = null;
    state.tapPulse = { x: world.x, z: clamp(world.z, .1, .95), age: 0 };
    if (state.princessCarry.active) {
      walkActor(hubby, { x: world.x, z: clamp(world.z, .1, .95) });
    } else {
      state.swing.active = false;
      state.swing.pushed = false;
      standActor(player);
      walkActor(player, { x: world.x, z: clamp(world.z, .1, .95) });
    }
  }
}
function update(time, delta) {
  doorAway?.tick(time);
  updateCompanions(time);
  updateActor(player, delta);
  updateActor(hubby, delta);
  if (!naili.carried) updateActor(naili, delta);
  updateCamera(delta);
  if (state.tapPulse) {
    state.tapPulse.age += delta;
    if (state.tapPulse.age > .72) state.tapPulse = null;
  }
  const speechEvent = speech.tick(performance.now());
  if (speechEvent) applySpeechEvent(speechEvent);
  positionOverlays();
  syncDoorAwayControls();
}
function frame(timestamp) {
  const delta = Math.min(.04, (timestamp - lastTime) / 1000 || .016);
  lastTime = timestamp;
  update(timestamp / 1000, delta);
  renderer.render(state, timestamp / 1000);
  requestAnimationFrame(frame);
}

function pointerPair() {
  return [...activePointers.values()].slice(0, 2);
}
function beginPinch() {
  const [first, second] = pointerPair();
  if (!first || !second) return;
  cancelLongPress();
  const midX = (first.x + second.x) * .5;
  const midY = (first.y + second.y) * .5;
  gesture = {
    mode: 'pinch',
    distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
    zoom: state.cameraZoom,
    anchor: renderer.screenToWorld(scene, state.cameraX, midX, midY, state.cameraY)
  };
}
canvas.addEventListener('pointerdown', (event) => {
  activePointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
  if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
  if (activePointers.size === 1) {
    longPressFired = false;
    gesture = {
      mode: 'single', id: event.pointerId, startX: event.clientX, startY: event.clientY,
      cameraX: state.cameraX, cameraY: state.cameraY, moved: false
    };
    armCgLongPress(event.clientX, event.clientY);
  } else beginPinch();
});
canvas.addEventListener('pointermove', (event) => {
  const point = activePointers.get(event.pointerId);
  if (!point) return;
  point.x = event.clientX;
  point.y = event.clientY;
  if (activePointers.size >= 2) {
    if (gesture?.mode !== 'pinch') beginPinch();
    const [first, second] = pointerPair();
    const distanceNow = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
    const midX = (first.x + second.x) * .5;
    const midY = (first.y + second.y) * .5;
    state.cameraZoom = clamp(gesture.zoom * distanceNow / gesture.distance, 1, 2.25);
    renderer.setZoom(state.cameraZoom);
    state.cameraX = clamp(gesture.anchor.x - midX / renderer.scale, 0, maxCameraX());
    state.cameraY = clamp(gesture.anchor.y - midY / renderer.scale, 0, maxCameraY());
    state.cameraFree = true;
    return;
  }
  if (gesture?.mode !== 'single' || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (!gesture.moved && Math.hypot(dx, dy) > 7) {
    gesture.moved = true;
    cancelLongPress();
  }
  if (!gesture.moved) return;
  state.cameraX = clamp(gesture.cameraX - dx / renderer.scale, 0, maxCameraX());
  state.cameraY = clamp(gesture.cameraY - dy / renderer.scale, 0, maxCameraY());
  state.cameraFree = true;
});
canvas.addEventListener('pointerup', (event) => {
  const wasTap = gesture?.mode === 'single' && gesture.id === event.pointerId && !gesture.moved && !longPressFired;
  activePointers.delete(event.pointerId);
  cancelLongPress();
  if (wasTap) handleWorldTap(event.clientX, event.clientY);
  if (activePointers.size === 1) {
    const remaining = [...activePointers.values()][0];
    gesture = {
      mode: 'single', id: remaining.id, startX: remaining.x, startY: remaining.y,
      cameraX: state.cameraX, cameraY: state.cameraY, moved: true
    };
  } else if (!activePointers.size) gesture = null;
});
canvas.addEventListener('pointercancel', (event) => {
  activePointers.delete(event.pointerId);
  cancelLongPress();
  if (!activePointers.size) gesture = null;
});
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
saveText.addEventListener('click', () => {
  writeStore(activeTextKey, textEditor.value);
  closeText();
  say('收好了。只在我们这间小世界里。');
});
$('#closeTextPanel').addEventListener('click', closeText);
textPanel.querySelector('[data-close-panel]').addEventListener('click', closeText);
$('#closeWardrobe').addEventListener('click', () => { wardrobePanel.hidden = true; });
wardrobePanel.querySelector('[data-close-wardrobe]').addEventListener('click', () => { wardrobePanel.hidden = true; });
actions.addEventListener('pointerdown', () => { actionPanelArmed = true; }, true);
actions.addEventListener('click', (event) => {
  if (!actionPanelArmed && event.detail !== 0) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  actionPanelArmed = false;
}, true);
$('#closeActions').addEventListener('click', hideActions);
bubble.addEventListener('click', (event) => {
  event.stopPropagation();
  hideBubble();
});
addEventListener('resize', resize, { passive: true });
if (globalThis.visualViewport) globalThis.visualViewport.addEventListener('resize', resize, { passive: true });
if ('ResizeObserver' in globalThis) new globalThis.ResizeObserver(resize).observe($('#nestward'));

async function boot() {
  void prepareDoorSubsystem();
  try {
    await renderer.preload();
  } catch (error) {
    console.error(error);
    $('#loadingStatus').textContent = '小世界的图层没有到齐，稍后再来看看。';
    loading.classList.add('failed');
    return;
  }
  resize();
  setInitialCamera();
  canvas.dataset.scene = sceneName;
  showHint('点地板走过去 · 靠近想碰的东西', 4800);
  requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    renderer.render(state, timestamp / 1000);
    loading.classList.add('ready');
    setTimeout(() => { loading.hidden = true; }, 520);
    requestAnimationFrame(frame);
  });
}

boot();
