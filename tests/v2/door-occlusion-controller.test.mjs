commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/tests/v2/door-occlusion-controller.test.mjs b/tests/v2/door-occlusion-controller.test.mjs
new file mode 100644
index 0000000..6a79638
--- /dev/null
+++ b/tests/v2/door-occlusion-controller.test.mjs
@@ -0,0 +1,34 @@
+import test from 'node:test';
+import assert from 'node:assert/strict';
+import { DoorOcclusionController, DOOR_OCCLUSION_MODES } from '../../v2/nestward/door-occlusion-controller.js';
+
+test('the shared Door occlusion controller maps B to exclusion and outside to A inclusion', () => {
+  const masks = { maskA: { id: 'A' }, maskB: { id: 'B' }, walk: { id: 'walk' } };
+  const controller = new DoorOcclusionController();
+  controller.installMasks(masks);
+  const indoor = { scene: { id: 'indoor' } };
+  const outdoor = { scene: { id: 'outdoor' } };
+  const hubby = { id: 'hubby' };
+
+  controller.setActorMode('hubby', DOOR_OCCLUSION_MODES.THROUGH_FRAME);
+  assert.deepEqual(controller.effectFor(indoor, hubby), {
+    operation: 'exclude',
+    mask: masks.maskB,
+    owner: 'doorOcclusionController'
+  });
+
+  controller.setActorMode('hubby', DOOR_OCCLUSION_MODES.OUTSIDE);
+  assert.deepEqual(controller.effectFor(indoor, hubby), {
+    operation: 'include',
+    mask: masks.maskA,
+    owner: 'doorOcclusionController'
+  });
+  assert.equal(controller.effectFor(outdoor, hubby), null, 'Door A/B never leaks into the real outdoor scene');
+});
+
+test('normal indoor actors have no permanent B mask', () => {
+  const controller = new DoorOcclusionController();
+  controller.installMasks({ maskA: {}, maskB: {}, walk: {} });
+  assert.equal(controller.effectFor({ scene: { id: 'indoor' } }, { id: 'player' }), null);
+  assert.deepEqual(controller.snapshot().actors, {});
+});
