import test from 'node:test';
import assert from 'node:assert/strict';
import { HotspotController } from '../../v2/runtime/controllers/hotspot-controller.mjs';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function eventFor(element, overrides = {}) {
  return {
    target: { closest: () => element },
    pointerId: 7,
    clientX: 12,
    clientY: 18,
    prevented: 0,
    stopped: 0,
    preventDefault() { this.prevented += 1; },
    stopPropagation() { this.stopped += 1; },
    ...overrides
  };
}

test('long press dispatches once while a short release and moved finger stay silent', async () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: {} } };
  try {
    const actions = [];
    const element = {
      dataset: { hotspotId: 'admin' },
      disabled: false,
      setPointerCapture() {}
    };
    const context = {
      manifest: {
        objects: {
          admin: {
            id: 'admin',
            gesture: 'longPress',
            longPressMs: 8,
            action: { type: 'panel.open', target: 'media' }
          }
        }
      },
      dispatch: async (action) => { actions.push(action); },
      reportError: assert.fail
    };
    const controller = new HotspotController(context);

    controller.handlePointerDown(eventFor(element));
    await wait(14);
    assert.deepEqual(actions, [{ type: 'panel.open', target: 'media' }]);
    controller.handlePointerUp(eventFor(element));

    controller.handlePointerDown(eventFor(element));
    controller.handlePointerUp(eventFor(element));
    await wait(12);
    assert.equal(actions.length, 1);

    controller.handlePointerDown(eventFor(element));
    controller.handlePointerMove(eventFor(element, { clientX: 40 }));
    await wait(12);
    assert.equal(actions.length, 1);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('ordinary hotspot pointerup still dispatches immediately', async () => {
  const actions = [];
  const element = { dataset: { hotspotId: 'dock' }, disabled: false };
  const context = {
    manifest: { objects: { dock: { id: 'dock', action: { type: 'scene.dock', side: 'right' } } } },
    dispatch: async (action) => { actions.push(action); },
    reportError: assert.fail
  };
  const controller = new HotspotController(context);
  await controller.handlePointerUp(eventFor(element));
  assert.deepEqual(actions, [{ type: 'scene.dock', side: 'right' }]);
});
