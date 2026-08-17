import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('phone acceptance layer is isolated and loaded before the formal runtime', async () => {
  const html = await read('../../v2/nestward/index.html');
  assert.match(html, /phone-polish-preview\.js[\s\S]*nestward\.js/);
  const patch = await read('../../v2/nestward/phone-polish-preview.js');
  assert.match(patch, /interactionRadius: 1/);
  assert.match(patch, /player: \{ x: 145, z: \.335 \}/);
  assert.match(patch, /x: 1345,[\s\S]*z: \.47/);
  assert.match(patch, /houseGuard/);
  assert.match(patch, /benchBlockIndex/);
  assert.match(patch, /fountainBlockIndex/);
  assert.match(patch, /narrow upright column/);
  assert.match(patch, /renderWithNailiShadow/);
});
