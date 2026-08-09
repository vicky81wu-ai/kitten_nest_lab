import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetKey } from '../../v2/runtime/controllers/asset-controller.mjs';

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
