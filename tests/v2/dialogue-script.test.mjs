import test from 'node:test';
import assert from 'node:assert/strict';
import {
  interleaveSpeakerQueues,
  normalizeDialogueTurns,
  parseDialogueScript,
  serializeDialogueScript
} from '../../v2/runtime/core/dialogue-script.mjs';

const options = {
  speakers: ['alex', 'vicky'],
  maxTurns: 8,
  maxTurnChars: 120,
  maxChars: 500
};

test('dialogue scripts preserve explicit order including consecutive turns by one speaker', () => {
  const turns = parseDialogueScript(`@alex First line

@alex
Second line
continues here

@vicky Third line`, options);

  assert.deepEqual(turns, [
    { speaker: 'alex', text: 'First line' },
    { speaker: 'alex', text: 'Second line\ncontinues here' },
    { speaker: 'vicky', text: 'Third line' }
  ]);
  assert.deepEqual(parseDialogueScript(serializeDialogueScript(turns, options), options), turns);
});

test('dialogue scripts reject unowned speakers and text without a speaker marker', () => {
  assert.throws(() => parseDialogueScript('@milk hello', options), /Unknown dialogue speaker @milk/);
  assert.throws(() => parseDialogueScript('hello first\n@alex later', options), /must start with a speaker marker/);
});

test('legacy per-speaker queues become one deterministic round-robin timeline', () => {
  assert.deepEqual(interleaveSpeakerQueues({
    alex: ['A1', 'A2', 'A3'],
    vicky: ['V1', 'V2']
  }, ['alex', 'vicky'], options), [
    { speaker: 'alex', text: 'A1' },
    { speaker: 'vicky', text: 'V1' },
    { speaker: 'alex', text: 'A2' },
    { speaker: 'vicky', text: 'V2' },
    { speaker: 'alex', text: 'A3' }
  ]);
});

test('stored dialogue turns are normalized without encoding sequence in ids', () => {
  assert.deepEqual(normalizeDialogueTurns([
    { id: 'ignored-7', speaker: ' ALEX ', text: '  first  ' },
    null,
    { speaker: 'vicky', text: 'reply' }
  ], options), [
    { speaker: 'alex', text: 'first' },
    { speaker: 'vicky', text: 'reply' }
  ]);
});
