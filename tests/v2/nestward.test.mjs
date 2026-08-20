commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/tests/v2/nestward.test.mjs b/tests/v2/nestward.test.mjs
index 14d298b..38158a4 100644
--- a/tests/v2/nestward.test.mjs
+++ b/tests/v2/nestward.test.mjs
@@ -61,7 +61,18 @@ test('Nestward local route action cannot become an external redirect', () => {
 });
 
 test('Nestward browser modules parse as JavaScript', () => {
-  for (const file of ['v2/nestward/nestward.js', 'v2/nestward/world-model.js', 'v2/nestward/world-renderer.js', 'v2/nestward/speech-runtime.js']) {
+  for (const file of [
+    'v2/nestward/nestward.js',
+    'v2/nestward/world-model.js',
+    'v2/nestward/world-renderer.js',
+    'v2/nestward/speech-runtime.js',
+    'v2/nestward/actor-motion.js',
+    'v2/nestward/door-asset-loader.js',
+    'v2/nestward/door-away-controller.js',
+    'v2/nestward/door-occlusion-controller.js',
+    'v2/nestward/door-transition-controller.js',
+    'v2/nestward/door-walk-planner.js'
+  ]) {
     const result = spawnSync(process.execPath, ['--check', file], {
       cwd: new URL('../..', import.meta.url),
       encoding: 'utf8'
