import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimActorControl,
  releaseActorControl,
  setActorRoute,
  stopActorRoute,
  updateActorRoute
} from '../../v2/nestward/actor-motion.js';

const actorAtOrigin = () => ({
  x: 0,
  z: 0,
  speed: 10,
  path: [],
  afterMove: null,
  walking: false,
  step: 0,
  dir: 1,
  travelDir: null,
  routeFacing: null
});

test('exact door routes update facing at every path segment', () => {
  const actor = actorAtOrigin();
  let completed = 0;
  setActorRoute(actor, [{ x: 10, z: 0 }, { x: -10, z: 0 }], () => { completed += 1; }, { facing: 'segment' });

  assert.equal(actor.dir, 1);
  updateActorRoute(actor, 1);
  assert.deepEqual({ x: actor.x, z: actor.z }, { x: 10, z: 0 });
  assert.equal(actor.dir, -1, 'the next leftward segment must flip the actor immediately');

  updateActorRoute(actor, 2);
  assert.deepEqual({ x: actor.x, z: actor.z }, { x: -10, z: 0 });
  assert.equal(actor.dir, -1);
  assert.equal(completed, 1);
  assert.equal(actor.routeFacing, null);
});

test('ordinary journeys preserve their initial horizontal facing', () => {
  const actor = actorAtOrigin();
  setActorRoute(actor, [{ x: -10, z: 0 }, { x: 30, z: 0 }]);
  updateActorRoute(actor, 1);
  assert.equal(actor.dir, 1, 'normal A* movement retains the accepted journey-facing behavior');
});

test('ordinary near-vertical journeys keep the accepted direction thresholds', () => {
  const actor = actorAtOrigin();
  actor.dir = -1;
  setActorRoute(actor, [{ x: 12, z: .1 }], null, { journeyDirection: null });
  assert.equal(actor.dir, -1);
  updateActorRoute(actor, .1);
  assert.equal(actor.dir, -1, 'a sub-18 world-unit segment must not flip an ordinary actor');
});

test('stopping a route clears its transient movement state', () => {
  const actor = actorAtOrigin();
  setActorRoute(actor, [{ x: 20, z: 0 }], () => {});
  stopActorRoute(actor);
  assert.deepEqual(actor.path, []);
  assert.equal(actor.walking, false);
  assert.equal(actor.afterMove, null);
  assert.equal(actor.travelDir, null);
  assert.equal(actor.routeFacing, null);
});

test('exclusive actor control prevents furniture or ambient routes from stealing a Door actor', () => {
  const actor = actorAtOrigin();
  assert.equal(claimActorControl(actor, 'doorAway'), true);
  assert.deepEqual(setActorRoute(actor, [{ x: 50, z: 0 }]), []);
  assert.deepEqual(actor.path, []);
  assert.equal(stopActorRoute(actor), false);

  assert.deepEqual(setActorRoute(actor, [{ x: 50, z: 0 }], null, { owner: 'doorAway' }), [{ x: 50, z: 0 }]);
  assert.equal(releaseActorControl(actor, 'world'), false);
  assert.equal(releaseActorControl(actor, 'doorAway'), true);
  assert.equal(actor.controlOwner, null);
});
