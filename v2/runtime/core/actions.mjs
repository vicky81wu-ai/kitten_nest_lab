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

  throw new Error(`Unsupported action: ${type}`);
}
