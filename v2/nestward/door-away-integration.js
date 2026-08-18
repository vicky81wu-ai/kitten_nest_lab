import { SCENES, findPath, pointInsideHit } from './world-model.js';
import { WorldRenderer } from './world-renderer.js';
import {
  DOOR_AWAY_ACCEPTED,
  loadAcceptedDoorAwayCalibration,
  buildAcceptedDoorAwayMasks,
  createDoorAwayWalkPlanner
} from './door-away-runtime.js';
import { DoorAwayOverlay } from './door-away-overlay.js';

const TEST_MODE = new URLSearchParams(location.search).has('doorAwayTest');
const random = (() => {
  let value = 0x19a8d00d;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
})();

let stateRef = null;
let rendererRef = null;
let overlay = null;
let calibration = null;
let masks = null;
let planner = null;
let calibrationReady = false;
let overlayReady = false;
let phase = 'idle';
let overlayMode = null;
let savedHubby = null;
let testUI = null;
let blockedPointerId = null;

const originalRender = WorldRenderer.prototype.render;
const originalBounds = WorldRenderer.prototype.actorScreenBounds;

function hint(message, duration = 2600) {
  const element = document.querySelector('#hint');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  clearTimeout(hint.timer);
  hint.timer = setTimeout(() => { element.hidden = true; }, duration);
}

function phaseLabel() {
  return {
    idle: '在家',
    approach: '走向点1',
    leaving: '穿门中',
    outside: '门外活动 · 等小猫叫',
    returningOutside: '正在回门口',
    returningB: '正在进屋'
  }[phase] || phase;
}

function syncTestUI() {
  if (!testUI) return;
  const start = testUI.querySelector('[data-away-start]');
  const recall = testUI.querySelector('[data-away-recall]');
  const status = testUI.querySelector('[data-away-status]');
  const ready = calibrationReady && overlayReady && stateRef;
  start.disabled = !ready || phase !== 'idle';
  recall.disabled = !ready || phase !== 'outside';
  status.textContent = !calibrationReady
    ? '读取验收参数…'
    : !overlayReady
      ? '准备门框图层…'
      : phaseLabel();
}

function makeTestUI() {
  if (!TEST_MODE || testUI) return;
  const root = document.querySelector('#nestward');
  if (!root) return;
  testUI = document.createElement('div');
  testUI.id = 'doorAwayTestControls';
  testUI.setAttribute('aria-label', '门外状态施工验收');
  Object.assign(testUI.style, {
    position: 'absolute',
    zIndex: '91',
    right: '10px',
    top: 'max(62px, calc(env(safe-area-inset-top) + 54px))',
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    gap: '5px',
    padding: '6px',
    borderRadius: '12px',
    background: 'rgba(29,20,17,.58)',
    border: '1px solid rgba(255,245,232,.14)',
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)'
  });
  testUI.innerHTML = '<button data-away-start type="button">出去</button><button data-away-recall type="button">叫回来</button><small data-away-status style="grid-column:1/-1;text-align:center;color:rgba(255,247,238,.75);font:10px/1.2 -apple-system,BlinkMacSystemFont,sans-serif">准备中</small>';
  for (const button of testUI.querySelectorAll('button')) {
    Object.assign(button.style, {
      minWidth: '58px',
      minHeight: '34px',
      border: '1px solid rgba(255,245,232,.14)',
      borderRadius: '10px',
      background: 'rgba(255,248,238,.91)',
      color: '#4b352d',
      font: '700 12px/1 -apple-system,BlinkMacSystemFont,sans-serif'
    });
  }
  testUI.querySelector('[data-away-start]').addEventListener('click', startAway);
  testUI.querySelector('[data-away-recall]').addEventListener('click', recallHubby);
  root.append(testUI);
  syncTestUI();
}

async function ensureOverlay(renderer) {
  if (overlay || !renderer) return;
  overlay = new DoorAwayOverlay(document.querySelector('#world'), renderer);
  if (masks) overlay.setMasks(masks);
  try {
    await overlay.preload();
    if (masks) overlay.setMasks(masks);
    overlayReady = true;
  } catch (error) {
    console.error('[door-away] overlay preload failed', error);
    hint('门框测试图层没到齐，先不启动这个模式。', 4200);
  }
  syncTestUI();
}

function exactPath(actor, points, afterMove = null) {
  actor.path = points.map((point) => ({ x: point.x, z: point.z }));
  actor.afterMove = afterMove;
  const target = actor.path[0];
  actor.travelDir = target && Math.abs(target.x - actor.x) > 24 ? (target.x > actor.x ? 1 : -1) : null;
  if (actor.travelDir) actor.dir = actor.travelDir;
  if (!actor.path.length && afterMove) {
    actor.afterMove = null;
    queueMicrotask(afterMove);
  }
}

function normalPathTo(actor, target, afterMove) {
  const path = findPath(SCENES.indoor, actor, target);
  if (path.length) path[path.length - 1] = { ...target };
  else path.push({ ...target });
  exactPath(actor, path, afterMove);
}

function setHubbyLockedPose() {
  if (!stateRef?.hubby) return;
  stateRef.hubby.mount = null;
  stateRef.hubby.action = 'door-away-lock';
  stateRef.hubby.follow = false;
}

function beginLeaving() {
  if (!stateRef || phase !== 'approach') return;
  const hubby = stateRef.hubby;
  phase = 'leaving';
  overlayMode = 'B';
  hubby.speed = 92 * (Number(calibration?.moveSpeed) || DOOR_AWAY_ACCEPTED.moveSpeed);
  setHubbyLockedPose();
  exactPath(hubby, [{ ...calibration.point2 }], beginOutside);
  syncTestUI();
}

function scheduleOutsideWander(delay = 260) {
  if (phase !== 'outside' || !planner?.ready || !stateRef) return;
  setTimeout(() => {
    if (phase !== 'outside' || !stateRef) return;
    const hubby = stateRef.hubby;
    const path = planner.randomPath(hubby, random);
    if (path.length > 1) {
      exactPath(hubby, path, () => scheduleOutsideWander(320 + random() * 520));
    } else {
      scheduleOutsideWander(420);
    }
  }, delay);
}

function beginOutside() {
  if (!stateRef || phase !== 'leaving') return;
  const hubby = stateRef.hubby;
  phase = 'outside';
  overlayMode = 'outside';
  hubby.x = calibration.point2.x;
  hubby.z = calibration.point2.z;
  hubby.speed = 92 * (Number(calibration?.moveSpeed) || DOOR_AWAY_ACCEPTED.moveSpeed)
    * (Number(calibration?.outsideSpeedFactor) || DOOR_AWAY_ACCEPTED.outsideSpeedFactor);
  setHubbyLockedPose();
  scheduleOutsideWander(300);
  syncTestUI();
  hint('Hubby 已经到门外了。测试版会一直在外面，等小猫点「叫回来」。', 4200);
}

function finishReturn() {
  if (!stateRef) return;
  const hubby = stateRef.hubby;
  overlayMode = null;
  phase = 'idle';
  hubby.speed = savedHubby?.speed || 182;
  hubby.follow = Boolean(savedHubby?.follow);
  hubby.action = null;
  hubby.mount = null;
  hubby.path.length = 0;
  hubby.afterMove = null;
  hubby.travelDir = null;
  hubby.nextThink = performance.now() / 1000 + 4;
  savedHubby = null;
  syncTestUI();
  hint('回来了。B 和临时地板都撤掉，恢复正常。', 2800);
}

function returnThroughB() {
  if (!stateRef || phase !== 'returningOutside') return;
  const hubby = stateRef.hubby;
  phase = 'returningB';
  overlayMode = 'B';
  hubby.x = calibration.point2.x;
  hubby.z = calibration.point2.z;
  hubby.speed = 92 * (Number(calibration?.moveSpeed) || DOOR_AWAY_ACCEPTED.moveSpeed);
  exactPath(hubby, [{ ...calibration.point1 }], finishReturn);
  syncTestUI();
}

function recallHubby() {
  if (!stateRef || phase !== 'outside') {
    if (phase !== 'idle') hint('还在穿门，等他真正出去后再叫。', 2200);
    return;
  }
  phase = 'returningOutside';
  overlayMode = 'outside';
  const hubby = stateRef.hubby;
  hubby.path.length = 0;
  hubby.afterMove = null;
  hubby.speed = 92 * (Number(calibration?.moveSpeed) || DOOR_AWAY_ACCEPTED.moveSpeed)
    * (Number(calibration?.outsideSpeedFactor) || DOOR_AWAY_ACCEPTED.outsideSpeedFactor);
  const path = planner.pathToAnchor(hubby);
  exactPath(hubby, path.length ? path : [{ ...calibration.point2 }], returnThroughB);
  syncTestUI();
}

function startAway() {
  if (!calibrationReady || !overlayReady || !stateRef || !planner?.ready) {
    hint('门框参数还没准备好。', 2400);
    return;
  }
  if (phase !== 'idle') return;
  if (stateRef.scene.id !== 'indoor') {
    hint('这个测试目前只在室内启动。', 2400);
    return;
  }
  if (stateRef.princessCarry?.active) {
    hint('公主抱状态先不混进这条门测试。先放下来再试。', 3200);
    return;
  }
  if (stateRef.hubby.mount) {
    hint('Hubby 现在正坐着/躺着。先让他站起来，再测试出门。', 3200);
    return;
  }
  const hubby = stateRef.hubby;
  savedHubby = { speed: hubby.speed, follow: hubby.follow };
  hubby.follow = false;
  hubby.action = 'door-away-lock';
  hubby.path.length = 0;
  hubby.afterMove = null;
  overlayMode = null;
  phase = 'approach';
  normalPathTo(hubby, calibration.point1, beginLeaving);
  syncTestUI();
}

function isBlockedDoorPointer(event) {
  if (phase === 'idle' || !stateRef || !rendererRef || stateRef.scene.id !== 'indoor') return false;
  const world = rendererRef.screenToWorld(stateRef.scene, stateRef.cameraX, event.clientX, event.clientY, stateRef.cameraY || 0);
  const door = stateRef.scene.objects.find((object) => object.id === 'door');
  return Boolean(door && pointInsideHit(door, world));
}

function installDoorGuard() {
  const canvas = document.querySelector('#world');
  if (!canvas) return;
  canvas.addEventListener('pointerdown', (event) => {
    if (!isBlockedDoorPointer(event)) return;
    blockedPointerId = event.pointerId;
    event.preventDefault();
    event.stopImmediatePropagation();
    hint('Hubby 还在门外。先把他叫回来，再走正常的院门。', 3000);
  }, true);
  canvas.addEventListener('pointerup', (event) => {
    if (blockedPointerId !== event.pointerId) return;
    blockedPointerId = null;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  canvas.addEventListener('pointercancel', (event) => {
    if (blockedPointerId === event.pointerId) blockedPointerId = null;
  }, true);
}

async function prepareCalibration() {
  calibration = loadAcceptedDoorAwayCalibration();
  if (!calibration) {
    console.warn('[door-away] accepted Door Lab snapshot not found on this origin');
    calibrationReady = false;
    syncTestUI();
    return;
  }
  try {
    masks = await buildAcceptedDoorAwayMasks(calibration);
    planner = createDoorAwayWalkPlanner(masks.walk, SCENES.indoor, calibration.point2);
    calibrationReady = Boolean(planner.ready);
    if (overlay) overlay.setMasks(masks);
  } catch (error) {
    console.error('[door-away] calibration build failed', error);
    calibrationReady = false;
  }
  syncTestUI();
}

export function installDoorAwayIntegration() {
  makeTestUI();
  installDoorGuard();
  prepareCalibration();

  WorldRenderer.prototype.render = function patchedDoorAwayRender(state, time) {
    stateRef = state;
    rendererRef = this;
    if (!overlay) ensureOverlay(this);

    const hubby = state.hubby;
    const shouldOverlay = Boolean(overlayMode && state.scene.id === 'indoor' && overlayReady && masks);
    if (shouldOverlay) {
      const x = hubby.x;
      hubby.x = -10000;
      try {
        originalRender.call(this, state, time);
      } finally {
        hubby.x = x;
      }
      overlay.render(state, time, overlayMode);
      const bubble = document.querySelector('#bubble');
      if (bubble) bubble.hidden = true;
    } else {
      originalRender.call(this, state, time);
      if (overlay) overlay.clear();
    }
    syncTestUI();
  };

  WorldRenderer.prototype.actorScreenBounds = function patchedDoorAwayBounds(state, actor) {
    if (phase !== 'idle' && actor?.id === 'hubby') {
      return { x: -10000, y: -10000, width: 1, height: 1 };
    }
    return originalBounds.call(this, state, actor);
  };

  globalThis.__NW_DOOR_AWAY__ = {
    start: startAway,
    recall: recallHubby,
    get status() {
      return {
        phase,
        overlayMode,
        ready: calibrationReady && overlayReady,
        point1: calibration?.point1 || DOOR_AWAY_ACCEPTED.point1,
        point2: calibration?.point2 || DOOR_AWAY_ACCEPTED.point2,
        outsideSpeedFactor: calibration?.outsideSpeedFactor || DOOR_AWAY_ACCEPTED.outsideSpeedFactor
      };
    }
  };
}
