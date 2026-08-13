export async function dispatchAction(context, action) {
  const type = action?.type;
  if (!type) throw new Error('Action type is required');

  if (type.startsWith('scene.')) {
    return context.controllers.get('sceneRuntime').navigate(action);
  }
  if (type === 'asset.toggle') {
    return context.controllers.get('asset').toggle(action);
  }
  if (type === 'text.toggleNext') {
    return context.controllers.get('textPort').toggleNext(action.target);
  }
  if (type === 'dialogue.next') {
    return context.controllers.get('textPort').nextDialogue(action.target);
  }
  if (type === 'text.hide') {
    return context.controllers.get('textPort').hide(action.target);
  }
  if (type === 'panel.open') {
    return context.controllers.get('panel').open(action.target);
  }
  if (type === 'panel.close') {
    return context.controllers.get('panel').close();
  }
  if (type === 'route.open') {
    const route = resolveSameOriginRoute(action.target);
    globalThis.location.assign(route);
    return route;
  }

  throw new Error(`Unsupported action: ${type}`);
}

export function resolveSameOriginRoute(target, baseHref = globalThis.location?.href) {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    throw new Error('route.open requires a same-origin absolute path');
  }
  if (!baseHref) throw new Error('route.open requires a browser location');
  const base = new URL(baseHref);
  const url = new URL(target, base);
  if (url.origin !== base.origin) throw new Error('route.open cannot leave the current origin');
  return `${url.pathname}${url.search}${url.hash}`;
}
