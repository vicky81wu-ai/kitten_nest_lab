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

test('the three beach scenes use the same push/back stack owner', () => {
  const beachScenes = {
    coffeeCorner: { id: 'coffeeCorner', parent: null },
    handhold: { id: 'handhold', parent: 'coffeeCorner' },
    bracelet: { id: 'bracelet', parent: 'handhold' },
    stall: { id: 'stall', parent: 'bracelet' }
  };
  let state = createNavigationState('coffeeCorner');
  state = reduceNavigation(state, { type: 'scene.push', target: 'handhold' }, beachScenes);
  state = reduceNavigation(state, { type: 'scene.push', target: 'bracelet' }, beachScenes);
  state = reduceNavigation(state, { type: 'scene.push', target: 'stall' }, beachScenes);
  assert.deepEqual(state, { current: 'stall', stack: ['coffeeCorner', 'handhold', 'bracelet'] });
  state = reduceNavigation(state, { type: 'scene.back' }, beachScenes);
  state = reduceNavigation(state, { type: 'scene.back' }, beachScenes);
  state = reduceNavigation(state, { type: 'scene.back' }, beachScenes);
  assert.deepEqual(state, { current: 'coffeeCorner', stack: [] });
});
