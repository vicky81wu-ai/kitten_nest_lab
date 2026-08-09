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
