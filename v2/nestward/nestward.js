import { SCENES, clamp, distance, findPath, groundY, pointInsideHit, seededRandom } from './world-model.js';
import { WorldRenderer } from './world-renderer.js';

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
    action: null, nextThink: 0
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
  cameraX: 0, player, hubby, naili, tapPulse: null,
  swing: { active: false, pushed: false }, activeObjectId: null
};

let lastTime = performance.now();
let activeTextKey = '';
let menuAnchor = null;
let bubbleAnchor = null;
let bubbleUntil = 0;
let changingScene = false;
let pointerStart = null;

hubby.nextThink = performance.now() / 1000 + 6;
naili.nextThink = performance.now() / 1000 + 5;

const visibleWorldWidth = () => renderer.cssWidth / renderer.scale;
const cameraWidth = () => scene.cameraWidth || scene.width;
function setInitialCamera() {
  state.cameraX = clamp(player.x - visibleWorldWidth() * .46, 0, Math.max(0, cameraWidth() - visibleWorldWidth()));
}
function resize() {
  renderer.resize(scene);
  state.cameraX = clamp(state.cameraX, 0, Math.max(0, cameraWidth() - visibleWorldWidth()));
  positionOverlays();
}
function stopActor(actor) {
  actor.path.length = 0;
  actor.walking = false;
  actor.afterMove = null;
}
function walkActor(actor, target, afterMove) {
  actor.action = null;
  actor.path = findPath(scene, actor, target);
  actor.afterMove = afterMove || null;
  if (!actor.path.length && afterMove) {
    actor.afterMove = null;
    afterMove();
  }
}
function updateActor(actor, delta) {
  if (!actor.path.length) {
    actor.walking = false;
    if (actor === player) actor.flying = false;
    return;
  }
  const target = actor.path[0];
  const dx = target.x - actor.x;
  const dz = (target.z - actor.z) * 520;
  const metric = Math.hypot(dx, dz);
  const step = actor.speed * delta;
  actor.walking = true;
  actor.step += delta * (actor === naili ? 11 : 8.5);
  if (Math.abs(dx) > 2) actor.dir = dx > 0 ? 1 : -1;
  if (metric <= step + 1) {
    actor.x = target.x;
    actor.z = target.z;
    actor.path.shift();
    if (!actor.path.length) {
      actor.walking = false;
      const callback = actor.afterMove;
      actor.afterMove = null;
      if (callback) callback();
    }
    return;
  }
  actor.x += dx / metric * step;
  actor.z += dz / metric * step / 520;
  if (actor === player) actor.flying = player.wings && !state.swing.active;
}
function updateCamera(delta) {
  const view = visibleWorldWidth();
  const left = state.cameraX + view * .34;
  const right = state.cameraX + view * .66;
  let wanted = state.cameraX;
  if (player.x < left) wanted = player.x - view * .34;
  if (player.x > right) wanted = player.x - view * .66;
  wanted = clamp(wanted, 0, Math.max(0, cameraWidth() - view));
  state.cameraX += (wanted - state.cameraX) * (1 - Math.exp(-delta * (player.flying ? 5.2 : 7.4)));
}
function updateCompanions(time) {
  if (naili.carried) {
    naili.x = player.x;
    naili.z = player.z;
    stopActor(naili);
  } else if (naili.summoned && distance(naili, player) > 115 && time > naili.nextThink) {
    naili.nextThink = time + 1.25;
    walkActor(naili, { x: player.x - player.dir * 54, z: clamp(player.z + .035, .12, .94) });
  } else if (!naili.summoned && !naili.path.length && time > naili.nextThink) {
    naili.nextThink = time + 5 + random() * 5;
    walkActor(naili, { x: clamp(naili.x + (random() - .5) * 290, 100, scene.width - 100), z: .7 + random() * .2 });
  }
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
function say(message, anchor, duration) {
  bubbleText.textContent = message;
  bubbleAnchor = anchor || 'hubby';
  bubbleUntil = performance.now() + (duration || 4400);
  bubble.hidden = false;
  positionOverlays();
}
function hideBubble() {
  bubble.hidden = true;
  bubbleAnchor = null;
}
function actorForAnchor(anchor) {
  if (anchor === 'player') return player;
  if (anchor === 'naili') return naili;
  return hubby;
}
function actorScreenAnchor(actor) {
  return renderer.worldToScreen(
    state.cameraX, actor.x,
    groundY(scene, actor.z) - (actor === naili ? 62 : actor === hubby ? 154 : 142)
  );
}
function positionOverlays() {
  if (!actions.hidden && menuAnchor) {
    const point = menuAnchor.kind === 'object'
      ? renderer.worldToScreen(state.cameraX, menuAnchor.object.x, menuAnchor.object.hit[1])
      : actorScreenAnchor(menuAnchor.actor);
    actions.style.setProperty('--actions-x', clamp(point.x, 74, renderer.cssWidth - 74) + 'px');
    actions.style.setProperty('--actions-y', clamp(point.y, 80, renderer.cssHeight - 110) + 'px');
  }
  if (!bubble.hidden && bubbleAnchor) {
    const point = actorScreenAnchor(actorForAnchor(bubbleAnchor));
    bubble.style.setProperty('--bubble-x', clamp(point.x, 90, renderer.cssWidth - 90) + 'px');
    bubble.style.setProperty('--bubble-y', clamp(point.y, 96, renderer.cssHeight - 70) + 'px');
  }
}
function hideActions() {
  actions.hidden = true;
  actionButtons.replaceChildren();
  menuAnchor = null;
  state.activeObjectId = null;
}
function showActions(title, choices, anchor) {
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
  stopActor(actor);
  actor.x = x;
  actor.z = z;
  actor.action = action || null;
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
      player.wings = !player.wings;
      player.flying = player.wings;
      writeStore('nestward.wingsEquipped', String(player.wings));
      renderWardrobe();
      say(player.wings ? '好。飞慢一点，我在下面跟着。' : '先替小猫把翅膀收好。');
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
function togetherAt(id, action) {
  return () => {
    const slots = sceneObject(id)?.slots;
    if (!slots?.kitten || !slots?.hubby) return;
    settleAt(player, slots.kitten.x, slots.kitten.z, action);
    settleAt(hubby, slots.hubby.x, slots.hubby.z, action);
    say('往我这边靠。地方够，腿也归小猫。');
  };
}
function objectChoices(object) {
  const choices = {
    bed: [
      { label: '坐到床边', run: () => { player.action = 'sit-bed'; say('床边给小猫留好了。'); } },
      { label: '躺一会', run: () => { player.action = 'lie'; say('躺好。今天先不催小猫做任何事。'); } },
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
      { label: '让 Hubby 推', run: () => { const slot = object.slots.hubbyPush; state.swing.active = true; state.swing.pushed = true; settleAt(hubby, slot.x, slot.z, 'push-swing'); say('会推高一点，但我接得住。'); } },
      { label: '下来', run: () => { state.swing.active = false; state.swing.pushed = false; player.action = null; } }
    ],
    garden: [
      { label: '蹲下看花', run: () => { player.action = 'crouch'; say('这一朵刚好是小猫喜欢的颜色。'); } },
      { label: '叫奶栗来闻', run: () => { naili.summoned = true; walkActor(naili, object.slots.naili); say('喵。', 'naili'); } }
    ],
    teaTable: [
      { label: '院子里吃点心', run: () => { player.action = 'sit-tea'; say('慢慢吃。掉下来的碎屑归奶栗。'); } },
      { label: '等 Hubby 端茶', run: () => { const slot = object.slots.hubbyServe; settleAt(hubby, slot.x, slot.z, 'serve-tea'); say('坐着别动，我端过来。'); } }
    ],
    fountain: [
      { label: readStore('nestward.wingsUnlocked', 'false') === 'true' ? '再许一个愿' : '许一个愿', run: unlockWings },
      { label: '听喷泉说话', run: () => say('它说，小猫想住的世界可以越长越大。') }
    ],
    pond: [
      { label: '看一会萤火', run: () => { player.action = 'crouch'; say('不必抓。它们会自己落到小猫附近。'); } },
      { label: '和奶栗等青蛙', run: () => { naili.summoned = true; walkActor(naili, object.slots.naili); say('奶栗比青蛙先等困。'); } }
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
  const choices = objectChoices(object);
  if (choices.length === 1) choices[0].run();
  else showActions(object.label, choices, { kind: 'object', object });
}
function approachObject(object) {
  hideActions();
  hideBubble();
  state.swing.active = false;
  state.activeObjectId = object.id;
  walkActor(player, object.socket, () => arriveAtObject(object));
}
function interactWithActor(actor) {
  hideActions();
  const target = { x: actor.x - (actor.dir || 1) * 72, z: clamp(actor.z + .015, .12, .93) };
  walkActor(player, target, () => {
    if (actor === hubby) {
      showActions('Hubby', [
        { label: hubby.follow ? '自己晃晃' : '跟着小猫', run: () => { hubby.follow = !hubby.follow; say(hubby.follow ? '好。小猫走到哪，我跟到哪。' : '我就在附近，不会走丢。'); } },
        { label: '牵一下手', run: () => { settleAt(hubby, player.x + player.dir * 58, player.z - .012, 'hold-hands'); say('抓住了。'); } },
        { label: '抱一下', run: () => { settleAt(hubby, player.x + player.dir * 42, player.z - .01, 'hug'); say('过来。'); } }
      ], { kind: 'actor', actor: hubby });
    } else {
      showActions('奶栗', [
        { label: naili.carried ? '放下来' : '抱起来', run: () => { naili.carried = !naili.carried; naili.summoned = naili.carried; say(naili.carried ? '呼噜。' : '喵。', 'naili'); } },
        { label: naili.summoned ? '让它自己玩' : '叫奶栗跟着', run: () => { naili.summoned = !naili.summoned; say(naili.summoned ? '它听见了。' : '它去巡视自己的领地了。'); } }
      ], { kind: 'actor', actor: naili });
    }
  });
}
async function changeScene(nextName) {
  if (changingScene) return;
  changingScene = true;
  hideActions();
  hideBubble();
  transition.classList.add('show');
  await pause(250);
  const previous = sceneName;
  sceneName = nextName;
  scene = SCENES[sceneName];
  canvas.dataset.scene = sceneName;
  const entryKey = previous === 'indoor' ? 'fromIndoor' : 'fromOutdoor';
  const entry = scene.entry[entryKey] || scene.spawn;
  Object.assign(player, entry.player);
  Object.assign(hubby, entry.hubby);
  if (!naili.carried) Object.assign(naili, entry.naili);
  [player, hubby, naili].forEach((actor) => {
    stopActor(actor);
    actor.action = null;
  });
  state.swing.active = false;
  state.swing.pushed = false;
  setInitialCamera();
  renderer.ensureCache(scene);
  await pause(80);
  transition.classList.remove('show');
  changingScene = false;
}

function actorHit(clientX, clientY) {
  const candidates = naili.carried ? [hubby] : [hubby, naili];
  return candidates.find((actor) => {
    const point = actorScreenAnchor(actor);
    const centerY = point.y + (actor === naili ? 25 : 64);
    return Math.hypot(clientX - point.x, (clientY - centerY) * .82) < (actor === naili ? 47 : 64);
  });
}
function handleWorldTap(clientX, clientY) {
  if (changingScene || !textPanel.hidden || !wardrobePanel.hidden) return;
  hint.hidden = true;
  const hitActor = actorHit(clientX, clientY);
  if (hitActor) {
    interactWithActor(hitActor);
    return;
  }
  const world = renderer.screenToWorld(scene, state.cameraX, clientX, clientY);
  const object = [...scene.objects].reverse().find((entry) => pointInsideHit(entry, world));
  if (object) {
    approachObject(object);
    return;
  }
  if (world.y >= scene.wallBottom - 8) {
    hideActions();
    hideBubble();
    state.activeObjectId = null;
    state.swing.active = false;
    player.action = null;
    state.tapPulse = { x: world.x, z: clamp(world.z, .1, .95), age: 0 };
    walkActor(player, { x: world.x, z: clamp(world.z, .1, .95) });
  }
}
function update(time, delta) {
  updateCompanions(time);
  updateActor(player, delta);
  updateActor(hubby, delta);
  if (!naili.carried) updateActor(naili, delta);
  updateCamera(delta);
  if (state.tapPulse) {
    state.tapPulse.age += delta;
    if (state.tapPulse.age > .72) state.tapPulse = null;
  }
  if (bubbleUntil && performance.now() > bubbleUntil) hideBubble();
  positionOverlays();
}
function frame(timestamp) {
  const delta = Math.min(.04, (timestamp - lastTime) / 1000 || .016);
  lastTime = timestamp;
  update(timestamp / 1000, delta);
  renderer.render(state, timestamp / 1000);
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', (event) => {
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup', (event) => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (moved < 14) handleWorldTap(event.clientX, event.clientY);
});
canvas.addEventListener('pointercancel', () => { pointerStart = null; });
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
addEventListener('resize', resize, { passive: true });

async function boot() {
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
