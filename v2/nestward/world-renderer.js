commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/v2/nestward/world-renderer.js b/v2/nestward/world-renderer.js
index d046ed1..e8ba944 100644
--- a/v2/nestward/world-renderer.js
+++ b/v2/nestward/world-renderer.js
@@ -288,6 +288,29 @@ function drawAtmosphere(ctx, sceneId, cameraX, visibleWidth, time) {
   }
 }
 
+function drawActorRenderable(ctx, assets, state, item, time) {
+  const { scene, player, hubby, naili } = state;
+  if (item.kind === 'player') {
+    const metrics = actorMetrics(assets, scene, player);
+    drawActorShadow(ctx, player, metrics, player.flying ? .12 : .22);
+    drawSpriteActor(ctx, assets, player, scene, time, {
+      carriedSprite: naili.carried ? assets.get('nailiIdle') : null
+    });
+    return;
+  }
+  if (item.kind === 'hubby') {
+    const metrics = actorMetrics(assets, scene, hubby);
+    drawActorShadow(ctx, hubby, metrics, .23);
+    drawSpriteActor(ctx, assets, hubby, scene, time, { phase: 2 });
+    return;
+  }
+  if (item.kind === 'naili') {
+    const metrics = actorMetrics(assets, scene, naili);
+    drawNailiShadow(ctx, naili, metrics);
+    drawSpriteNaili(ctx, assets, naili, scene, time);
+  }
+}
+
 export class WorldRenderer {
   constructor(canvas) {
     this.canvas = canvas;
@@ -301,6 +324,9 @@ export class WorldRenderer {
     this.baseScale = 1;
     this.zoom = 1;
     this.scale = 1;
+    this.actorOcclusionProvider = null;
+    this.actorLayer = null;
+    this.actorLayerContext = null;
   }
 
   async preload() {
@@ -331,6 +357,35 @@ export class WorldRenderer {
     this.scale = this.baseScale * this.zoom;
   }
 
+  setActorOcclusionProvider(provider) {
+    this.actorOcclusionProvider = typeof provider === 'function' ? provider : null;
+  }
+
+  ensureActorLayer(scene) {
+    if (!this.actorLayer) {
+      this.actorLayer = document.createElement('canvas');
+      this.actorLayerContext = this.actorLayer.getContext('2d', { alpha: true });
+    }
+    if (this.actorLayer.width !== scene.width) this.actorLayer.width = scene.width;
+    if (this.actorLayer.height !== WORLD_HEIGHT) this.actorLayer.height = WORLD_HEIGHT;
+    return this.actorLayer;
+  }
+
+  drawActorWithOcclusion(ctx, state, item, time, effect) {
+    const layer = this.ensureActorLayer(state.scene);
+    const context = this.actorLayerContext;
+    context.setTransform(1, 0, 0, 1, 0, 0);
+    context.globalAlpha = 1;
+    context.globalCompositeOperation = 'source-over';
+    context.clearRect(0, 0, layer.width, layer.height);
+    context.imageSmoothingEnabled = true;
+    drawActorRenderable(context, this.assets, state, item, time);
+    context.globalCompositeOperation = effect.operation === 'include' ? 'destination-in' : 'destination-out';
+    context.drawImage(effect.mask, 0, 0, layer.width, layer.height);
+    context.globalCompositeOperation = 'source-over';
+    ctx.drawImage(layer, 0, 0);
+  }
+
   ensureCache(scene) {
     if (this.cache.has(scene.id)) return this.cache.get(scene.id);
     const artwork = this.assets.get(scene.id);
@@ -424,20 +479,11 @@ export class WorldRenderer {
       if (item.kind === 'propBack') drawPropLayer(ctx, this.assets, item.visual, false);
       if (item.kind === 'propFront') drawPropLayer(ctx, this.assets, item.visual, true);
       if (item.kind === 'princessCarry') drawPrincessCarry(ctx, this.assets, state);
-      if (item.kind === 'player') {
-        const metrics = actorMetrics(this.assets, scene, player);
-        drawActorShadow(ctx, player, metrics, player.flying ? .12 : .22);
-        drawSpriteActor(ctx, this.assets, player, scene, time, { carriedSprite: naili.carried ? this.assets.get('nailiIdle') : null });
-      }
-      if (item.kind === 'hubby') {
-        const metrics = actorMetrics(this.assets, scene, hubby);
-        drawActorShadow(ctx, hubby, metrics, .23);
-        drawSpriteActor(ctx, this.assets, hubby, scene, time, { phase: 2 });
-      }
-      if (item.kind === 'naili') {
-        const metrics = actorMetrics(this.assets, scene, naili);
-        drawNailiShadow(ctx, naili, metrics);
-        drawSpriteNaili(ctx, this.assets, naili, scene, time);
+      if (item.actor) {
+        const effect = this.actorOcclusionProvider?.(state, item.actor) || null;
+        if (effect?.mask && (effect.operation === 'include' || effect.operation === 'exclude')) {
+          this.drawActorWithOcclusion(ctx, state, item, time, effect);
+        } else drawActorRenderable(ctx, this.assets, state, item, time);
       }
     }
 
