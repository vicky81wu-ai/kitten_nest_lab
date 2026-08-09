import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAssetKey,
  waitForBestEffortDecode
} from '../../v2/runtime/controllers/asset-controller.mjs';

const assets = {
  'home.auto': {
    strategy: 'timeOfDay',
    dayAsset: 'home.day',
    nightAsset: 'home.night',
    dayStartsAt: 7,
    nightStartsAt: 18
  },
  'home.day': { sources: [] },
  'home.night': { sources: [] }
};

test('time-of-day asset selection stays inside AssetController', () => {
  assert.equal(resolveAssetKey(assets, 'home.auto', 9), 'home.day');
  assert.equal(resolveAssetKey(assets, 'home.auto', 22), 'home.night');
});

test('image decode is a bounded best-effort readiness hint', async () => {
  assert.equal(await waitForBestEffortDecode({}, 5), 'unsupported');
  assert.equal(await waitForBestEffortDecode({ decode: async () => {} }, 5), 'decoded');
  assert.equal(await waitForBestEffortDecode({ decode: async () => { throw new Error('decode failed'); } }, 5), 'failed');
  assert.equal(await waitForBestEffortDecode({ decode: () => new Promise(() => {}) }, 5), 'timeout');
});
