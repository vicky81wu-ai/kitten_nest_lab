import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigationState, reduceNavigation } from '../../v2/runtime/core/navigation.mjs';

const scenes = {
  home: { id: 'home', parent: null },
  coffeeCorner: { id: 'coffeeCorner', parent: null },
  lapClose: { id: 'lapClose', parent: 'coffeeCorner' }
};

test('go, push, and back preserve one scene stack owner', () => {
  let state = createNavigationState('home');
  state = reduceNavigation(state, { type: 'scene.go', target: 'coffeeCorner' }, scenes);
  assert.deepEqual(state, { current: 'coffeeCorner', stack: [] });
  state = reduceNavigation(state, { type: 'scene.push', target: 'lapClose' }, scenes);
  assert.deepEqual(state, { current: 'lapClose', stack: ['coffeeCorner'] });
  state = reduceNavigation(state, { type: 'scene.back' }, scenes);
  assert.deepEqual(state, { current: 'coffeeCorner', stack: [] });
});

test('jumpTo clears nested history', () => {
  const state = reduceNavigation(
    { current: 'lapClose', stack: ['home', 'coffeeCorner'] },
    { type: 'scene.jumpTo', target: 'home' },
    scenes
  );
  assert.deepEqual(state, { current: 'home', stack: [] });
});
