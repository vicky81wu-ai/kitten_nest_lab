import test from 'node:test';
import assert from 'node:assert/strict';
import { DoorTransitionController } from '../../v2/nestward/door-transition-controller.js';
import { DoorOcclusionController, DOOR_OCCLUSION_MODES } from '../../v2/nestward/door-occlusion-controller.js';
import { DOOR_TRANSITION_CALIBRATION } from '../../v2/nestward/world-model.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

function harness(sceneId = 'indoor') {
  const commands = [];
  const occlusion = new DoorOcclusionController();
  occlusion.installMasks({ maskA: {}, maskB: {}, walk: {} });
  const state = {
    scene: { id: sceneId },
    doorTravel: false,
    princessCarry: { active: false },
    player: { id: 'player', x: 500, z: .5 },
    hubby: { id: 'hubby', x: 600, z: .5 }
  };
  const navigate = (kind) => (movingActor, target, afterMove, options) => {
    commands.push({ kind, actor: movingActor.id, target, afterMove, options });
  };
  const changeScene = async (nextScene, options) => {
    state.scene = { id: nextScene };
    await options.beforeReveal();
    return true;
  };
  const controller = new DoorTransitionController({
    state,
    occlusion,
    navigateNormal: navigate('normal'),
    navigateExact: navigate('exact'),
    stopActor: () => {},
    changeScene
  });
  return { controller, state, commands, occlusion };
}

test('indoor exit enables B only after Kitten reaches point1', async () => {
  const h = harness('indoor');
  assert.equal(h.controller.start(), true);
  assert.equal(h.controller.status.phase, 'exitBeforeB');
  assert.equal(h.state.player.controlOwner, 'doorTransition');
  assert.equal(h.state.hubby.controlOwner, 'doorTransition');
  assert.deepEqual(h.commands[0].target, DOOR_TRANSITION_CALIBRATION.indoor.kitten.point1);
  assert.deepEqual(h.commands[1].target, DOOR_TRANSITION_CALIBRATION.indoor.hubby.point);
  assert.equal(h.occlusion.snapshot().actors.player, undefined);

  h.commands[0].afterMove();
  assert.equal(h.controller.status.phase, 'exitB');
  assert.equal(h.occlusion.snapshot().actors.player, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  assert.deepEqual(h.commands[2].target, [DOOR_TRANSITION_CALIBRATION.indoor.kitten.point2]);

  h.commands[2].afterMove();
  assert.equal(h.state.scene.id, 'indoor', 'the scene waits for Hubby at his own calibrated point');
  h.commands[1].afterMove();
  await flush();

  assert.equal(h.state.scene.id, 'outdoor');
  assert.deepEqual(
    { x: h.state.player.x, z: h.state.player.z },
    DOOR_TRANSITION_CALIBRATION.outdoor.kitten.point
  );
  assert.deepEqual(
    { x: h.state.hubby.x, z: h.state.hubby.z },
    DOOR_TRANSITION_CALIBRATION.outdoor.hubby.point
  );
  assert.equal(h.controller.status.phase, 'idle');
  assert.equal(h.state.doorTravel, false);
  assert.equal(h.state.player.controlOwner, null);
  assert.equal(h.state.hubby.controlOwner, null);
  assert.equal(h.occlusion.snapshot().actors.player, undefined);
});

test('indoor arrival reveals Kitten at point2 under B and clears B at point1', async () => {
  const h = harness('outdoor');
  h.controller.start();
  assert.deepEqual(h.commands[0].target, DOOR_TRANSITION_CALIBRATION.outdoor.kitten.point);
  assert.deepEqual(h.commands[1].target, DOOR_TRANSITION_CALIBRATION.outdoor.hubby.point);
  h.commands[0].afterMove();
  h.commands[1].afterMove();
  await flush();

  assert.equal(h.state.scene.id, 'indoor');
  assert.equal(h.controller.status.phase, 'arrivalB');
  assert.equal(h.occlusion.snapshot().actors.player, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  assert.deepEqual(
    { x: h.state.player.x, z: h.state.player.z },
    DOOR_TRANSITION_CALIBRATION.indoor.kitten.point2
  );
  assert.deepEqual(h.commands[2].target, [DOOR_TRANSITION_CALIBRATION.indoor.kitten.point1]);

  h.commands[2].afterMove();
  assert.equal(h.controller.status.phase, 'idle');
  assert.equal(h.state.doorTravel, false);
  assert.equal(h.occlusion.snapshot().actors.player, undefined);
});

test('a busy scene switch fails back to an unmasked interactive state', async () => {
  const h = harness('indoor');
  h.controller.changeScene = async () => false;
  h.controller.onError = () => {};
  h.controller.start();
  h.commands[0].afterMove();
  h.commands[2].afterMove();
  h.commands[1].afterMove();
  await flush();

  assert.equal(h.controller.status.phase, 'idle');
  assert.equal(h.state.doorTravel, false);
  assert.equal(h.occlusion.snapshot().actors.player, undefined);
});
