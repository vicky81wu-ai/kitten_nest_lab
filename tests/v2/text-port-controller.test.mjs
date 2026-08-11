import test from 'node:test';
import assert from 'node:assert/strict';
import { TextPortController } from '../../v2/runtime/controllers/text-port-controller.mjs';

function createElement() {
  return {
    dataset: { layoutReady: '1' },
    hidden: false,
    textContent: '',
    removed: [],
    removeAttribute(name) {
      this.removed.push(name);
      if (name === 'data-layout-ready') delete this.dataset.layoutReady;
    }
  };
}

test('a changed text port stays hidden from layout until its new height is placed', () => {
  let schedules = 0;
  const context = {
    isReconcilingScene: false,
    controllers: new Map([
      ['state', { source: 'degradedFallback' }],
      ['layout', { schedule: () => { schedules += 1; } }]
    ])
  };
  const controller = new TextPortController(context);
  const element = createElement();
  const port = {
    element,
    queue: ['A taller replacement line'],
    index: 0,
    visible: true,
    sourceField: 'coffeeCornerBubbles'
  };

  controller.render(port);

  assert.equal(element.dataset.layoutReady, undefined);
  assert.deepEqual(element.removed, ['data-layout-ready']);
  assert.equal(element.textContent, 'A taller replacement line');
  assert.equal(element.hidden, false);
  assert.equal(schedules, 1);

  context.isReconcilingScene = true;
  controller.render(port);
  assert.equal(schedules, 1);
});

test('an initially hidden beach bubble shows its first line before advancing', () => {
  const context = {
    isReconcilingScene: true,
    controllers: new Map([
      ['state', { source: 'degradedFallback' }],
      ['layout', { schedule: () => {} }]
    ])
  };
  const controller = new TextPortController(context);
  const port = {
    object: { initiallyVisible: false },
    element: createElement(),
    queue: ['first', 'second'],
    index: 0,
    visible: false,
    sourceField: 'manifest:fallbackQueue',
    hasShown: false
  };
  controller.ports.set('beach', port);

  controller.toggleNext('beach');
  assert.equal(port.visible, true);
  assert.equal(port.index, 0);
  controller.toggleNext('beach');
  assert.equal(port.visible, false);
  controller.toggleNext('beach');
  assert.equal(port.visible, true);
  assert.equal(port.index, 1);
});

test('a measured panorama bubble is revealed inside the current viewport', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: { scenePresentation: 'panorama' } } };
  try {
    const controller = new TextPortController({});
    controller.viewport = {
      scrollLeft: 466,
      scrollWidth: 1278,
      clientWidth: 393,
      getBoundingClientRect: () => ({ left: 0, right: 393 })
    };
    controller.ports.set('vicky', {
      element: {
        hidden: false,
        dataset: { layoutReady: '1' },
        getBoundingClientRect: () => ({ left: -66, right: 54 })
      }
    });
    controller.pendingRevealIds.add('vicky');

    controller.flushPendingReveals();

    assert.equal(controller.viewport.scrollLeft, 384);
    assert.equal(controller.pendingRevealIds.size, 0);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('a panorama dialogue group focuses once and preserves later manual panning', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: { scenePresentation: 'panorama' } } };
  try {
    const context = {
      isReconcilingScene: true,
      manifest: {
        dialogueGroups: {
          beachTalk: {
            id: 'beachTalk',
            ownerScene: 'beach',
            members: ['alex', 'vicky'],
            camera: { policy: 'groupLock', focusX: 0.51 }
          }
        }
      },
      controllers: new Map([
        ['state', { source: 'degradedFallback' }],
        ['layout', { schedule: () => {} }]
      ])
    };
    const controller = new TextPortController(context);
    controller.activeSceneId = 'beach';
    controller.viewport = {
      scrollLeft: 0,
      scrollWidth: 1278,
      clientWidth: 393,
      getBoundingClientRect: () => ({ left: 0, right: 393 })
    };
    const makePort = (id) => ({
      object: { id, dialogueGroupId: 'beachTalk' },
      element: createElement(),
      queue: [`${id} line`],
      index: 0,
      visible: false,
      sourceField: 'manifest:fallbackQueue',
      hasShown: false
    });
    const alex = makePort('alex');
    const vicky = makePort('vicky');
    controller.ports.set('alex', alex);
    controller.ports.set('vicky', vicky);

    controller.toggleNext('alex');
    controller.toggleNext('vicky');
    controller.toggleNext('alex');
    vicky.element.dataset.layoutReady = '1';
    controller.flushPendingReveals();

    assert.ok(Math.abs(controller.viewport.scrollLeft - 455.28) < 0.001);
    assert.deepEqual([...controller.focusedDialogueGroupIds], ['beachTalk']);

    controller.viewport.scrollLeft = 120;
    controller.toggleNext('vicky');
    controller.toggleNext('alex');
    alex.element.getBoundingClientRect = () => ({ left: -240, right: 633 });
    alex.element.dataset.layoutReady = '1';
    controller.flushPendingReveals();

    assert.equal(controller.viewport.scrollLeft, 120);
    assert.equal(controller.pendingDialogueGroupFocuses.size, 0);
    assert.equal(controller.pendingRevealIds.size, 0);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('entering another scene resets the one-focus dialogue lifecycle', async () => {
  const controller = new TextPortController({ manifest: { objects: {} } });
  controller.activeSceneId = 'beachA';
  controller.focusedDialogueGroupIds.add('beachTalk');
  controller.pendingDialogueGroupFocuses.set('beachTalk', 'alex');
  controller.pendingRevealIds.add('ungrouped');

  await controller.reconcile({ sceneId: 'beachB', allowedObjectIds: [] });

  assert.equal(controller.activeSceneId, 'beachB');
  assert.equal(controller.focusedDialogueGroupIds.size, 0);
  assert.equal(controller.pendingDialogueGroupFocuses.size, 0);
  assert.equal(controller.pendingRevealIds.size, 0);
});
