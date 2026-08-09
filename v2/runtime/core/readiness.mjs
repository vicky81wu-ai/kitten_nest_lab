export async function runReadyLifecycle(controllers, readyOrder = [], backgroundIds = []) {
  const background = new Set(backgroundIds);
  const pending = [];

  for (const id of readyOrder) {
    const controller = controllers.get(id);
    if (!controller) throw new Error(`Missing ready controller: ${id}`);
    if (!background.has(id)) {
      await controller.ready();
      continue;
    }

    let readyResult;
    try {
      readyResult = controller.ready();
    } catch (error) {
      readyResult = Promise.reject(error);
    }
    const guarded = Promise.resolve(readyResult)
      .then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error })
      );
    pending.push({ id, guarded });
  }

  for (const { id, guarded } of pending) {
    const result = await guarded;
    if (!result.ok) {
      throw new Error(`Background-ready controller ${id} failed: ${result.error?.message || result.error}`);
    }
  }
}
