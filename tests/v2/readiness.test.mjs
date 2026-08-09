import test from 'node:test';
import assert from 'node:assert/strict';
import { runReadyLifecycle } from '../../v2/runtime/core/readiness.mjs';

test('state readiness runs beside visual bootstrap without reordering visual controllers', async () => {
  const events = [];
  let releaseState;
  const stateReady = new Promise((resolve) => { releaseState = resolve; });
  const controllers = new Map([
    ['state', { ready: async () => { events.push('state:start'); await stateReady; events.push('state:end'); } }],
    ['asset', { ready: async () => { events.push('asset'); } }],
    ['sceneRuntime', { ready: async () => { events.push('scene'); releaseState(); } }]
  ]);

  await runReadyLifecycle(
    controllers,
    ['state', 'asset', 'sceneRuntime'],
    ['state']
  );

  assert.deepEqual(events, ['state:start', 'asset', 'scene', 'state:end']);
});
