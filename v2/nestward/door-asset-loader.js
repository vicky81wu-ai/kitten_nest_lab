commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/v2/nestward/door-asset-loader.js b/v2/nestward/door-asset-loader.js
new file mode 100644
index 0000000..0dc4f4f
--- /dev/null
+++ b/v2/nestward/door-asset-loader.js
@@ -0,0 +1,76 @@
+const ACCEPTED_STATUS = 'accepted-baked';
+const CANDIDATE_STATUS = 'candidate-baked-awaiting-phone-visual-qa';
+const DEFAULT_MANIFEST_URL = new URL('./assets/door/door-occlusion-manifest.v1.json', import.meta.url);
+
+async function decodeBitmap(url, options) {
+  if (options.decodeBitmap) return options.decodeBitmap(url);
+  const response = await options.fetch(url);
+  if (!response.ok) throw new Error(`Door mask failed: ${url} (${response.status})`);
+  const blob = await response.blob();
+  if ('createImageBitmap' in globalThis) return createImageBitmap(blob);
+  return new Promise((resolve, reject) => {
+    const image = new Image();
+    const objectUrl = URL.createObjectURL(blob);
+    image.onload = () => {
+      URL.revokeObjectURL(objectUrl);
+      resolve(image);
+    };
+    image.onerror = () => {
+      URL.revokeObjectURL(objectUrl);
+      reject(new Error(`Door mask decode failed: ${url}`));
+    };
+    image.src = objectUrl;
+  });
+}
+
+function validateDimensions(bitmap, expected, label) {
+  const width = bitmap.width || bitmap.naturalWidth;
+  const height = bitmap.height || bitmap.naturalHeight;
+  if (width !== expected[0] || height !== expected[1]) {
+    throw new Error(`${label} is ${width}x${height}; expected ${expected[0]}x${expected[1]}.`);
+  }
+}
+
+export async function loadDoorOcclusionAssets(options = {}) {
+  const fetcher = options.fetch || globalThis.fetch?.bind(globalThis);
+  if (!fetcher) throw new Error('Door asset loading requires fetch.');
+  const manifestUrl = options.manifestUrl || DEFAULT_MANIFEST_URL;
+  const response = await fetcher(manifestUrl);
+  if (!response.ok) throw new Error(`Door manifest failed: ${response.status}`);
+  const manifest = await response.json();
+
+  const candidate = options.allowCandidate === true && manifest.status === CANDIDATE_STATUS;
+  const active = manifest.status === ACCEPTED_STATUS;
+  if (!active && !candidate) {
+    return {
+      ready: false,
+      manifest,
+      reason: manifest.reason || 'accepted doorway brush export has not been baked yet'
+    };
+  }
+
+  const expected = manifest.canvas;
+  if (!Array.isArray(expected) || expected.length !== 2) throw new Error('Door manifest canvas is invalid.');
+  const assets = active ? manifest.assets : manifest.candidateAssets;
+  for (const key of ['maskA', 'maskB', 'walk']) {
+    if (typeof assets?.[key] !== 'string' || !assets[key]) {
+      throw new Error(`Door manifest is missing assets.${key}.`);
+    }
+  }
+
+  const decodeOptions = { ...options, fetch: fetcher };
+  const entries = await Promise.all(['maskA', 'maskB', 'walk'].map(async (key) => {
+    const url = new URL(assets[key], manifestUrl);
+    const bitmap = await decodeBitmap(url, decodeOptions);
+    validateDimensions(bitmap, expected, key);
+    return [key, bitmap];
+  }));
+
+  return {
+    ready: true,
+    manifest,
+    masks: Object.fromEntries(entries),
+    candidate,
+    activation: candidate ? 'candidate-qa' : 'accepted'
+  };
+}
