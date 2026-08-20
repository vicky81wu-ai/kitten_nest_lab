export const DOOR_OCCLUSION_MODES = Object.freeze({
  THROUGH_FRAME: 'through-frame',
  OUTSIDE: 'outside'
});

export class DoorOcclusionController {
  constructor() {
    this.masks = null;
    this.actorModes = new Map();
  }

  get ready() {
    return Boolean(this.masks?.maskA && this.masks?.maskB && this.masks?.walk);
  }

  installMasks(masks) {
    if (!masks?.maskA || !masks?.maskB || !masks?.walk) {
      throw new Error('Door occlusion requires baked maskA, maskB, and walk assets.');
    }
    this.masks = masks;
  }

  setActorMode(actorId, mode) {
    if (!mode) {
      this.actorModes.delete(actorId);
      return;
    }
    if (!this.ready) throw new Error('Door occlusion assets are not ready.');
    if (!Object.values(DOOR_OCCLUSION_MODES).includes(mode)) {
      throw new Error(`Unsupported door occlusion mode: ${mode}`);
    }
    this.actorModes.set(actorId, mode);
  }

  clearActor(actorId) {
    this.actorModes.delete(actorId);
  }

  clearAll() {
    this.actorModes.clear();
  }

  effectFor(state, actor) {
    if (!this.ready || state.scene.id !== 'indoor') return null;
    const mode = this.actorModes.get(actor.id);
    if (mode === DOOR_OCCLUSION_MODES.THROUGH_FRAME) {
      return { operation: 'exclude', mask: this.masks.maskB, owner: 'doorOcclusionController' };
    }
    if (mode === DOOR_OCCLUSION_MODES.OUTSIDE) {
      return { operation: 'include', mask: this.masks.maskA, owner: 'doorOcclusionController' };
    }
    return null;
  }

  snapshot() {
    return {
      ready: this.ready,
      actors: Object.fromEntries(this.actorModes)
    };
  }
}
