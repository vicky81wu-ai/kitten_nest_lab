commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/tests/v2/door-assets.test.mjs b/tests/v2/door-assets.test.mjs
new file mode 100644
index 0000000..458e5b5
--- /dev/null
+++ b/tests/v2/door-assets.test.mjs
@@ -0,0 +1,118 @@
+import test from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import { loadDoorOcclusionAssets } from '../../v2/nestward/door-asset-loader.js';
+
+const response = (body, ok = true) => ({
+  ok,
+  status: ok ? 200 : 404,
+  async json() { return body; }
+});
+
+test('the checked-in Door manifest fails closed until the phone calibration is baked and visually accepted', async () => {
+  const manifest = JSON.parse(await readFile(
+    new URL('../../v2/nestward/assets/door/door-occlusion-manifest.v1.json', import.meta.url),
+    'utf8'
+  ));
+  let decoded = false;
+  const result = await loadDoorOcclusionAssets({
+    manifestUrl: new URL('https://example.test/door/manifest.json'),
+    fetch: async () => response(manifest),
+    decodeBitmap: async () => { decoded = true; return { width: 1536, height: 1024 }; }
+  });
+
+  assert.equal(result.ready, false);
+  assert.equal(result.manifest.status, 'candidate-baked-awaiting-phone-visual-qa');
+  assert.equal(decoded, false, 'an unaccepted manifest must never load approximate masks');
+});
+
+test('the checked-in phone backup remains a complete, repo-owned Door calibration source', async () => {
+  const manifest = JSON.parse(await readFile(
+    new URL('../../v2/nestward/assets/door/door-occlusion-manifest.v1.json', import.meta.url),
+    'utf8'
+  ));
+  const calibration = JSON.parse(await readFile(
+    new URL('../../v2/nestward/assets/door/door-away-calibration.v1.json', import.meta.url),
+    'utf8'
+  ));
+
+  assert.deepEqual(calibration.canvas, [1536, 1024]);
+  assert.equal(calibration.maskBase, 'pixel-livewire-v1');
+  assert.equal(calibration.adjust.maskA.length, 152);
+  assert.equal(calibration.adjust.maskB.length, 44);
+  assert.equal(calibration.adjust.walk.length, 44);
+  assert.deepEqual(calibration.walkZone, calibration.adjust.walk);
+  assert.deepEqual(calibration.point1, { x: 1337, z: 0.13283289537879497 });
+  assert.deepEqual(calibration.point2, { x: 1507, z: 0.20824666969097821 });
+  assert.equal(calibration.moveSpeed, 1.2);
+  assert.deepEqual(manifest.calibration.strokeCounts, { maskA: 152, maskB: 44, walk: 44 });
+  assert.deepEqual(manifest.candidateAssets, {
+    maskA: './door-mask-a.candidate-v1.png',
+    maskB: './door-mask-b.candidate-v1.png',
+    walk: './door-walk.candidate-v1.png'
+  });
+});
+
+test('candidate masks require an explicit QA opt-in and never activate by default', async () => {
+  const manifest = {
+    status: 'candidate-baked-awaiting-phone-visual-qa',
+    canvas: [1536, 1024],
+    candidateAssets: { maskA: './candidate-a.png', maskB: './candidate-b.png', walk: './candidate-walk.png' }
+  };
+  let decoded = false;
+  const common = {
+    manifestUrl: new URL('https://example.test/door/manifest.json'),
+    fetch: async () => response(manifest),
+    decodeBitmap: async () => { decoded = true; return { width: 1536, height: 1024 }; }
+  };
+
+  const defaultResult = await loadDoorOcclusionAssets(common);
+  assert.equal(defaultResult.ready, false);
+  assert.equal(decoded, false);
+
+  const qaResult = await loadDoorOcclusionAssets({ ...common, allowCandidate: true });
+  assert.equal(qaResult.ready, true);
+  assert.equal(qaResult.candidate, true);
+  assert.equal(qaResult.activation, 'candidate-qa');
+});
+
+test('an accepted manifest activates only three correctly-sized baked assets', async () => {
+  const manifest = {
+    status: 'accepted-baked',
+    canvas: [1536, 1024],
+    assets: { maskA: './a.png', maskB: './b.png', walk: './walk.png' }
+  };
+  const decoded = [];
+  const result = await loadDoorOcclusionAssets({
+    manifestUrl: new URL('https://example.test/door/manifest.json'),
+    fetch: async () => response(manifest),
+    decodeBitmap: async (url) => {
+      decoded.push(url.href);
+      return { width: 1536, height: 1024 };
+    }
+  });
+
+  assert.equal(result.ready, true);
+  assert.deepEqual(decoded, [
+    'https://example.test/door/a.png',
+    'https://example.test/door/b.png',
+    'https://example.test/door/walk.png'
+  ]);
+  assert.deepEqual(Object.keys(result.masks), ['maskA', 'maskB', 'walk']);
+});
+
+test('a baked Door asset with the wrong canvas size is rejected', async () => {
+  const manifest = {
+    status: 'accepted-baked',
+    canvas: [1536, 1024],
+    assets: { maskA: './a.png', maskB: './b.png', walk: './walk.png' }
+  };
+  await assert.rejects(
+    loadDoorOcclusionAssets({
+      manifestUrl: new URL('https://example.test/door/manifest.json'),
+      fetch: async () => response(manifest),
+      decodeBitmap: async (url) => ({ width: url.href.endsWith('/b.png') ? 900 : 1536, height: 1024 })
+    }),
+    /maskB is 900x1024; expected 1536x1024/
+  );
+});
