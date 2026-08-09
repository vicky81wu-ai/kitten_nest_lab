export function createNavigationState(entryScene) {
  return { current: entryScene, stack: [] };
}

export function reduceNavigation(state, action, scenes) {
  const current = state?.current;
  const stack = Array.isArray(state?.stack) ? [...state.stack] : [];
  const type = action?.type;

  if (type === 'scene.back') {
    const parent = scenes?.[current]?.parent || null;
    const target = stack.length ? stack.pop() : parent;
    if (!target || !scenes?.[target]) return { current, stack };
    return { current: target, stack };
  }

  const target = action?.target;
  if (!target || !scenes?.[target]) {
    throw new Error(`Unknown scene target: ${String(target || '')}`);
  }

  if (type === 'scene.push') {
    return { current: target, stack: [...stack, current] };
  }

  if (type === 'scene.jumpTo') {
    return { current: target, stack: [] };
  }

  if (type === 'scene.go') {
    return { current: target, stack };
  }

  throw new Error(`Unsupported navigation action: ${String(type || '')}`);
}
