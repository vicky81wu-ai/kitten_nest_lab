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
  const element = { dataset: { hotspotId: 'panel' }, disabled: false };
  const context = {
    manifest: { objects: { panel: { id: 'panel', action: { type: 'panel.open', target: 'weather' } } } },
    dispatch: async (action) => { actions.push(action); },
    reportError: assert.fail
  };
  const controller = new HotspotController(context);
  await controller.handlePointerUp(eventFor(element));
  assert.deepEqual(actions, [{ type: 'panel.open', target: 'weather' }]);
});

test('image-locked navigation tap survives pointer release outside its invisible zone', async () => {
  const actions = [];
  const element = {
    dataset: { hotspotId: 'dock' },
    disabled: false,
    captures: [],
    releases: [],
    setPointerCapture(pointerId) { this.captures.push(pointerId); },
    releasePointerCapture(pointerId) { this.releases.push(pointerId); }
  };
  const context = {
    manifest: { objects: { dock: { id: 'dock', action: { type: 'scene.go', target: 'coffeeCorner' } } } },
    dispatch: async (action) => { actions.push(action); },
    reportError: assert.fail
  };
  const controller = new HotspotController(context);
  const down = eventFor(element, { clientX: 100, clientY: 700 });
  controller.handlePointerDown(down);
  const outside = eventFor(null, {
    target: { closest: () => null },
    clientX: 118,
    clientY: 713
  });
  await controller.handlePointerUp(outside);
  assert.deepEqual(actions, [{ type: 'scene.go', target: 'coffeeCorner' }]);
  assert.deepEqual(element.captures, [7]);
  assert.deepEqual(element.releases, [7]);
  assert.equal(down.prevented, 1);
  assert.equal(outside.prevented, 1);
});

test('image-locked navigation drag beyond the tap tolerance cancels navigation', async () => {
  const actions = [];
  const element = {
    dataset: { hotspotId: 'dock' },
    disabled: false,
    setPointerCapture() {},
    releasePointerCapture() {}
  };
  const context = {
    manifest: { objects: { dock: { id: 'dock', action: { type: 'scene.back' } } } },
    dispatch: async (action) => { actions.push(action); },
    reportError: assert.fail
  };
  const controller = new HotspotController(context);
  controller.handlePointerDown(eventFor(element, { clientX: 100, clientY: 700 }));
  controller.handlePointerMove(eventFor(element, { clientX: 140, clientY: 700 }));
  await controller.handlePointerUp(eventFor(null, {
    target: { closest: () => null },
    clientX: 140,
    clientY: 700
  }));
  assert.deepEqual(actions, []);
});

test('iOS touch selection is blocked only inside the long-press zone', async () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: {} } };
  try {
    const actions = [];
    const admin = { dataset: { hotspotId: 'admin' }, disabled: false };
    const ordinary = { dataset: { hotspotId: 'ordinary' }, disabled: false };
    const context = {
      manifest: {
        objects: {
          admin: {
            id: 'admin',
            gesture: 'longPress',
            longPressMs: 8,
            action: { type: 'panel.open', target: 'media' }
          },
          ordinary: { id: 'ordinary', action: { type: 'panel.open', target: 'other' } }
        }
      },
      dispatch: async (action) => { actions.push(action); },
      reportError: assert.fail
    };
    const controller = new HotspotController(context);
    const touch = { identifier: 9, clientX: 10, clientY: 12 };
    const start = eventFor(admin, { touches: [touch] });
    controller.handleTouchStart(start);
    assert.equal(start.prevented, 1);
    assert.equal(start.stopped, 1);
    assert.equal(globalThis.document.body.dataset.longPressArmed, 'admin');
    await wait(14);
    assert.deepEqual(actions, [{ type: 'panel.open', target: 'media' }]);

    const select = eventFor(admin);
    controller.handleSelectStart(select);
    assert.equal(select.prevented, 1);

    const end = eventFor(admin, { changedTouches: [touch] });
    controller.handleTouchEnd(end);
    assert.equal(end.prevented, 1);
    assert.equal(globalThis.document.body.dataset.longPressArmed, undefined);

    const ordinaryStart = eventFor(ordinary, { touches: [touch] });
    controller.handleTouchStart(ordinaryStart);
    assert.equal(ordinaryStart.prevented, 0);
    assert.equal(ordinaryStart.stopped, 0);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
