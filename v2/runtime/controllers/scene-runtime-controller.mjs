import { BaseController } from '../core/base-controller.mjs';
import { createNavigationState, reduceNavigation } from '../core/navigation.mjs';

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class SceneRuntimeController extends BaseController {
  constructor(context) {
    super('sceneRuntime', context);
    this.navigation = createNavigationState(context.manifest.runtime.entryScene);
    this.locked = false;
    this.initialized = false;
  }

  async mount() {
    await super.mount();
    this.stage = this.context.elements.stage;
    document.body.dataset.sceneId = this.navigation.current;
  }

  async ready() {
    await this.enter(this.navigation, { type: 'scene.jumpTo', target: this.navigation.current }, true);
    this.mark('ready', this.navigation.current);
  }

  snapshot() {
    const scene = this.context.manifest.scenes[this.navigation.current];
    const allowedObjectIds = [
      ...this.context.manifest.globalObjects,
      ...(scene.objects || [])
    ];
    return {
      sceneId: scene.id,
      scene,
      stack: [...this.navigation.stack],
      allowedObjectIds
    };
  }

  async navigate(action) {
    if (action?.type === 'scene.dock') {
      const scene = this.context.manifest.scenes[this.navigation.current];
      const dockAction = scene?.docks?.[action.side] || null;
      if (!dockAction) return false;
      return this.navigate(dockAction);
    }
    if (this.locked) return false;
    const next = reduceNavigation(this.navigation, action, this.context.manifest.scenes);
    if (next.current === this.navigation.current && this.initialized) return false;
    return this.enter(next, action, false);
  }

  async enter(nextNavigation, action, initial) {
    if (this.locked) return false;
    this.locked = true;
    const previous = this.navigation.current;
    const nextScene = this.context.manifest.scenes[nextNavigation.current];
    this.stage.dataset.transitioning = '1';
    document.body.dataset.sceneLocked = '1';
    this.context.events.emit('scene:willChange', {
      previous,
      next: nextScene.id,
      action,
      initial
    });

    try {
      await this.context.controllers.get('panel').suspend('scene-change');
      await this.context.controllers.get('effect').suspend('scene-change');
      if (!initial) await wait(100);
      const assetResult = await this.context.controllers.get('asset').loadForScene(nextScene);
      this.navigation = nextNavigation;
      this.initialized = true;
      document.body.dataset.sceneId = nextScene.id;
      this.stage.dataset.sceneId = nextScene.id;
      this.stage.dataset.assetResult = assetResult.ok ? 'ready' : 'error';
      const snapshot = this.snapshot();
      this.context.currentSnapshot = snapshot;
      await this.context.reconcileScene(snapshot);
      this.context.events.emit('scene:didChange', snapshot);
      await wait(80);
      this.mark('ready', nextScene.id);
      return true;
    } catch (error) {
      this.mark('error', error.message);
      this.context.reportError('scene-transition', error);
      return false;
    } finally {
      this.locked = false;
      this.stage.dataset.transitioning = '0';
      document.body.dataset.sceneLocked = '0';
    }
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
  }

  async suspend(reason = 'suspend') {
    this.locked = true;
    this.mark('suspended', reason);
  }

  async destroy() {
    this.locked = true;
    await super.destroy();
  }
}
