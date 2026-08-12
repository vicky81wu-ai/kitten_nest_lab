import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateManifest } from '../../v2/runtime/core/manifest.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('v2 production manifest is a registry-backed single source', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  const result = validateManifest(manifest, textTargets);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(manifest.promoted, true);
  assert.equal(manifest.route, '/cloud');
  assert.deepEqual(manifest.rules.stateWritesAllowed, {
    mode: 'registeredTargetOnly',
    targetIds: ['hubbyNote']
  });
  assert.equal(Object.keys(manifest.controllers).length, 8);
});

test('preview and production metadata accept only their matching routes', async () => {
  const source = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');

  const preview = structuredClone(source);
  preview.promoted = false;
  preview.route = '/v2/index.html';
  assert.equal(validateManifest(preview, textTargets).ok, true);

  const mismatchedPreview = structuredClone(source);
  mismatchedPreview.promoted = false;
  assert.equal(validateManifest(mismatchedPreview, textTargets).ok, false);

  const mismatchedProduction = structuredClone(source);
  mismatchedProduction.route = '/v2/index.html';
  assert.equal(validateManifest(mismatchedProduction, textTargets).ok, false);
});

test('lapClose scene does not inherit coffeeCorner interactive objects', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const coffeeObjects = new Set(manifest.scenes.coffeeCorner.objects);
  const leaked = manifest.scenes.lapClose.objects.filter((id) => coffeeObjects.has(id));
  assert.deepEqual(leaked, []);
  assert.equal(manifest.scenes.lapClose.blocksParentInteractive, true);
});

test('home restorations and the approved beach chain stay explicit in one manifest', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  assert.equal(manifest.objects['home.moonLampHot'].action.type, 'asset.toggle');
  assert.equal(manifest.objects['home.windowWeather'].targetId, 'windowWeather');
  assert.equal(manifest.objects['home.pebbleJarSparkles'].effect.type, 'jarSparkles');
  assert.equal(manifest.objects['home.pebbleJarSparkles'].effect.count, 32);
  assert.deepEqual(manifest.objects['home.pebbleJarSparkles'].coordinate, {
    anchor: 'center', x: 0.495, y: 0.581, width: 0.32, height: 0.21
  });
  assert.equal(manifest.objects['coffeeCorner.beachEnterHot'].action.target, 'coffeeCornerBeachHandholdSunset');

  const beachIds = [
    'coffeeCornerBeachHandholdSunset',
    'coffeeCornerBeachBraceletPromise',
    'coffeeCornerBeachStallOrder'
  ];
  assert.deepEqual(beachIds.map((id) => manifest.scenes[id].presentation), ['panorama', 'panorama', 'panorama']);
  assert.deepEqual(beachIds.map((id) => manifest.scenes[id].assetKey), [
    'coffeeCorner.beachHandholdSunset',
    'coffeeCorner.beachBraceletPromise',
    'coffeeCorner.beachStallOrder'
  ]);
  assert.deepEqual(beachIds.map((id) => manifest.objects[manifest.scenes[id].objects[0]].targetId), [
    'coffeeCornerBeachHandholdSunsetBubble',
    'coffeeCornerBeachBraceletPromiseBubble',
    'coffeeCornerBeachStallOrderBubble'
  ]);
  assert.deepEqual(beachIds.map((id) => manifest.objects[manifest.scenes[id].objects[1]].targetId), [
    'coffeeCornerBeachHandholdSunsetVickyBubble',
    'coffeeCornerBeachBraceletPromiseVickyBubble',
    'coffeeCornerBeachStallOrderVickyBubble'
  ]);
  assert.equal(manifest.objects.coffeeCornerBeachBraceletNextHot.coordinate.x, 0.8816);
});

test('each beach conversation is ordered by story metadata without owning the camera', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const expected = [
    ['seasideWalkHandholdSunsetMainDialogue', 'coffeeCornerBeachHandholdSunset', 'handholdSunset'],
    ['seasideWalkBraceletPromiseMainDialogue', 'coffeeCornerBeachBraceletPromise', 'braceletPromise'],
    ['seasideWalkStallOrderMainDialogue', 'coffeeCornerBeachStallOrder', 'stallOrder']
  ];

  assert.equal(manifest.version, '0.5.0');
  assert.deepEqual(manifest.stories.seasideWalk.beats.map((beat) => beat.id), [
    'handholdSunset', 'braceletPromise', 'stallOrder'
  ]);
  expected.forEach(([groupId, sceneId, beatId]) => {
    const group = manifest.dialogueGroups[groupId];
    assert.equal(group.ownerScene, sceneId);
    assert.equal(group.storyId, 'seasideWalk');
    assert.equal(group.beatId, beatId);
    assert.equal(group.mode, 'conversation');
    assert.equal(group.scriptTargetId, groupId);
    assert.deepEqual(group.legacySpeakerOrder, ['alex', 'vicky']);
    assert.equal(group.inputLockMs, 200);
    assert.deepEqual(group.camera, { policy: 'manual' });
    assert.equal(group.members.length, 2);
    group.members.forEach((memberId) => {
      const member = manifest.objects[memberId];
      assert.equal(member.ownerScene, sceneId);
      assert.equal(member.dialogueGroupId, groupId);
    });
  });

  assert.deepEqual(manifest.objects.coffeeCornerBeachHandholdBubble.coordinate, {
    anchor: 'bottomCenter', x: 0.436, y: 0.248
  });
  assert.deepEqual(manifest.objects.coffeeCornerBeachBraceletBubble.coordinate, {
    anchor: 'topCenter', x: 0.48, y: 0.396
  });
  assert.deepEqual(manifest.objects.coffeeCornerBeachStallOrderBubble.coordinate, {
    anchor: 'topCenter', x: 0.56, y: 0.33
  });
});

test('the generic v2 bubble no longer draws the legacy triangle tail', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\.v2-text-port::after/);
  assert.match(css, /\.v2-text-port\s*\{[^}]*border-radius:\s*22px;/s);
  assert.match(css, /\.v2-text-port\s*\{[^}]*font-size:\s*15px;[^}]*font-weight:\s*400;/s);
  assert.doesNotMatch(css, /\.v2-text-port--alex,\s*\.v2-text-port--vicky\s*\{[^}]*font-size:/s);
});

test('weather, pebble jar, author colors, and moon crossfade keep their immersive contracts', async () => {
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  const assetController = await readFile(new URL('../../v2/runtime/controllers/asset-controller.mjs', import.meta.url), 'utf8');

  assert.match(html, /id="v2-scene-image-transition"/);
  assert.match(css, /\.v2-stage__image--transition\s*\{[^}]*opacity:\s*0;[^}]*transition:\s*opacity 520ms ease;/s);
  assert.match(assetController, /async crossfadeAssetKey\(/);
  assert.match(assetController, /await waitForCrossfade\(image, reducedMotion \? 1 : 560\)/);
  assert.doesNotMatch(assetController, /async toggle\([\s\S]*?dataset\.transitioning\s*=\s*'1'/);

  assert.match(css, /\.v2-text-port--weather\s*\{[^}]*color:\s*rgba\(255, 255, 255, 0\.84\);[^}]*animation:\s*v2-weather-float 4\.8s ease-in-out infinite;/s);
  assert.match(css, /\.v2-weather__description\s*\{[^}]*opacity:\s*0\.72;/s);
  assert.match(css, /@keyframes v2-weather-float[\s\S]*50%\s*\{\s*transform:\s*translateY\(-3px\);/);
  assert.match(css, /@keyframes v2-jar-float[\s\S]*45%\s*\{[^}]*translate\(2px, -10px\)[^}]*\}[\s\S]*70%\s*\{[^}]*translate\(-2px, -15px\)/);

  assert.match(css, /--alex-ink:\s*#351c21;/);
  assert.match(css, /--vicky-ink:\s*#8a3f65;/);
  assert.match(css, /\.v2-text-port--vicky\s*\{[^}]*color:\s*var\(--vicky-ink\);/s);
  assert.match(css, /\.v2-notebook__page\[data-author="vicky"\][^{]*\{\s*color:\s*var\(--vicky-ink\);/s);
});

test('ordinary bubbles default closed while the two established greeters remain explicit', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  assert.equal(manifest.objects['coffeeCorner.bubble'].initiallyVisible, true);
  assert.equal(manifest.objects['lapClose.bubble'].initiallyVisible, true);
  const dialogueMemberIds = Object.values(manifest.dialogueGroups).flatMap((group) => group.members);
  dialogueMemberIds.forEach((id) => assert.equal(manifest.objects[id].initiallyVisible, false));
});

test('the v2 entry is ready for iPhone home-screen mode', async () => {
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  assert.match(html, /name="viewport" content="[^"]*viewport-fit=cover[^"]*maximum-scale=1[^"]*user-scalable=no"/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
  assert.match(html, /name="apple-mobile-web-app-title" content="Kitten Nest"/);
});

test('room navigation is invisible and locked to the base-image lower corners', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="v2-dock-(?:left|right)"/);
  assert.doesNotMatch(css, /\.v2-controls\s*\{/);
  assert.equal(manifest.globalObjects.some((id) => id.startsWith('system.dock')), false);
  const routeIds = [
    'home.goCoffeeCornerHot',
    'coffeeCorner.backHomeHot',
    'lapClose.backCoffeeCornerHot',
    'coffeeCornerBeachHandholdBackHot',
    'coffeeCornerBeachBraceletBackHot',
    'coffeeCornerBeachStallOrderBackHot'
  ];
  routeIds.forEach((id) => {
    const object = manifest.objects[id];
    assert.equal(object.kind, 'hotspot');
    assert.equal(object.coordinateStatus, 'baseImageLocked');
    assert.equal(object.mount, undefined);
    assert.match(object.selector, /^\[data-object-id=/);
  });
  assert.doesNotMatch(html, />[‹›]<\/button>/);
});

test('weather advice is a compact floating card instead of the generic bottom sheet', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.match(css, /\.v2-panel\[data-panel-id="home\.weatherAdvicePanel"\]\s*\{[^}]*top:\s*36\.5%;[^}]*right:\s*3\.2%;[^}]*width:\s*min\(72%,\s*480px\)/s);
  assert.match(css, /\.v2-panel-layer\[data-panel-id="home\.weatherAdvicePanel"\][^{]*\.v2-panel__backdrop\s*\{[^}]*backdrop-filter:\s*none/s);
});

test('a scoped long press owns three room overrides and six local photo slots', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  const hot = manifest.objects['system.localMediaLongPressHot'];
  const panel = manifest.objects['system.localMediaPanel'];
  assert.match(html, /id="v2-admin-hot"/);
  assert.equal(hot.ownerScene, '*');
  assert.equal(hot.gesture, 'longPress');
  assert.equal(hot.longPressMs, 1800);
  assert.equal(hot.action.target, panel.id);
  assert.equal(panel.variant, 'localMediaSetup');
  assert.equal(panel.memoryTarget.type, 'indexedDbLocalImageSlots');
  assert.deepEqual(panel.memoryTarget.keys, [
    'homeOn', 'homeOff', 'gameRoom',
    'photo0', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5'
  ]);
  assert.deepEqual(panel.memoryTarget.tabs.map((tab) => tab.label), ['房间', '照片墙', '其他']);
  assert.deepEqual(panel.memoryTarget.tabs[0].slots.map((slot) => slot.label), [
    '主页亮图', '主页暗图', '咖啡角底图'
  ]);
  assert.deepEqual(panel.memoryTarget.tabs[1].slots.map((slot) => slot.label), [
    '照片墙 1', '照片墙 2', '照片墙 3', '照片墙 4', '照片墙 5', '照片墙 6'
  ]);
  assert.match(css, /\.v2-admin-hot\s*\{[^}]*-webkit-touch-callout:\s*none;[^}]*-webkit-user-select:\s*none;/s);
  assert.match(css, /body\[data-long-press-armed\] \.v2-stage/);
});

test('manifest validation rejects dangling hotspots and unsupported effects', async () => {
  const source = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  const manifest = structuredClone(source);
  manifest.objects['coffeeCorner.beachEnterHot'].action.target = 'missingBeach';
  delete manifest.objects['home.moonLampHot'].coordinate;
  manifest.objects['home.sparkles'].effect.type = 'mysteryDust';
  manifest.objects['system.localMediaLongPressHot'].longPressMs = 100;
  manifest.objects['home.goCoffeeCornerHot'].action.target = 'missingRoom';
  manifest.objects.coffeeCornerBeachHandholdBubble.coordinate.anchor = 'floatingFace';
  const result = validateManifest(manifest, textTargets);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /coffeeCorner\.beachEnterHot navigates to unknown scene missingBeach/);
  assert.match(result.errors.join('\n'), /home\.moonLampHot requires a manifest coordinate/);
  assert.match(result.errors.join('\n'), /home\.sparkles uses unsupported type mysteryDust/);
  assert.match(result.errors.join('\n'), /home\.goCoffeeCornerHot navigates to unknown scene missingRoom/);
  assert.match(result.errors.join('\n'), /requires a 500-3000ms delay/);
  assert.match(result.errors.join('\n'), /uses unsupported coordinate anchor floatingFace/);
});

test('manifest validation accepts manual dialogue cameras and rejects broken legacy group locks', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  manifest.dialogueGroups.seasideWalkHandholdSunsetMainDialogue.camera.policy = 'speakerFollow';
  manifest.dialogueGroups.seasideWalkBraceletPromiseMainDialogue.camera = {
    policy: 'groupLock',
    focusX: 0.48
  };
  manifest.objects.coffeeCornerBeachBraceletVickyBubble.coordinate.x = 0.35;
  manifest.objects.coffeeCornerBeachStallOrderBubble.dialogueGroupId = 'missingDialogue';

  const result = validateManifest(manifest, textTargets);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /uses unsupported camera policy speakerFollow/);
  assert.match(result.errors.join('\n'), /member coffeeCornerBeachBraceletVickyBubble must share camera focusX/);
  assert.match(result.errors.join('\n'), /references unknown dialogue group missingDialogue/);
  assert.match(result.errors.join('\n'), /member coffeeCornerBeachStallOrderBubble lacks its back-reference/);
});

test('the product surface contains no runtime inspector or hotspot debug switch', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.equal(manifest.globalObjects.some((id) => id.includes('inspector')), false);
  assert.equal(Object.keys(manifest.objects).some((id) => id.includes('inspector')), false);
  assert.doesNotMatch(html, /v2-(?:runtime|state)-badge|v2-inspector-hot|data-debug-hotspots/);
  assert.doesNotMatch(css, /data-debug-hotspots|v2-diagnostics|v2-control--inspector/);
  assert.match(html, /id="v2-source-notice"[^>]*hidden>Preview copy<\/div>/);
});

test('the game console opens a manifest-owned interactive gomoku panel', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const menu = manifest.objects['gameMenu.panel'];
  const gomoku = manifest.objects['gomoku.panel'];
  assert.equal(manifest.scenes.coffeeCorner.objects.includes('gomoku.panel'), true);
  assert.equal(menu.items[0].action.type, 'panel.open');
  assert.equal(menu.items[0].action.target, 'gomoku.panel');
  assert.equal(gomoku.variant, 'gomoku');
  assert.equal(gomoku.game.size, 15);
  assert.deepEqual(gomoku.game.difficulties.map((item) => item.id), ['soft', 'normal', 'wolf']);
});

test('the memories panel can only read the six explicit legacy photo slots', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const memories = manifest.objects['memories.panel'];
  assert.equal(memories.variant, 'memories');
  assert.equal(memories.memorySource.type, 'legacyIndexedDbReadOnly');
  assert.equal(memories.memorySource.database, 'kittenNestLabDB');
  assert.equal(memories.memorySource.store, 'images');
  assert.deepEqual(memories.memorySource.keys, [
    'photo0', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5'
  ]);
});

test('the powder notebook owns one registry-scoped soft-delete write surface', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const notebook = manifest.objects['home.hubbyNotePanel'];
  assert.equal(notebook.variant, 'notebookArchive');
  assert.equal(notebook.targetId, 'hubbyNote');
  assert.equal(notebook.currentField, 'hubbyNote');
  assert.deepEqual(notebook.archiveFields, ['hubbyNoteArchive', 'hubbyNoteHistory']);
  assert.equal(notebook.favoriteField, 'hubbyNoteFavorite');
  assert.equal(notebook.authorField, 'hubbyNoteAuthor');
  assert.equal(notebook.defaultAuthor, 'vicky');
  assert.equal(notebook.trashField, 'hubbyNoteTrash');
  assert.equal(notebook.maxArchiveItems, 20);
  assert.equal(notebook.maxChars, 5000);
  assert.equal(notebook.writeMode, 'archiveWithSoftDelete');
  assert.equal(notebook.action, undefined);
  assert.deepEqual(manifest.rules.stateWritesAllowed.targetIds, ['hubbyNote']);
  assert.equal(manifest.runtime.stateWrites.endpoint, '/api/set-state');
  assert.equal(manifest.runtime.stateWrites.authHeader, 'X-Nest-Token');
  const session = await readFile(new URL('../../v2/runtime/panels/notebook-panel.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(session, /fetch\s*\(|localStorage|\/api\/set-state/);
  assert.match(session, /buildNotebookSavePatch/);
  assert.match(session, /buildNotebookFavoritePatch/);
  assert.match(session, /buildNotebookDeletePatch/);
});

test('manifest validation rejects broad or unregistered state-write targets', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  manifest.rules.stateWritesAllowed = {
    mode: 'registeredTargetOnly',
    targetIds: ['hubbyNote', 'notARealTarget']
  };
  const result = validateManifest(manifest, textTargets);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unregistered target notARealTarget/);
  assert.match(result.errors.join('\n'), /Writable target notARealTarget must have exactly one/);
});
