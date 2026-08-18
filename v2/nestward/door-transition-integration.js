import { SCENES, findPath } from './world-model.js';
import { WorldRenderer } from './world-renderer.js';
import { loadAcceptedDoorAwayCalibration, buildAcceptedDoorAwayMasks } from './door-away-runtime.js';
import { DoorTransitionOverlay } from './door-transition-overlay.js';

export const DOOR_TRANSITION_ACCEPTED = Object.freeze({
  indoor: Object.freeze({
    kitten: Object.freeze({
      point1: Object.freeze({ x: 1389.0143540669856, z: 0.21818010630740092 }),
      point2: Object.freeze({ x: 1495.823923444976, z: 0.2435980176494252 })
    }),
    hubby: Object.freeze({
      point: Object.freeze({ x: 1360.5971291866026, z: 0.15156764899726935 })
    })
  }),
  outdoor: Object.freeze({
    kitten: Object.freeze({
      point: Object.freeze({ x: 137.18660287081337, z: 0.32225861470423944 })
    }),
    hubby: Object.freeze({
      point: Object.freeze({ x: 196.47081339712915, z: 0.28902842135450457 })
    })
  })
});

const clonePoint = (point) => ({ x: point.x, z: point.z });
const metric = (a, b) => Math.hypot(a.x - b.x, (a.z - b.z) * 520);

let installed = false;
let previousRender = null;
let overlay = null;
let maskB = null;
let maskReady = false;
let maskError = null;
let phase = 'idle';
let maskBActive = false;
let lastSceneId = null;
let exitPathRewritten = false;

export function applyDoorTransitionAnchors() {
  const accepted = DOOR_TRANSITION_ACCEPTED;
  const indoor = SCENES.indoor;
  const outdoor = SCENES.outdoor;

  indoor.doorway.kittenA = clonePoint(accepted.indoor.kitten.point2);
  indoor.doorway.kittenB = clonePoint(accepted.indoor.kitten.point1);
  indoor.doorway.hubbyExit = clonePoint(accepted.indoor.hubby.point);
  indoor.doorway.hubbyArrival = clonePoint(accepted.indoor.hubby.point);
  indoor.entry.fromOutdoor.player = clonePoint(accepted.indoor.kitten.point2);
  indoor.entry.fromOutdoor.hubby = clonePoint(accepted.indoor.hubby.point);

  outdoor.doorway.kittenAnchor = clonePoint(accepted.outdoor.kitten.point);
  outdoor.doorway.hubbyEntry = clonePoint(accepted.outdoor.hubby.point);
  outdoor.doorway.hubbyReturn = clonePoint(accepted.outdoor.hubby.point);
  outdoor.entry.fromIndoor.player = clonePoint(accepted.outdoor.kitten.point);
  outdoor.entry.fromIndoor.hubby = clonePoint(accepted.outdoor.hubby.point);
}

function ensureOverlay(renderer) {
  if (!renderer?.ready) return;
  if (!overlay) overlay = new DoorTransitionOverlay(document.querySelector('#world'), renderer);
  if (maskB) overlay.setMask(maskB);
}

async function prepareMask() {
  try {
    const calibration = loadAcceptedDoorAwayCalibration();
    if (!calibration) {
      maskError = new Error('accepted Door Away A/B calibration is unavailable on this origin');
      maskReady = false;
      console.warn('[door-transition] B mask unavailable: accepted Door Away calibration not found');
      return;
    }
    const masks = await buildAcceptedDoorAwayMasks(calibration);
    maskB = masks.maskB;
    maskReady = true;
    maskError = null;
    if (overlay) overlay.setMask(maskB);
  } catch (error) {
    maskReady = false;
    maskError = error;
    console.error('[door-transition] failed to build B mask', error);
  }
}

function rewriteIndoorExitPath(state) {
  if (exitPathRewritten || state.scene.id !== 'indoor' || state.princessCarry?.active) return;
  const player = state.player;
  const point1 = DOOR_TRANSITION_ACCEPTED.indoor.kitten.point1;
  const point2 = DOOR_TRANSITION_ACCEPTED.indoor.kitten.point2;
  const afterMove = player.afterMove;
  const path = findPath(SCENES.indoor, player, point1);
  if (path.length) path[path.length - 1] = clonePoint(point1);
  else path.push(clonePoint(point1));
  path.push(clonePoint(point2));
  player.path = path;
  player.afterMove = afterMove;
  player.travelDir = null;
  exitPathRewritten = true;
}

function clearTransitionPhase() {
  phase = 'idle';
  maskBActive = false;
  exitPathRewritten = false;
}

function syncTransitionPhase(state) {
  const sceneId = state.scene.id;
  if (lastSceneId == null) lastSceneId = sceneId;

  if (sceneId !== lastSceneId) {
    const previousSceneId = lastSceneId;
    lastSceneId = sceneId;
    exitPathRewritten = false;
    if (!state.princessCarry?.active && previousSceneId === 'outdoor' && sceneId === 'indoor' && state.doorTravel) {
      phase = 'arrivalB';
      maskBActive = true;
    } else {
      clearTransitionPhase();
    }
  }

  if (state.princessCarry?.active) {
    if (phase !== 'idle') clearTransitionPhase();
    return;
  }

  if (sceneId === 'indoor' && state.doorTravel && phase === 'idle') {
    phase = 'exitBeforeB';
    rewriteIndoorExitPath(state);
  }

  if (phase === 'exitBeforeB') {
    rewriteIndoorExitPath(state);
    const point1 = DOOR_TRANSITION_ACCEPTED.indoor.kitten.point1;
    const point2 = DOOR_TRANSITION_ACCEPTED.indoor.kitten.point2;
    const target = state.player.path?.[0];
    const headingToPoint2 = target && metric(target, point2) < 3;
    if (metric(state.player, point1) < 8 || headingToPoint2) {
      phase = 'exitB';
      maskBActive = true;
    }
  }

  if (phase === 'arrivalB' && !state.doorTravel) clearTransitionPhase();
  if ((phase === 'exitBeforeB' || phase === 'exitB') && !state.doorTravel && sceneId === 'indoor') clearTransitionPhase();
}

export function installDoorTransitionIntegration() {
  if (installed) return;
  installed = true;
  applyDoorTransitionAnchors();
  prepareMask();

  previousRender = WorldRenderer.prototype.render;
  WorldRenderer.prototype.render = function patchedDoorTransitionRender(state, time) {
    syncTransitionPhase(state);
    ensureOverlay(this);

    const shouldMaskPlayer = Boolean(maskBActive
      && state.scene.id === 'indoor'
      && maskReady
      && overlay?.ready
      && !state.princessCarry?.active);

    if (!shouldMaskPlayer) {
      previousRender.call(this, state, time);
      if (overlay) overlay.clear();
      return;
    }

    const x = state.player.x;
    state.player.x = -10000;
    try {
      previousRender.call(this, state, time);
    } finally {
      state.player.x = x;
    }
    overlay.render(state, time);
  };

  globalThis.__NW_DOOR_TRANSITION__ = {
    accepted: DOOR_TRANSITION_ACCEPTED,
    get status() {
      return {
        phase,
        maskBActive,
        maskReady,
        error: maskError?.message || null,
        exitPathRewritten
      };
    }
  };
}
