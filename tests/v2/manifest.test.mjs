import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateManifest } from '../../v2/runtime/core/manifest.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('v2 manifest is an isolated, registry-backed single source', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  const result = validateManifest(manifest, textTargets);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(manifest.promoted, false);
  assert.deepEqual(manifest.rules.stateWritesAllowed, {
    mode: 'registeredTargetOnly',
    targetIds: ['hubbyNote']
  });
  assert.equal(Object.keys(manifest.controllers).length, 8);
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
  assert.equal(manifest.objects.coffeeCornerBeachBraceletNextHot.coordinate.x, 0.8816);
});

test('the generic v2 bubble no longer draws the legacy triangle tail', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\.v2-text-port::after/);
  assert.match(css, /\.v2-text-port\s*\{[^}]*border-radius:\s*22px;/s);
});

test('the v2 entry is ready for iPhone home-screen mode', async () => {
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  assert.match(html, /name="viewport" content="[^"]*viewport-fit=cover[^"]*maximum-scale=1[^"]*user-scalable=no"/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
  assert.match(html, /name="apple-mobile-web-app-title" content="Kitten Nest"/);
});

test('room navigation is invisible and stays in the lower corner hit zones', async () => {
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.match(html, /id="v2-dock-left"[^>]*><\/button>/);
  assert.match(html, /id="v2-dock-right"[^>]*><\/button>/);
  assert.doesNotMatch(html, />[‹›]<\/button>/);
  assert.match(css, /\.v2-controls\s*\{[^}]*bottom:\s*0;[^}]*height:\s*max\(20%,\s*138px\)/s);
  assert.match(css, /\.v2-control\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*color:\s*transparent;/s);
});

test('weather advice is a compact floating card instead of the generic bottom sheet', async () => {
  const css = await readFile(new URL('../../v2/styles/nest-v2.css', import.meta.url), 'utf8');
  assert.match(css, /\.v2-panel\[data-panel-id="home\.weatherAdvicePanel"\]\s*\{[^}]*top:\s*36\.5%;[^}]*right:\s*3\.2%;[^}]*width:\s*min\(72%,\s*480px\)/s);
  assert.match(css, /\.v2-panel-layer\[data-panel-id="home\.weatherAdvicePanel"\][^{]*\.v2-panel__backdrop\s*\{[^}]*backdrop-filter:\s*none/s);
});

test('a transparent global long press owns the six local photo slots', async () => {
  const manifest = await readJson('../../v2/data/nest-manifest.v2.json');
  const html = await readFile(new URL('../../v2/index.html', import.meta.url), 'utf8');
  const hot = manifest.objects['system.localMediaLongPressHot'];
  const panel = manifest.objects['system.localMediaPanel'];
  assert.match(html, /id="v2-admin-hot"/);
  assert.equal(hot.ownerScene, '*');
  assert.equal(hot.gesture, 'longPress');
  assert.equal(hot.action.target, panel.id);
  assert.equal(panel.variant, 'localMediaSetup');
  assert.equal(panel.memoryTarget.type, 'legacyIndexedDbPhotoSlots');
  assert.deepEqual(panel.memoryTarget.keys, ['photo0', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5']);
});

test('manifest validation rejects dangling hotspots and unsupported effects', async () => {
  const source = await readJson('../../v2/data/nest-manifest.v2.json');
  const textTargets = await readJson('../../data/text-targets.v1.json');
  const manifest = structuredClone(source);
  manifest.objects['coffeeCorner.beachEnterHot'].action.target = 'missingBeach';
  delete manifest.objects['home.moonLampHot'].coordinate;
  manifest.objects['home.sparkles'].effect.type = 'mysteryDust';
  manifest.objects['system.localMediaLongPressHot'].longPressMs = 100;
  manifest.scenes.home.docks.right.target = 'missingRoom';
  const result = validateManifest(manifest, textTargets);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /coffeeCorner\.beachEnterHot navigates to unknown scene missingBeach/);
  assert.match(result.errors.join('\n'), /home\.moonLampHot requires a manifest coordinate/);
  assert.match(result.errors.join('\n'), /home\.sparkles uses unsupported type mysteryDust/);
  assert.match(result.errors.join('\n'), /Scene home dock navigates to unknown scene missingRoom/);
  assert.match(result.errors.join('\n'), /requires a 500-3000ms delay/);
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
