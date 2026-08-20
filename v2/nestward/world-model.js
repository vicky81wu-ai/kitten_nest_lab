commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/v2/nestward/world-model.js b/v2/nestward/world-model.js
index e0b3603..b538729 100644
--- a/v2/nestward/world-model.js
+++ b/v2/nestward/world-model.js
@@ -18,6 +18,34 @@ export const DOOR_CALIBRATION = {
   outdoorHotspot: [[112, 235], [275, 235], [275, 455], [112, 455]]
 };
 
+export const DOOR_AWAY_CALIBRATION = Object.freeze({
+  point1: Object.freeze({ x: 1337, z: 0.13283289537879497 }),
+  point2: Object.freeze({ x: 1507, z: 0.20824666969097821 }),
+  moveSpeed: 1.2,
+  outsideSpeedFactor: 0.9,
+  companionDelaySeconds: 2
+});
+
+export const DOOR_TRANSITION_CALIBRATION = Object.freeze({
+  indoor: Object.freeze({
+    kitten: Object.freeze({
+      point1: Object.freeze({ x: 1389.0143540669856, z: 0.21818010630740092 }),
+      point2: Object.freeze({ x: 1495.823923444976, z: 0.2435980176494252 })
+    }),
+    hubby: Object.freeze({
+      point: Object.freeze({ x: 1360.5971291866026, z: 0.15156764899726935 })
+    })
+  }),
+  outdoor: Object.freeze({
+    kitten: Object.freeze({
+      point: Object.freeze({ x: 137.18660287081337, z: 0.32225861470423944 })
+    }),
+    hubby: Object.freeze({
+      point: Object.freeze({ x: 196.47081339712915, z: 0.28902842135450457 })
+    })
+  })
+});
+
 export function seededRandom(seed = 198) {
   let value = seed >>> 0;
   return () => {
@@ -315,4 +343,4 @@ export function pointInsideHit(object, point) {
   }
   const [x1, y1, x2, y2] = object.hit;
   return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
-}
\ No newline at end of file
+}
