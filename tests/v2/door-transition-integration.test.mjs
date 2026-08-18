import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES } from '../../v2/nestward/world-model.js';
import {
  DOOR_TRANSITION_ACCEPTED,
  applyDoorTransitionAnchors
} from '../../v2/nestward/door-transition-integration.js';

test('accepted door transition anchors are applied without changing carry anchors or hotspots', () => {
  const carryIndoor = { ...SCENES.indoor.doorway.carryAnchor };
  const carryOutdoor = { ...SCENES.outdoor.doorway.carryAnchor };
  const indoorHotspot = JSON.stringify(SCENES.indoor.doorway.hotspot);
  const outdoorHotspot = JSON.stringify(SCENES.outdoor.doorway.hotspot);

  applyDoorTransitionAnchors();

  assert.deepEqual(SCENES.indoor.doorway.kittenB, DOOR_TRANSITION_ACCEPTED.indoor.kitten.point1);
  assert.deepEqual(SCENES.indoor.doorway.kittenA, DOOR_TRANSITION_ACCEPTED.indoor.kitten.point2);
  assert.deepEqual(SCENES.indoor.doorway.hubbyExit, DOOR_TRANSITION_ACCEPTED.indoor.hubby.point);
  assert.deepEqual(SCENES.indoor.doorway.hubbyArrival, DOOR_TRANSITION_ACCEPTED.indoor.hubby.point);
  assert.deepEqual(SCENES.outdoor.doorway.kittenAnchor, DOOR_TRANSITION_ACCEPTED.outdoor.kitten.point);
  assert.deepEqual(SCENES.outdoor.doorway.hubbyEntry, DOOR_TRANSITION_ACCEPTED.outdoor.hubby.point);
  assert.deepEqual(SCENES.outdoor.doorway.hubbyReturn, DOOR_TRANSITION_ACCEPTED.outdoor.hubby.point);
  assert.deepEqual(SCENES.indoor.entry.fromOutdoor.player, DOOR_TRANSITION_ACCEPTED.indoor.kitten.point2);
  assert.deepEqual(SCENES.indoor.entry.fromOutdoor.hubby, DOOR_TRANSITION_ACCEPTED.indoor.hubby.point);
  assert.deepEqual(SCENES.outdoor.entry.fromIndoor.player, DOOR_TRANSITION_ACCEPTED.outdoor.kitten.point);
  assert.deepEqual(SCENES.outdoor.entry.fromIndoor.hubby, DOOR_TRANSITION_ACCEPTED.outdoor.hubby.point);

  assert.deepEqual(SCENES.indoor.doorway.carryAnchor, carryIndoor);
  assert.deepEqual(SCENES.outdoor.doorway.carryAnchor, carryOutdoor);
  assert.equal(JSON.stringify(SCENES.indoor.doorway.hotspot), indoorHotspot);
  assert.equal(JSON.stringify(SCENES.outdoor.doorway.hotspot), outdoorHotspot);
});
