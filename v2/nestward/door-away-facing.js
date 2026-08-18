import { WorldRenderer } from './world-renderer.js';

const previousRender = WorldRenderer.prototype.render;

export function installDoorAwayFacingSync() {
  WorldRenderer.prototype.render = function doorAwayFacingRender(state, time) {
    const hubby = state?.hubby;
    const doorAway = globalThis.__NW_DOOR_AWAY__?.status;
    if (hubby && doorAway && doorAway.phase !== 'idle' && hubby.path?.length) {
      const next = hubby.path[0];
      const dx = Number(next?.x) - Number(hubby.x);
      if (Math.abs(dx) > 3) hubby.dir = dx > 0 ? 1 : -1;
      // Door-away multi-node paths must not keep the direction captured at path start.
      if (hubby.path.length > 1) hubby.travelDir = null;
    }
    return previousRender.call(this, state, time);
  };
}
