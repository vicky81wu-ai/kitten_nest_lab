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

const SCENE_TARGET_ACTIONS = new Set(['scene.go', 'scene.push', 'scene.jumpTo']);
const SUPPORTED_EFFECT_TYPES = new Set(['sparkles', 'steam', 'clockHands']);

export function validateManifest(manifest, textTargetRegistry = null) {
  const errors = [];
  const warnings = [];

  if (manifest?.schemaVersion !== 'nest-manifest.v2') errors.push('schemaVersion must be nest-manifest.v2');
  if (manifest?.promoted !== false) errors.push('v2 preview manifest must keep promoted:false');

  const writePolicy = manifest?.rules?.stateWritesAllowed;
  const writeTargetIds = Array.isArray(writePolicy?.targetIds) ? writePolicy.targetIds : [];
  const allowedWriteTargets = new Set(writeTargetIds);
  if (writePolicy?.mode !== 'registeredTargetOnly' || !writeTargetIds.length) {
    errors.push('v2 state writes require a non-empty registeredTargetOnly allowlist');
  }
  if (allowedWriteTargets.size !== writeTargetIds.length) {
    errors.push('v2 state write targetIds must be unique');
  }
  const stateWrites = manifest?.runtime?.stateWrites;
  if (stateWrites?.endpoint !== '/api/set-state') {
    errors.push('v2 scoped writes must use the existing /api/set-state endpoint');
  }
  if (stateWrites?.authHeader !== 'X-Nest-Token') {
    errors.push('v2 scoped writes must use X-Nest-Token');
  }
  if (!Array.isArray(stateWrites?.tokenStorageKeys) || !stateWrites.tokenStorageKeys.length) {
    errors.push('v2 scoped writes require explicit local token storage keys');
  }

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

  const validateAction = (action, source) => {
    if (!action?.type) return;
    if (!supportedActions.has(action.type)) {
      errors.push(`${source} uses unsupported action ${action.type}`);
      return;
    }
    if (action.type === 'panel.open') {
      const target = objects[action.target];
      if (!target || target.kind !== 'panel') {
        errors.push(`${source} opens unknown panel ${action.target}`);
      }
    }
    if (SCENE_TARGET_ACTIONS.has(action.type) && !scenes[action.target]) {
      errors.push(`${source} navigates to unknown scene ${action.target}`);
    }
    if (action.type === 'text.toggleNext') {
      const target = objects[action.target];
      if (!target || target.kind !== 'textPort') {
        errors.push(`${source} advances unknown text port ${action.target}`);
      }
    }
    if (action.type === 'asset.toggle') {
      const keys = Array.isArray(action.keys) ? action.keys : [];
      if (!keys.length) errors.push(`${source} asset.toggle requires keys`);
      keys.forEach((key) => {
        if (!manifest?.assets?.[key]) errors.push(`${source} toggles unknown asset ${key}`);
      });
    }
  };

  writeTargetIds.forEach((targetId) => {
    if (!textTargetRegistry?.targets?.[targetId]) {
      errors.push(`State write allowlist references unregistered target ${targetId}`);
    }
  });

  if (!scenes[manifest?.runtime?.entryScene]) errors.push('runtime.entryScene must identify a scene');

  Object.entries(objects).forEach(([id, object]) => {
    if (object?.id !== id) errors.push(`Object key/id mismatch: ${id}`);
    if (!controllers[object?.controller]) errors.push(`Object ${id} references unknown controller ${object?.controller}`);
    if (object?.ownerScene !== '*' && !scenes[object?.ownerScene]) errors.push(`Object ${id} has unknown ownerScene ${object?.ownerScene}`);
    if (object?.ownerScene !== '*' && scenes[object?.ownerScene] && !scenes[object.ownerScene].objects?.includes(id)) {
      errors.push(`Object ${id} is absent from owner scene ${object.ownerScene}`);
    }
    validateAction(object?.action, `Object ${id}`);
    (object?.items || []).forEach((item, index) => {
      validateAction(item?.action, `Object ${id} item ${index}`);
    });
    if (object?.kind === 'effect' && !SUPPORTED_EFFECT_TYPES.has(object?.effect?.type)) {
      errors.push(`Effect ${id} uses unsupported type ${object?.effect?.type}`);
    }
    if (['hotspot', 'textPort', 'effect'].includes(object?.kind) && object?.mount !== 'existing' && !object?.coordinate) {
      errors.push(`Object ${id} requires a manifest coordinate`);
    }
    if (object?.coordinate) {
      const { x, y, width, height } = object.coordinate;
      if (!Number.isFinite(x) || x < 0 || x > 1 || !Number.isFinite(y) || y < 0 || y > 1) {
        errors.push(`Object ${id} coordinate x/y must stay within the base image`);
      }
      if (width !== undefined && (!Number.isFinite(width) || width <= 0 || width > 1)) {
        errors.push(`Object ${id} coordinate width must be within (0, 1]`);
      }
      if (height !== undefined && (!Number.isFinite(height) || height <= 0 || height > 1)) {
        errors.push(`Object ${id} coordinate height must be within (0, 1]`);
      }
    }
    if (object?.variant === 'memories') {
      const source = object.memorySource;
      if (source?.type !== 'legacyIndexedDbReadOnly') {
        errors.push(`Memories panel ${id} requires a read-only legacy source`);
      }
      if (!Array.isArray(source?.keys) || source.keys.length !== 6) {
        errors.push(`Memories panel ${id} requires six explicit photo keys`);
      }
    }
    if (object?.variant === 'notebookArchive') {
      const target = textTargetRegistry?.targets?.[object.targetId];
      if (!target || target.type !== 'note') {
        errors.push(`Notebook panel ${id} requires a registered note target`);
      } else {
        if (object.currentField !== target.field) {
          errors.push(`Notebook panel ${id} current field does not match ${object.targetId}`);
        }
        const archiveFields = Array.isArray(object.archiveFields) ? object.archiveFields : [];
        [target.archiveField, target.historyField].filter(Boolean).forEach((field) => {
          if (!archiveFields.includes(field)) {
            errors.push(`Notebook panel ${id} is missing registered archive field ${field}`);
          }
        });
        if (object.favoriteField !== target.favoriteField) {
          errors.push(`Notebook panel ${id} favorite field does not match ${object.targetId}`);
        }
        if (object.trashField !== target.trashField) {
          errors.push(`Notebook panel ${id} trash field does not match ${object.targetId}`);
        }
        if (object.maxChars !== target.maxChars) {
          errors.push(`Notebook panel ${id} maxChars does not match ${object.targetId}`);
        }
      }
      if (!allowedWriteTargets.has(object.targetId)) {
        errors.push(`Notebook panel ${id} target is not in the state write allowlist`);
      }
      if (object.writeMode !== 'archiveWithSoftDelete') {
        errors.push(`Notebook panel ${id} must use archiveWithSoftDelete`);
      }
      if (object.action) errors.push(`Notebook panel ${id} mutations must stay inside its panel session`);
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
      validateAction(action, `Scene ${sceneId} dock`);
    });
  });

  (manifest?.globalObjects || []).forEach((id) => {
    if (!objects[id]) errors.push(`Unknown global object ${id}`);
    else if (objects[id].ownerScene !== '*') errors.push(`Global object ${id} must use ownerScene:*`);
  });

  writeTargetIds.forEach((targetId) => {
    const owners = Object.values(objects).filter((object) => (
      object?.variant === 'notebookArchive'
      && object?.targetId === targetId
      && object?.writeMode === 'archiveWithSoftDelete'
    ));
    if (owners.length !== 1) {
      errors.push(`Writable target ${targetId} must have exactly one notebook panel owner`);
    }
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
