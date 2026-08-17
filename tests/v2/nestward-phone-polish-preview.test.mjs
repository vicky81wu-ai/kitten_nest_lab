import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('phone acceptance layer is isolated and loaded before the formal runtime', async () => {
  const html = await read('../../v2/nestward/index.html');
  assert.match(html, /phone-polish-preview\.js[\s\S]*nestward\.js/);
  const patch = await read('../../v2/nestward/phone-polish-preview.js');
  assert.match(patch, /interactionRadius: 1/);
  assert.match(patch, /x: 1298,[\s\S]*z: \.74/);
  assert.match(patch, /player: \{ x: 210, z: \.255 \}/);
  assert.match(patch, /player: \{ x: 1288, z: \.57 \}/);
  assert.match(patch, /hubby: \{ x: 1382, z: \.50 \}/);
  assert.match(patch, /houseGuard/);
  assert.match(patch, /benchBlockIndex/);
  assert.match(patch, /fountainBlockIndex/);
  assert.match(patch, /spriteHeight \* \.34/);
  assert.match(patch, /spriteHeight \* \.086/);
  assert.match(patch, /renderWithNailiShadow/);
});
