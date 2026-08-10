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
