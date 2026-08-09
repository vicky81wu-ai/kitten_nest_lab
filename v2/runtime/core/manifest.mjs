import { CONTROLLER_LIFECYCLE } from './contracts.mjs';

const REQUIRED_CONTROLLERS = [
  'state',
  'asset',
  'sceneRuntime',
  'layout',
  'hotspot',
  'textPort',
  'panel',
  'effect'
];

export function validateManifest(manifest, textTargetRegistry = null) {
  const errors = [];
  const warnings = [];

  if (manifest?.schemaVersion !== 'nest-manifest.v2') errors.push('schemaVersion must be nest-manifest.v2');
  if (manifest?.promoted !== false) errors.push('v2 preview manifest must keep promoted:false');
  if (manifest?.rules?.stateWritesAllowed !== false) errors.push('v2 preview must keep stateWritesAllowed:false');

  const controllers = manifest?.controllers || {};
  REQUIRED_CONTROLLERS.forEach((id) => {
    const card = controllers[id];
    if (!card) {
      errors.push(`Missing controller card: ${id}`);
      return;
    }
    const lifecycle = Array.isArray(card.lifecycle) ? card.lifecycle : [];
    CONTROLLER_LIFECYCLE.forEach((method) => {
      if (!lifecycle.includes(method)) errors.push(`Controller ${id} missing lifecycle contract ${method}`);
    });
  });

  const scenes = manifest?.scenes || {};
  const objects = manifest?.objects || {};
  const supportedActions = new Set(manifest?.runtime?.supportedActionTypes || []);
  const activeSelectors = new Map();

  if (!scenes[manifest?.runtime?.entryScene]) errors.push('runtime.entryScene must identify a scene');

  Object.entries(objects).forEach(([id, object]) => {
    if (object?.id !== id) errors.push(`Object key/id mismatch: ${id}`);
    if (!controllers[object?.controller]) errors.push(`Object ${id} references unknown controller ${object?.controller}`);
    if (object?.ownerScene !== '*' && !scenes[object?.ownerScene]) errors.push(`Object ${id} has unknown ownerScene ${object?.ownerScene}`);
    if (object?.action?.type && !supportedActions.has(object.action.type)) {
      errors.push(`Object ${id} uses unsupported action ${object.action.type}`);
    }
    if (object?.coordinate && object.coordinateStatus !== 'baseImageLocked' && !String(object.coordinateStatus || '').startsWith('candidate')) {
      warnings.push(`Object ${id} has coordinates without a recognized coordinateStatus`);
    }
    if (object?.exclusive && object?.runtimeStatus !== 'deprecated' && object?.selector) {
      const other = activeSelectors.get(object.selector);
      if (other) errors.push(`Exclusive selector collision: ${object.selector} (${other}, ${id})`);
      activeSelectors.set(object.selector, id);
    }
    if (object?.kind === 'textPort' && textTargetRegistry) {
      const targets = textTargetRegistry.targets || {};
      if (object.staticText) {
        if (!Array.isArray(object.fallbackQueue) || !object.fallbackQueue.length) {
          errors.push(`Static TextPort ${id} requires a non-empty fallbackQueue`);
        }
      } else if (!targets[object.targetId]) {
        errors.push(`TextPort ${id} references unregistered targetId ${object.targetId}`);
      }
    }
  });

  Object.entries(scenes).forEach(([sceneId, scene]) => {
    if (scene?.id !== sceneId) errors.push(`Scene key/id mismatch: ${sceneId}`);
    if (scene?.presentation && !['cover', 'panorama'].includes(scene.presentation)) {
      errors.push(`Scene ${sceneId} uses unsupported presentation ${scene.presentation}`);
    }
    if (!manifest?.assets?.[scene?.assetKey]) errors.push(`Scene ${sceneId} references unknown asset ${scene?.assetKey}`);
    (scene?.objects || []).forEach((objectId) => {
      const object = objects[objectId];
      if (!object) errors.push(`Scene ${sceneId} references unknown object ${objectId}`);
      else if (object.ownerScene !== sceneId) errors.push(`Scene ${sceneId} lists ${objectId}, owned by ${object.ownerScene}`);
    });
    if (scene?.parent && !scenes[scene.parent]) errors.push(`Scene ${sceneId} has unknown parent ${scene.parent}`);
    if (scene?.blocksParentInteractive && scene?.parent) {
      const parentObjects = new Set(scenes[scene.parent]?.objects || []);
      const leaked = (scene.objects || []).filter((id) => parentObjects.has(id));
      if (leaked.length) errors.push(`Child scene ${sceneId} leaks parent objects: ${leaked.join(', ')}`);
    }
    Object.values(scene?.docks || {}).filter(Boolean).forEach((action) => {
      if (!supportedActions.has(action.type)) errors.push(`Scene ${sceneId} dock uses unsupported action ${action.type}`);
    });
  });

  (manifest?.globalObjects || []).forEach((id) => {
    if (!objects[id]) errors.push(`Unknown global object ${id}`);
    else if (objects[id].ownerScene !== '*') errors.push(`Global object ${id} must use ownerScene:*`);
  });

  const reconcileOrder = manifest?.runtime?.reconcileOrder || [];
  reconcileOrder.forEach((id) => {
    if (!controllers[id]) errors.push(`Unknown controller in reconcileOrder: ${id}`);
  });

  return { ok: errors.length === 0, errors, warnings };
}

export function assertManifest(manifest, textTargetRegistry = null) {
  const result = validateManifest(manifest, textTargetRegistry);
  if (!result.ok) throw new Error(`Invalid v2 manifest:\n- ${result.errors.join('\n- ')}`);
  return result;
}
