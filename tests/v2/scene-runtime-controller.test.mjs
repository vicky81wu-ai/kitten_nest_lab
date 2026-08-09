import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneRuntimeController } from '../../v2/runtime/controllers/scene-runtime-controller.mjs';

test('a failed scene asset never commits navigation or child ownership', async () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: {} } };

  try {
    const stage = { dataset: {} };
    const events = [];
    const reconciled = [];
    let nextAssetResult = { ok: true, key: 'home.day' };
    let restoreSchedules = 0;
    const context = {
      manifest: {
        runtime: { entryScene: 'home', transitionDelayMs: 0, settleDelayMs: 0 },
        globalObjects: [],
        scenes: {
          home: { id: 'home', parent: null, objects: [], docks: {} },
          coffeeCorner: { id: 'coffeeCorner', parent: null, objects: ['coffee.hot'], docks: {} }
        }
      },
      elements: { stage },
      events: { emit: (name, detail) => events.push({ name, detail }) },
      controllers: null,
      currentSnapshot: null,
      reconcileScene: async (snapshot) => { reconciled.push(snapshot.sceneId); },
      setControllerStatus: () => {},
      reportError: (scope, error) => { throw new Error(`${scope}: ${error.message}`); }
    };
    const noopOwner = { suspend: async () => {} };
    const layout = {
      suspend: async () => {},
      schedule: () => { restoreSchedules += 1; }
    };
    const asset = { loadForScene: async () => nextAssetResult };
    context.controllers = new Map([
      ['panel', noopOwner],
      ['effect', noopOwner],
      ['layout', layout],
      ['asset', asset]
    ]);

    const runtime = new SceneRuntimeController(context);
    await runtime.mount();
    await runtime.ready();
    assert.equal(runtime.navigation.current, 'home');
    assert.equal(context.currentSnapshot.sceneId, 'home');

    nextAssetResult = { ok: false, key: 'coffee.main', error: 'network failed' };
    const changed = await runtime.navigate({ type: 'scene.go', target: 'coffeeCorner' });

    assert.equal(changed, false);
    assert.equal(runtime.navigation.current, 'home');
    assert.equal(context.currentSnapshot.sceneId, 'home');
    assert.equal(stage.dataset.sceneId, 'home');
    assert.equal(stage.dataset.assetResult, 'error');
    assert.deepEqual(reconciled, ['home', 'home']);
    assert.equal(restoreSchedules, 1);
    assert.equal(events.some((event) => event.name === 'scene:didFail'), true);
    assert.equal(events.some((event) => event.name === 'scene:didChange' && event.detail.sceneId === 'coffeeCorner'), false);
  } finally {
    globalThis.document = originalDocument;
  }
});
