import { StateController } from './state-controller.mjs';
import { AssetController } from './asset-controller.mjs';
import { SceneRuntimeController } from './scene-runtime-controller.mjs';
import { LayoutController } from './layout-controller.mjs';
import { HotspotController } from './hotspot-controller.mjs';
import { TextPortController } from './text-port-controller.mjs';
import { PanelController } from './panel-controller.mjs';
import { EffectController } from './effect-controller.mjs';

export function createControllers(context) {
  return new Map([
    ['state', new StateController(context)],
    ['asset', new AssetController(context)],
    ['sceneRuntime', new SceneRuntimeController(context)],
    ['layout', new LayoutController(context)],
    ['hotspot', new HotspotController(context)],
    ['textPort', new TextPortController(context)],
    ['panel', new PanelController(context)],
    ['effect', new EffectController(context)]
  ]);
}
