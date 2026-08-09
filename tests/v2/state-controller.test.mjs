import test from 'node:test';
import assert from 'node:assert/strict';
import { StateController } from '../../v2/runtime/controllers/state-controller.mjs';

test('preview fallback refreshes coalesce and never masquerade as stale live state', async () => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.document = { body: { dataset: {} }, hidden: false };
  globalThis.fetch = async (url) => {
    fetchCalls += 1;
    if (String(url).startsWith('/api/state')) {
      return { ok: false, status: 503, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ coffeeCornerBubble: 'preview line' })
    };
  };

  try {
    const statuses = [];
    const sourceNotice = { hidden: true };
    const context = {
      manifest: {
        runtime: {
          state: {
            endpoint: '/api/state',
            fallbackUrl: '/v2/data/preview-state.v2.json',
            timeoutMs: 50
          }
        }
      },
      elements: { sourceNotice },
      events: { emit: () => {} },
      setControllerStatus: (_id, status, detail) => statuses.push({ status, detail })
    };
    const controller = new StateController(context);

    await controller.ready();
    assert.equal(controller.source, 'degradedFallback');
    assert.equal(sourceNotice.hidden, false);
    assert.equal(globalThis.document.body.dataset.stateSource, 'degradedFallback');
    assert.equal(fetchCalls, 2);

    await Promise.all([
      controller.refresh('focus'),
      controller.refresh('visibilitychange')
    ]);

    assert.equal(fetchCalls, 3);
    assert.equal(controller.source, 'degradedFallback');
    assert.equal(controller.status, 'ready');
    assert.equal(sourceNotice.hidden, false);
    assert.equal(statuses.at(-1).detail, 'degradedFallback');
  } finally {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  }
});
