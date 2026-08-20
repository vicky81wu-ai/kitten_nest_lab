import { DOOR_TRANSITION_CALIBRATION } from './world-model.js';
import { DOOR_OCCLUSION_MODES } from './door-occlusion-controller.js';
import { claimActorControl, releaseActorControl } from './actor-motion.js';

const CONTROL_OWNER = 'doorTransition';

export class DoorTransitionController {
  constructor(options) {
    this.state = options.state;
    this.occlusion = options.occlusion;
    this.navigateNormal = options.navigateNormal;
    this.navigateExact = options.navigateExact;
    this.stopActor = options.stopActor;
    this.changeScene = options.changeScene;
    this.onError = options.onError || ((error) => console.error('[door-transition]', error));
    this.calibration = options.calibration || DOOR_TRANSITION_CALIBRATION;
    this.phase = 'idle';
    this.kittenReady = false;
    this.hubbyReady = false;
    this.switching = false;
  }

  get ready() {
    return Boolean(this.occlusion?.ready);
  }

  get active() {
    return this.phase !== 'idle';
  }

  get status() {
    return {
      phase: this.phase,
      ready: this.ready,
      kittenReady: this.kittenReady,
      hubbyReady: this.hubbyReady,
      maskBActive: this.occlusion?.snapshot().actors.player === DOOR_OCCLUSION_MODES.THROUGH_FRAME
    };
  }

  start() {
    if (!this.ready || this.active || this.state.doorTravel || this.state.princessCarry?.active) return false;
    const kittenClaimed = claimActorControl(this.state.player, CONTROL_OWNER);
    const hubbyClaimed = claimActorControl(this.state.hubby, CONTROL_OWNER);
    if (!kittenClaimed || !hubbyClaimed) {
      if (kittenClaimed) releaseActorControl(this.state.player, CONTROL_OWNER);
      if (hubbyClaimed) releaseActorControl(this.state.hubby, CONTROL_OWNER);
      return false;
    }
    this.state.doorTravel = true;
    this.kittenReady = false;
    this.hubbyReady = false;
    this.switching = false;
    if (this.state.scene.id === 'indoor') this.startIndoorExit();
    else this.startOutdoorExit();
    return true;
  }

  startIndoorExit() {
    const { kitten, hubby } = this.calibration.indoor;
    this.phase = 'exitBeforeB';
    this.navigateNormal(this.state.player, kitten.point1, () => {
      if (this.phase !== 'exitBeforeB') return;
      this.phase = 'exitB';
      this.occlusion.setActorMode('player', DOOR_OCCLUSION_MODES.THROUGH_FRAME);
      this.navigateExact(this.state.player, [kitten.point2], () => {
        this.kittenReady = true;
        this.completeExit('outdoor');
      }, { facing: 'segment' });
    }, { exactTarget: true, facing: 'segment' });
    this.navigateNormal(this.state.hubby, hubby.point, () => {
      this.hubbyReady = true;
      this.completeExit('outdoor');
    }, { exactTarget: true, facing: 'segment' });
  }

  startOutdoorExit() {
    const { kitten, hubby } = this.calibration.outdoor;
    this.phase = 'outdoorExit';
    this.navigateNormal(this.state.player, kitten.point, () => {
      this.kittenReady = true;
      this.completeExit('indoor');
    }, { exactTarget: true, facing: 'segment' });
    this.navigateNormal(this.state.hubby, hubby.point, () => {
      this.hubbyReady = true;
      this.completeExit('indoor');
    }, { exactTarget: true, facing: 'segment' });
  }

  async completeExit(nextScene) {
    if (!this.kittenReady || !this.hubbyReady || this.switching) return;
    this.switching = true;
    this.phase = 'switching';
    try {
      const changed = await this.changeScene(nextScene, {
        doorManaged: true,
        movementOwner: CONTROL_OWNER,
        beforeReveal: () => this.prepareArrival(nextScene)
      });
      if (!changed) throw new Error('Door scene change was already busy.');
      if (nextScene === 'indoor') this.beginIndoorArrival();
      else this.finish();
    } catch (error) {
      this.fail(error);
    }
  }

  prepareArrival(sceneName) {
    this.occlusion.clearActor('player');
    if (sceneName === 'outdoor') {
      Object.assign(this.state.player, this.calibration.outdoor.kitten.point);
      Object.assign(this.state.hubby, this.calibration.outdoor.hubby.point);
      return;
    }
    Object.assign(this.state.player, this.calibration.indoor.kitten.point2);
    Object.assign(this.state.hubby, this.calibration.indoor.hubby.point);
    this.occlusion.setActorMode('player', DOOR_OCCLUSION_MODES.THROUGH_FRAME);
  }

  beginIndoorArrival() {
    this.phase = 'arrivalB';
    this.navigateExact(this.state.player, [this.calibration.indoor.kitten.point1], () => {
      this.occlusion.clearActor('player');
      this.finish();
    }, { facing: 'segment' });
  }

  finish() {
    this.occlusion.clearActor('player');
    releaseActorControl(this.state.player, CONTROL_OWNER);
    releaseActorControl(this.state.hubby, CONTROL_OWNER);
    this.state.doorTravel = false;
    this.phase = 'idle';
    this.kittenReady = false;
    this.hubbyReady = false;
    this.switching = false;
  }

  fail(error) {
    this.stopActor(this.state.player);
    this.stopActor(this.state.hubby);
    this.occlusion.clearActor('player');
    releaseActorControl(this.state.player, CONTROL_OWNER);
    releaseActorControl(this.state.hubby, CONTROL_OWNER);
    this.state.doorTravel = false;
    this.phase = 'idle';
    this.kittenReady = false;
    this.hubbyReady = false;
    this.switching = false;
    this.onError(error);
  }
}
