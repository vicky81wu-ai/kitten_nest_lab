import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const textTargets = require('../../data/text-targets.v1.json');
const writeTags = require('../../data/write-tag-registry.v1.json');
const manifest = require('../../v2/data/nest-manifest.v2.json');
const setState = require('../../api/set-state.js')._test;
const mcp = require('../../api/mcp.js')._test;

const beachTargets = [
  {
    targetId: 'coffeeCornerBeachHandholdSunsetBubble',
    sceneId: 'coffeeCornerBeachHandholdSunset',
    objectId: 'coffeeCornerBeachHandholdBubble'
  },
  {
    targetId: 'coffeeCornerBeachHandholdSunsetVickyBubble',
    sceneId: 'coffeeCornerBeachHandholdSunset',
    objectId: 'coffeeCornerBeachHandholdVickyBubble'
  },
  {
    targetId: 'coffeeCornerBeachBraceletPromiseBubble',
    sceneId: 'coffeeCornerBeachBraceletPromise',
    objectId: 'coffeeCornerBeachBraceletBubble'
  },
  {
    targetId: 'coffeeCornerBeachBraceletPromiseVickyBubble',
    sceneId: 'coffeeCornerBeachBraceletPromise',
    objectId: 'coffeeCornerBeachBraceletVickyBubble'
  },
  {
    targetId: 'coffeeCornerBeachStallOrderBubble',
    sceneId: 'coffeeCornerBeachStallOrder',
    objectId: 'coffeeCornerBeachStallOrderBubble'
  },
  {
    targetId: 'coffeeCornerBeachStallOrderVickyBubble',
    sceneId: 'coffeeCornerBeachStallOrder',
    objectId: 'coffeeCornerBeachStallOrderVickyBubble'
  }
];

const dialogueTargets = [
  {
    targetId: 'seasideWalkHandholdSunsetMainDialogue',
    sceneId: 'coffeeCornerBeachHandholdSunset',
    beatId: 'handholdSunset',
    field: 'seasideWalkHandholdSunsetMainTurns'
  },
  {
    targetId: 'seasideWalkBraceletPromiseMainDialogue',
    sceneId: 'coffeeCornerBeachBraceletPromise',
    beatId: 'braceletPromise',
    field: 'seasideWalkBraceletPromiseMainTurns'
  },
  {
    targetId: 'seasideWalkStallOrderMainDialogue',
    sceneId: 'coffeeCornerBeachStallOrder',
    beatId: 'stallOrder',
    field: 'seasideWalkStallOrderMainTurns'
  }
];

test('three established beach scenes own six isolated writable speaker bubble targets', () => {
  const writableFields = [];
  for (const card of beachTargets) {
    const target = textTargets.targets[card.targetId];
    const tag = writeTags.tags[card.targetId];
    const object = manifest.objects[card.objectId];

    assert.equal(target.targetRoom, card.sceneId);
    assert.equal(target.type, 'bubbleQueue');
    assert.equal(target.tag, card.targetId);
    assert.equal(tag.tag, `[${card.targetId}]`);
    assert.equal(tag.ownerScene, card.sceneId);
    assert.equal(tag.objectId, card.objectId);
    assert.equal(object.targetId, card.targetId);
    assert.equal(object.staticText, undefined);
    assert.equal(object.allowDegradedFallback, true);
    assert.deepEqual(object.readFields, {
      queue: [target.field],
      single: [target.currentField],
      index: [target.indexField]
    });
    writableFields.push(target.currentField, target.field, target.indexField, target.updatedAtField);
  }

  assert.equal(new Set(writableFields).size, writableFields.length);

  const speakerPairs = [
    ['coffeeCornerBeachHandholdSunsetBubble', 'coffeeCornerBeachHandholdSunsetVickyBubble'],
    ['coffeeCornerBeachBraceletPromiseBubble', 'coffeeCornerBeachBraceletPromiseVickyBubble'],
    ['coffeeCornerBeachStallOrderBubble', 'coffeeCornerBeachStallOrderVickyBubble']
  ];
  for (const [alexTargetId, vickyTargetId] of speakerPairs) {
    const alexObjectId = writeTags.tags[alexTargetId].objectId;
    const vickyObjectId = writeTags.tags[vickyTargetId].objectId;
    assert.equal(writeTags.tags[alexTargetId].mustNotAffect.includes(vickyObjectId), true);
    assert.equal(writeTags.tags[vickyTargetId].mustNotAffect.includes(alexObjectId), true);
  }

  const textPorts = Object.values(manifest.objects).filter((object) => object.kind === 'textPort');
  textPorts.forEach((object) => assert.equal(typeof object.targetId, 'string'));
});

test('set-state and MCP builders write only the selected beach queue fields', () => {
  for (const card of beachTargets) {
    const target = textTargets.targets[card.targetId];
    const expectedFields = [target.currentField, target.field, target.indexField, target.updatedAtField];

    const envelope = setState.buildTextTargetEnvelope({
      textTarget: { targetId: card.targetId, text: 'one\ntwo', mode: 'publish', dryRun: true }
    }, {});
    assert.equal(setState.canPublishTextTarget(card.targetId), true);
    assert.deepEqual(Object.keys(envelope.patch), expectedFields);
    assert.equal(envelope.patch[target.currentField], 'one');
    assert.deepEqual(envelope.patch[target.field], ['one', 'two']);
    assert.equal(envelope.patch[target.indexField], 0);

    const mcpPatch = mcp.buildTextTargetPatch(card.targetId, 'one\ntwo', {});
    assert.deepEqual(Object.keys(mcpPatch), expectedFields);
    assert.deepEqual(mcpPatch[target.field], ['one', 'two']);
  }
});

test('three semantic dialogue targets own ordered story scripts without replacing legacy speaker queues', () => {
  for (const card of dialogueTargets) {
    const target = textTargets.targets[card.targetId];
    const tag = writeTags.tags[card.targetId];
    const group = manifest.dialogueGroups[card.targetId];

    assert.equal(target.type, 'dialogueScript');
    assert.equal(target.field, card.field);
    assert.equal(target.storyId, 'seasideWalk');
    assert.equal(target.beatId, card.beatId);
    assert.deepEqual(target.speakers, ['alex', 'vicky']);
    assert.equal(tag.tag, `[${card.targetId}]`);
    assert.equal(tag.storyId, 'seasideWalk');
    assert.equal(tag.beatId, card.beatId);
    assert.equal(group.ownerScene, card.sceneId);
    assert.equal(group.mode, 'conversation');
    assert.deepEqual(Object.keys(group.speakers), ['alex', 'vicky']);
    assert.equal(group.scriptTargetId, card.targetId);
  }

  beachTargets.forEach(({ targetId }) => assert.equal(textTargets.targets[targetId].type, 'bubbleQueue'));
});

test('set-state and MCP parse the same tagged speaker script into ordered turns', () => {
  const script = '@alex\nfirst\n\n@alex second\n\n@vicky\nreply';
  const expectedTurns = [
    { speaker: 'alex', text: 'first' },
    { speaker: 'alex', text: 'second' },
    { speaker: 'vicky', text: 'reply' }
  ];

  for (const card of dialogueTargets) {
    const target = textTargets.targets[card.targetId];
    const expectedFields = [target.field, target.updatedAtField];
    const envelope = setState.buildTextTargetEnvelope({
      textTarget: { targetId: card.targetId, text: script, mode: 'publish', dryRun: true }
    }, {});
    const mcpPatch = mcp.buildTextTargetPatch(card.targetId, script, {});

    assert.equal(setState.canPublishTextTarget(card.targetId), true);
    assert.deepEqual(Object.keys(envelope.patch), expectedFields);
    assert.deepEqual(envelope.patch[target.field], expectedTurns);
    assert.deepEqual(Object.keys(mcpPatch), expectedFields);
    assert.deepEqual(mcpPatch[target.field], expectedTurns);
  }
});

test('writer and MCP note channels stamp their own author while preserving known history', () => {
  const priorState = {
    hubbyNote: 'prior page',
    hubbyNoteUpdatedAt: '2026-08-10T10:00:00Z',
    hubbyNoteAuthor: 'alex',
    hubbyNoteArchive: [{ id: 'legacy', text: 'legacy page' }]
  };
  const writer = setState.buildTextTargetEnvelope({
    textTarget: { targetId: 'hubbyNote', text: 'Vicky page', mode: 'publish', dryRun: true }
  }, priorState).patch;
  const alex = mcp.buildTextTargetPatch('hubbyNote', 'Alex page', {
    ...priorState,
    hubbyNoteAuthor: 'vicky'
  });

  assert.equal(writer.hubbyNoteAuthor, 'vicky');
  assert.equal(writer.hubbyNoteArchive[0].author, 'alex');
  assert.equal(Object.hasOwn(writer.hubbyNoteArchive[1], 'author'), false);
  assert.equal(alex.hubbyNoteAuthor, 'alex');
  assert.equal(alex.hubbyNoteArchive[0].author, 'vicky');
});

test('writer console advertises all six canonical beach tags and MCP exposes every target id', async () => {
  const html = await readFile(new URL('../../write.html', import.meta.url), 'utf8');
  const mcpTargetEnum = mcp.toolList()
    .find((tool) => tool.name === 'update_text_target')
    .inputSchema.properties.targetId.enum;

  for (const { targetId } of beachTargets) {
    assert.match(html, new RegExp(`\\[${targetId}\\]`));
    assert.match(html, new RegExp(`<option value="${targetId}">${targetId}</option>`));
    assert.equal(mcpTargetEnum.includes(targetId), true);
    assert.equal(writeTags.writeAllPlacesPreset.includeTags.includes(`[${targetId}]`), true);
  }
});

test('writer console exposes explicit conversation and ambient modes for every seaside target', async () => {
  const html = await readFile(new URL('../../write.html', import.meta.url), 'utf8');
  const mcpTargetEnum = mcp.toolList()
    .find((tool) => tool.name === 'update_text_target')
    .inputSchema.properties.targetId.enum;

  assert.match(html, />剧情对话</);
  assert.match(html, />环境碎语</);
  assert.match(html, /@alex/);
  assert.match(html, /@vicky/);
  assert.match(html, /shared\/dialogue-script\.js/);
  for (const { targetId } of dialogueTargets) {
    assert.match(html, new RegExp(`\\[${targetId}\\]`));
    assert.match(html, new RegExp(`<option value="${targetId}">${targetId}</option>`));
    assert.equal(mcpTargetEnum.includes(targetId), true);
    assert.equal(writeTags.writeAllPlacesPreset.includeTags.includes(`[${targetId}]`), true);
  }
});
