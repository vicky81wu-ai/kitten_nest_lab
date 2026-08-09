import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTextPortState } from '../../v2/runtime/core/text-state.mjs';

const object = {
  readFields: {
    queue: ['coffeeCornerBubbles', 'alexBubbles'],
    single: ['coffeeCornerBubble', 'alexBubble'],
    index: ['coffeeCornerBubbleIndex', 'bubbleIndex']
  }
};

test('canonical text fields win over migration fallback fields', () => {
  const resolved = resolveTextPortState({
    coffeeCornerBubbles: ['canonical one', 'canonical two'],
    coffeeCornerBubbleIndex: 1,
    alexBubbles: ['legacy']
  }, object);
  assert.deepEqual(resolved.queue, ['canonical one', 'canonical two']);
  assert.equal(resolved.index, 1);
  assert.equal(resolved.sourceField, 'coffeeCornerBubbles');
});

test('migration fallback remains readable without becoming a second owner', () => {
  const resolved = resolveTextPortState({ alexBubbles: ['legacy'], bubbleIndex: 0 }, object);
  assert.deepEqual(resolved.queue, ['legacy']);
  assert.equal(resolved.sourceField, 'alexBubbles');
});
