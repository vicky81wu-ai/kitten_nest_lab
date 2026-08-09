import { EventBus } from './core/events.mjs';
import { assertControllerContract } from './core/contracts.mjs';
import { assertManifest } from './core/manifest.mjs';
import { dispatchAction } from './core/actions.mjs';
import { createControllers } from './controllers/index.mjs';

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

function collectElements() {
  const byId = (id) => document.getElementById(id);
  return {
    shell: byId('v2-shell'),
    stage: byId('v2-stage'),
    sceneViewport: byId('v2-scene-viewport'),
    sceneWorld: byId('v2-scene-world'),
    sceneImage: byId('v2-scene-image'),
    effectLayer: byId('v2-effect-layer'),
    hotspotLayer: byId('v2-hotspot-layer'),
    textLayer: byId('v2-text-layer'),
    panelLayer: byId('v2-panel-layer'),
    controls: byId('v2-controls'),
    stateBadge: byId('v2-state-badge'),
    runtimeBadge: byId('v2-runtime-badge'),
    assetError: byId('v2-asset-error'),
    runtimeError: byId('v2-runtime-error')
  };
}

async function boot() {
  const [manifest, textTargetRegistry] = await Promise.all([
    fetchJson('/v2/data/nest-manifest.v2.json'),
    fetchJson('/data/text-targets.v1.json')
  ]);
  const validation = assertManifest(manifest, textTargetRegistry);
  const elements = collectElements();
  const events = new EventBus();
  const controllerStatuses = new Map();

  const context = {
    manifest,
    textTargetRegistry,
    validation,
    elements,
    events,
    controllerStatuses,
    controllers: null,
    currentSnapshot: null,
    currentAsset: null,
    currentLayout: null,
    isReconcilingScene: false,
    setControllerStatus(id, status, detail = '') {
      controllerStatuses.set(id, { status, detail, at: Date.now() });
      elements.runtimeBadge.textContent = `${id} · ${status}`;
      elements.runtimeBadge.dataset.status = status;
    },
    reportError(scope, error) {
      console.error(`[v2:${scope}]`, error);
      elements.runtimeError.hidden = false;
      elements.runtimeError.querySelector('[data-runtime-error-message]').textContent = `${scope}: ${error.message}`;
      document.body.dataset.v2Status = 'error';
    },
    async dispatch(action) {
      return dispatchAction(context, action);
    },
    async reconcileScene(snapshot) {
      context.isReconcilingScene = true;
      try {
        for (const id of manifest.runtime.reconcileOrder) {
          await context.controllers.get(id).reconcile(snapshot);
        }
      } finally {
        context.isReconcilingScene = false;
      }
    }
  };

  context.controllers = createControllers(context);
  for (const [id, controller] of context.controllers) assertControllerContract(id, controller);

  for (const id of manifest.runtime.mountOrder) {
    await context.controllers.get(id).mount();
  }
  for (const id of manifest.runtime.readyOrder) {
    await context.controllers.get(id).ready();
  }

  const bootReady = Boolean(context.currentSnapshot && context.currentAsset);
  document.body.dataset.v2Status = bootReady ? 'ready' : 'blocked';
  elements.runtimeBadge.textContent = bootReady ? 'v2 ready' : 'v2 blocked';
  elements.runtimeBadge.dataset.status = bootReady ? 'ready' : 'blocked';

  window.KittenNestV2 = Object.freeze({
    version: manifest.version,
    manifest,
    controllers: context.controllers,
    get scene() {
      return context.currentSnapshot?.sceneId || null;
    },
    go(target) {
      return context.dispatch({ type: 'scene.go', target });
    },
    push(target) {
      return context.dispatch({ type: 'scene.push', target });
    },
    back() {
      return context.dispatch({ type: 'scene.back' });
    }
  });
}

boot().catch((error) => {
  console.error('[v2:boot]', error);
  document.body.dataset.v2Status = 'fatal';
  const fatal = document.getElementById('v2-fatal');
  fatal.hidden = false;
  fatal.querySelector('[data-fatal-message]').textContent = error.message;
});
