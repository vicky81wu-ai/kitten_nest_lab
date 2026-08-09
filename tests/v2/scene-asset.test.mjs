import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveSceneAsset, sniffImageType } = require('../../api/scene-asset.js');

test('scene asset proxy only resolves its explicit public Storage allowlist', () => {
  assert.match(
    resolveSceneAsset('beach-handhold-sunset'),
    /^https:\/\/pmkxzmogolxllijzqnfr\.supabase\.co\/storage\/v1\/object\/public\/nest-public-assets\//
  );
  assert.equal(resolveSceneAsset('../private'), null);
  assert.equal(resolveSceneAsset(''), null);
});

test('scene asset proxy corrects PNG bytes stored under a jpg object name', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
  assert.equal(sniffImageType(png, 'image/jpeg'), 'image/png');
  assert.equal(sniffImageType(jpeg, 'application/octet-stream'), 'image/jpeg');
});
