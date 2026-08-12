import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TextPortController,
  textQueueFingerprint
} from '../../v2/runtime/controllers/text-port-controller.mjs';

function createElement() {
  return {
    dataset: { layoutReady: '1' },
    hidden: false,
    textContent: '',
    removed: [],
    removeAttribute(name) {
      this.removed.push(name);
      if (name === 'data-layout-ready') delete this.dataset.layoutReady;
    },
    remove() {
      this.didRemove = true;
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

test('dialogue advance, speaker switches, and relayout never move a panorama camera', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { body: { dataset: { scenePresentation: 'panorama' } } };
  try {
    const { controller, advance } = createConversationHarness([
      { speaker: 'alex', text: 'A1' },
      { speaker: 'alex', text: 'A much taller replacement line' },
      { speaker: 'vicky', text: 'V1' }
    ]);
    controller.viewport = {
      scrollLeft: 137,
      scrollWidth: 1278,
      clientWidth: 393,
      getBoundingClientRect: () => ({ left: 0, right: 393 })
    };

    for (let turn = 0; turn < 3; turn += 1) {
      assert.equal(advance(), true);
      controller.ports.get(turn < 2 ? 'alex' : 'vicky').element.dataset.layoutReady = '1';
      controller.flushPendingReveals();
      assert.equal(controller.viewport.scrollLeft, 137);
    }
    assert.equal(controller.pendingRevealIds.size, 0);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('entering another scene clears dialogue runtime but preserves ambient session memory', async () => {
  const controller = new TextPortController({ manifest: { objects: {} } });
  controller.activeSceneId = 'beachA';
  controller.dialogueRuntimes.set('beachTalk', { index: 1 });
  controller.ambientBubbleSessions.set('coffeeBubble', {
    fingerprint: '["one"]', index: 0, visible: false, hasShown: true
  });
  controller.pendingRevealIds.add('ungrouped');

  await controller.reconcile({ sceneId: 'beachB', allowedObjectIds: [] });

  assert.equal(controller.activeSceneId, 'beachB');
  assert.equal(controller.dialogueRuntimes.size, 0);
  assert.equal(controller.ambientBubbleSessions.size, 1);
  assert.equal(controller.pendingRevealIds.size, 0);
});

test('standalone bubbles resume the exact closed line and advance from it after scene return', () => {
  const controller = new TextPortController({
    manifest: { dialogueGroups: {} },
    isReconcilingScene: true,
    controllers: new Map([
      ['state', { source: 'live' }],
      ['layout', { schedule: () => {} }]
    ])
  });
  const port = {
    object: { id: 'coffeeBubble', initiallyVisible: true },
    element: createElement(),
    queue: ['one', 'two', 'three', 'four'],
    index: 0,
    visible: true,
    hasShown: true
  };
  controller.ports.set('coffeeBubble', port);

  controller.toggleNext('coffeeBubble');
  controller.toggleNext('coffeeBubble');
  controller.toggleNext('coffeeBubble');
  controller.toggleNext('coffeeBubble');
  controller.toggleNext('coffeeBubble');
  assert.equal(port.index, 2);
  assert.equal(port.visible, false);

  const returned = {
    object: port.object,
    element: createElement(),
    queue: [...port.queue],
    index: 0,
    visible: true,
    hasShown: false
  };
  controller.restoreAmbientSession(returned, 0);
  controller.ports.set('coffeeBubble', returned);
  assert.equal(returned.index, 2);
  assert.equal(returned.visible, false);
  assert.equal(returned.hasShown, true);

  controller.toggleNext('coffeeBubble');
  assert.equal(returned.index, 3);
  assert.equal(returned.visible, true);
  assert.equal(returned.element.textContent, 'four');
});

test('changed standalone content resets safely and a fresh runtime forgets prior session state', () => {
  const object = { id: 'ambient', initiallyVisible: false };
  const controller = new TextPortController({ manifest: { dialogueGroups: {} } });
  controller.ambientBubbleSessions.set('ambient', {
    fingerprint: textQueueFingerprint(['old one', 'old two']),
    index: 1,
    visible: true,
    hasShown: true
  });
  const changed = {
    object,
    element: createElement(),
    queue: ['new one'],
    index: 0,
    visible: true,
    hasShown: true
  };
  controller.restoreAmbientSession(changed, 0);
  assert.equal(changed.index, 0);
  assert.equal(changed.visible, false);
  assert.equal(changed.hasShown, false);

  const freshController = new TextPortController({ manifest: { dialogueGroups: {} } });
  const fresh = { ...changed, element: createElement(), visible: true, hasShown: true };
  freshController.restoreAmbientSession(fresh, 0);
  assert.equal(fresh.visible, false);
  assert.equal(fresh.hasShown, false);
});

function createConversationHarness(canonicalTurns = null) {
  let clock = 1000;
  const state = canonicalTurns ? { beachMainTurns: canonicalTurns } : {};
  const group = {
    id: 'beachMainDialogue',
    ownerScene: 'beach',
    mode: 'conversation',
    scriptTargetId: 'beachMainDialogue',
    members: ['alex', 'vicky'],
    speakers: { alex: 'alex', vicky: 'vicky' },
    legacySpeakerOrder: ['alex', 'vicky'],
    inputLockMs: 200,
    camera: { policy: 'manual' }
  };
  const context = {
    isReconcilingScene: true,
    now: () => clock,
    manifest: { dialogueGroups: { beachMainDialogue: group } },
    textTargetRegistry: {
      targets: {
        beachMainDialogue: {
          targetId: 'beachMainDialogue',
          type: 'dialogueScript',
          field: 'beachMainTurns',
          speakers: ['alex', 'vicky'],
          maxTurns: 20,
          maxTurnChars: 500,
          maxChars: 5000
        }
      }
    },
    controllers: new Map([
      ['state', { source: 'live', get: () => state }],
      ['layout', { schedule: () => {} }]
    ])
  };
  const controller = new TextPortController(context);
  controller.activeSceneId = 'beach';
  const makePort = (id, queue) => ({
    object: { id, dialogueGroupId: 'beachMainDialogue' },
    element: createElement(),
    queue,
    index: 0,
    visible: false,
    sourceField: 'legacy',
    overrideText: '',
    hasShown: false
  });
  controller.ports.set('alex', makePort('alex', ['legacy A1', 'legacy A2']));
  controller.ports.set('vicky', makePort('vicky', ['legacy V1', 'legacy V2']));
  return {
    controller,
    state,
    advance(milliseconds = 200) {
      clock += milliseconds;
      return controller.nextDialogue('beachMainDialogue');
    }
  };
}

test('one conversation timeline preserves consecutive same-speaker turns then switches bubbles', () => {
  const { controller, advance } = createConversationHarness([
    { speaker: 'alex', text: 'A1' },
    { speaker: 'alex', text: 'A2' },
    { speaker: 'vicky', text: 'V1' }
  ]);
  const alex = controller.ports.get('alex');
  const vicky = controller.ports.get('vicky');

  assert.equal(advance(), true);
  assert.equal(alex.visible, true);
  assert.equal(alex.element.textContent, 'A1');
  assert.equal(vicky.visible, false);

  assert.equal(advance(), true);
  assert.equal(alex.visible, true);
  assert.equal(alex.element.textContent, 'A2');
  assert.equal(vicky.visible, false);

  assert.equal(advance(), true);
  assert.equal(alex.visible, false);
  assert.equal(vicky.visible, true);
  assert.equal(vicky.element.textContent, 'V1');
  assert.equal(controller.pendingRevealIds.size, 0);
});

test('conversation input lock ignores accidental double taps without skipping a turn', () => {
  const { controller, advance } = createConversationHarness([
    { speaker: 'alex', text: 'A1' },
    { speaker: 'vicky', text: 'V1' }
  ]);

  assert.equal(advance(), true);
  assert.equal(advance(50), false);
  assert.equal(controller.ports.get('alex').element.textContent, 'A1');
  assert.equal(advance(150), true);
  assert.equal(controller.ports.get('vicky').element.textContent, 'V1');
});

test('conversation completion closes both bubbles and the following tap restarts turn one', () => {
  const { controller, advance } = createConversationHarness([
    { speaker: 'alex', text: 'A1' },
    { speaker: 'vicky', text: 'V1' }
  ]);

  advance();
  advance();
  assert.equal(advance(), true);
  assert.equal(controller.ports.get('alex').visible, false);
  assert.equal(controller.ports.get('vicky').visible, false);

  assert.equal(advance(), true);
  assert.equal(controller.ports.get('alex').visible, true);
  assert.equal(controller.ports.get('alex').element.textContent, 'A1');
});

test('missing canonical dialogue state falls back to the two legacy queues in round-robin order', () => {
  const { controller, advance } = createConversationHarness();
  const shown = [];
  for (let index = 0; index < 4; index += 1) {
    advance();
    const active = [...controller.ports.values()].find((port) => port.visible);
    shown.push(active.element.textContent);
  }
  assert.deepEqual(shown, ['legacy A1', 'legacy V1', 'legacy A2', 'legacy V2']);
});
