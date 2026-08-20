commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/tests/v2/nestward-phone-baseline.test.mjs b/tests/v2/nestward-phone-baseline.test.mjs
new file mode 100644
index 0000000..8387419
--- /dev/null
+++ b/tests/v2/nestward-phone-baseline.test.mjs
@@ -0,0 +1,48 @@
+import test from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import { DOOR_CALIBRATION, SCENES, isBlocked, pointInsideHit } from '../../v2/nestward/world-model.js';
+
+const object = (scene, id) => scene.objects.find((entry) => entry.id === id);
+
+test('the accepted indoor phone geometry keeps the desk floor open and bed-front mask empty', () => {
+  const desk = object(SCENES.indoor, 'desk');
+  assert.deepEqual(desk.block, [1135, 1360, .04, .1]);
+  assert.deepEqual(desk.hit, [1125, 330, 1370, 525]);
+  assert.equal(isBlocked(SCENES.indoor, { x: 1250, z: .38 }), false);
+  assert.deepEqual(SCENES.indoor.foregroundLayers.find((layer) => layer.id === 'bed-front').polygons, []);
+});
+
+test('the accepted outdoor bench and fountain leave their surrounding floor walkable', () => {
+  const bench = object(SCENES.outdoor, 'bench');
+  const fountain = object(SCENES.outdoor, 'fountain');
+  assert.equal(bench.block, undefined);
+  assert.deepEqual(bench.hit, [405, 346, 610, 494]);
+  assert.deepEqual(fountain.block, [1055, 1195, .05, .275]);
+  assert.deepEqual(fountain.hit, [990, 286, 1190, 542]);
+  assert.equal(isBlocked(SCENES.outdoor, { x: 1010, z: .24 }), true, 'the accepted small yellow lamp remains solid');
+  assert.equal(isBlocked(SCENES.outdoor, { x: 1035, z: .32 }), false, 'the red-side corridor remains floor');
+});
+
+test('the accepted cottage guard leaves all three steps and landing reachable', () => {
+  assert.ok(SCENES.outdoor.obstacles.some((entry) => entry.x1 === 0 && entry.x2 === 82 && entry.z1 === .03 && entry.z2 === .27));
+  for (const point of [{ x: 120, z: .2 }, { x: 160, z: .25 }, { x: 210, z: .31 }]) {
+    assert.equal(isBlocked(SCENES.outdoor, point), false, `${point.x},${point.z} should remain walkable`);
+  }
+});
+
+test('accepted door hotspots remain separate from their surrounding steps and floor', () => {
+  assert.deepEqual(DOOR_CALIBRATION.indoorHotspot, [[1365, 161], [1478, 159], [1483, 434], [1356, 400]]);
+  assert.deepEqual(DOOR_CALIBRATION.outdoorHotspot, [[112, 235], [275, 235], [275, 455], [112, 455]]);
+  assert.equal(pointInsideHit(object(SCENES.indoor, 'door'), { x: 1420, y: 260 }), true);
+  assert.equal(pointInsideHit(object(SCENES.indoor, 'door'), { x: 1340, y: 455 }), false);
+  assert.equal(pointInsideHit(object(SCENES.outdoor, 'door'), { x: 190, y: 320 }), true);
+  assert.equal(pointInsideHit(object(SCENES.outdoor, 'door'), { x: 300, y: 470 }), false);
+});
+
+test('Naili keeps the phone-accepted shadow proportions and opacity', async () => {
+  const renderer = await readFile(new URL('../../v2/nestward/world-renderer.js', import.meta.url), 'utf8');
+  assert.match(renderer, /metrics\.height \* \.34/);
+  assert.match(renderer, /Math\.max\(3, metrics\.height \* \.086\)/);
+  assert.match(renderer, /rgba\(40,23,20,\.18\)/);
+});
