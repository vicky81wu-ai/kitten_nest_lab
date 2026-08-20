import test from 'node:test';
import assert from 'node:assert/strict';
import { DoorAwayController } from '../../v2/nestward/door-away-controller.js';
import { DoorOcclusionController, DOOR_OCCLUSION_MODES } from '../../v2/nestward/door-occlusion-controller.js';

const actor = (id, extra = {}) => ({
  id,
  x: 500,
  z: .5,
  speed: id === 'naili' ? 126 : 182,
  path: [],
  action: null,
  mount: null,
  nextThink: 0,
  ...extra
});

function harness() {
  let clock = 0;
  const commands = [];
  const speech = [];
  const masks = { maskA: {}, maskB: {}, walk: {} };
  const occlusion = new DoorOcclusionController();
  occlusion.installMasks(masks);
  const state = {
    scene: { id: 'indoor' },
    doorTravel: false,
    princessCarry: { active: false },
    hubby: actor('hubby', { follow: true }),
    naili: actor('naili', { summoned: true, carried: false })
  };
  const navigate = (kind) => (movingActor, target, afterMove, options) => {
    commands.push({ kind, actor: movingActor.id, target, afterMove, options });
    return target;
  };
  const controller = new DoorAwayController({
    state,
    occlusion,
    planner: {
      ready: true,
      randomPath: () => [],
      pathToAnchor: () => [{ x: 1507, z: .20824666969097821 }]
    },
    navigateNormal: navigate('normal'),
    navigateExact: navigate('exact'),
    stopActor: (movingActor) => { movingActor.path.length = 0; },
    say: (...args) => speech.push(args),
    now: () => clock,
    random: () => .5
  });
  return {
    controller,
    state,
    commands,
    speech,
    occlusion,
    setClock(value) { clock = value; }
  };
}

const run = (commands, index) => commands[index].afterMove();

test('Door Away sends Naili first, waits two seconds, then sends Hubby', () => {
  const h = harness();
  assert.equal(h.controller.start(), true);
  assert.deepEqual(h.commands.map(({ kind, actor }) => [kind, actor]), [['normal', 'naili']]);
  assert.equal(h.state.hubby.follow, false);
  assert.equal(h.state.naili.summoned, false);
  assert.equal(h.state.hubby.controlOwner, 'doorAway');
  assert.equal(h.state.naili.controlOwner, 'doorAway');
  assert.equal(h.speech[0][0], '小猫，我去溜奶栗。');

  run(h.commands, 0);
  assert.equal(h.controller.status.phase, 'nailiLeaving');
  assert.equal(h.occlusion.snapshot().actors.naili, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  run(h.commands, 1);
  assert.equal(h.controller.status.phase, 'companionDelay');
  assert.equal(h.occlusion.snapshot().actors.naili, DOOR_OCCLUSION_MODES.OUTSIDE);

  h.setClock(1.99);
  h.controller.tick(1.99);
  assert.equal(h.commands.length, 2, 'Hubby must not leave early');
  h.setClock(2);
  h.controller.tick(2);
  assert.deepEqual(h.commands.at(-1).actor, 'hubby');
  assert.equal(h.commands.at(-1).kind, 'normal');

  run(h.commands, 2);
  assert.equal(h.occlusion.snapshot().actors.hubby, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  run(h.commands, 3);
  assert.equal(h.controller.status.phase, 'outside');
  assert.equal(h.occlusion.snapshot().actors.hubby, DOOR_OCCLUSION_MODES.OUTSIDE);

  h.setClock(90);
  h.controller.tick(90);
  assert.equal(h.controller.status.phase, 'outside', 'Door Away must never auto-return');
  assert.equal(h.controller.blocksDoor({ id: 'door' }), true);
  assert.equal(h.controller.blocksDoor({ id: 'sofa' }), false);
  assert.equal(h.controller.speechScriptFor(h.state.hubby), 'hubby.doorAway');
  assert.equal(h.controller.speechScriptFor(h.state.naili), 'naili.doorAway');
});

test('Door Away recall returns Naili first and restores both actors after Hubby', () => {
  const h = harness();
  h.controller.start();
  run(h.commands, 0);
  run(h.commands, 1);
  h.setClock(2);
  h.controller.tick(2);
  run(h.commands, 2);
  run(h.commands, 3);

  assert.equal(h.controller.recall(), true);
  assert.equal(h.commands.at(-1).kind, 'exact');
  assert.equal(h.commands.at(-1).actor, 'naili');
  run(h.commands, 4);
  assert.equal(h.occlusion.snapshot().actors.naili, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  run(h.commands, 5);
  assert.equal(h.controller.status.phase, 'nailiReturningIndoor');
  assert.equal(h.occlusion.snapshot().actors.naili, undefined);
  assert.deepEqual(h.commands.at(-1).target, { x: 1220, z: .48 }, 'Naili clears the threshold before Hubby returns');
  assert.notDeepEqual(h.commands.at(-1).target, { x: 1337, z: .13283289537879497 });
  run(h.commands, 6);
  assert.equal(h.controller.status.phase, 'hubbyRecallDelay');

  h.setClock(3.99);
  h.controller.tick(3.99);
  assert.equal(h.commands.length, 7);
  h.setClock(4);
  h.controller.tick(4);
  assert.equal(h.commands.at(-1).kind, 'exact');
  assert.equal(h.commands.at(-1).actor, 'hubby');
  run(h.commands, 7);
  assert.equal(h.occlusion.snapshot().actors.hubby, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  run(h.commands, 8);

  assert.equal(h.controller.status.phase, 'idle');
  assert.deepEqual(h.occlusion.snapshot().actors, {});
  assert.equal(h.state.hubby.follow, true);
  assert.equal(h.state.naili.summoned, true);
  assert.equal(h.state.hubby.controlOwner, null);
  assert.equal(h.state.naili.controlOwner, null);
  assert.equal(h.controller.blocksDoor({ id: 'door' }), false);
});

test('Door Away cannot start during a normal scene transition', () => {
  const h = harness();
  h.state.doorTravel = true;
  assert.equal(h.controller.start(), false);
  assert.equal(h.commands.length, 0);
});

test('Door Away wander keeps endpoints apart even while the companion is moving', () => {
  const h = harness();
  h.controller.phase = 'outside';
  h.controller.actorPhases.hubby = 'outside';
  h.controller.actorPhases.naili = 'outside';
  h.state.naili.path = [{ x: 100, z: .5 }];
  const candidates = [
    [{ x: 105, z: .5 }],
    [{ x: 260, z: .5 }]
  ];
  h.controller.planner.randomPath = () => candidates.shift() || [];

  const selected = h.controller.chooseSeparatedPath(h.state.hubby);
  assert.deepEqual(selected, [{ x: 260, z: .5 }]);
});
