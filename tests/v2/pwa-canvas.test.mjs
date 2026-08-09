import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('v2 keeps the accepted fixed 100lvh PWA canvas without safe-area image shifting', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.match(css, /html,\s*body\s*\{[^}]*height:\s*100vh;[^}]*height:\s*100dvh;[^}]*height:\s*100lvh;/s);
  assert.match(css, /#v2-shell\s*\{[^}]*position:\s*fixed;[^}]*height:\s*100vh;[^}]*height:\s*100dvh;[^}]*height:\s*100lvh;/s);
  assert.match(css, /\.v2-stage\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.doesNotMatch(css, /\.v2-stage__image\s*\{[^}]*safe-area-inset-bottom/s);
});
