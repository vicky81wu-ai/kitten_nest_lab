import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildNotebookPublishPatch } = require('../../shared/notebook-publish.js');

test('publishing archives the new page and does not re-archive the current page', () => {
  const current = {
    id: 'current-id',
    text: 'current page',
    savedAt: '2026-08-12T02:33:31.066Z',
    author: 'vicky',
    favorite: true
  };
  const patch = buildNotebookPublishPatch('new Alex page', {
    hubbyNote: current.text,
    hubbyNoteUpdatedAt: current.savedAt,
    hubbyNoteAuthor: current.author,
    hubbyNoteArchive: [current, { id: 'older', text: 'older page' }]
  }, {
    author: 'alex',
    now: '2026-08-13T04:00:00Z',
    createId: () => 'new-id'
  });

  assert.equal(patch.hubbyNote, 'new Alex page');
  assert.equal(patch.hubbyNoteAuthor, 'alex');
  assert.deepEqual(patch.hubbyNoteArchive.map((item) => item.id), ['new-id', 'current-id', 'older']);
  assert.equal(patch.hubbyNoteArchive.filter((item) => item.text === current.text).length, 1);
  assert.deepEqual(patch.hubbyNoteArchive[1], current);
});

test('publishing identical text preserves the canonical archived page without duplication', () => {
  const canonical = {
    id: 'same-id',
    text: 'same page',
    savedAt: '2026-08-12T02:33:31.066Z',
    author: 'vicky',
    favorite: true
  };
  const patch = buildNotebookPublishPatch(' same page ', {
    hubbyNote: canonical.text,
    hubbyNoteArchive: [canonical]
  }, {
    author: 'alex',
    now: '2026-08-13T04:00:00Z',
    createId: () => 'must-not-be-used'
  });

  assert.equal(patch.hubbyNoteArchive.length, 1);
  assert.deepEqual(patch.hubbyNoteArchive[0], canonical);
});

test('publishing mirrors only the configured history window', () => {
  const patch = buildNotebookPublishPatch('new page', {
    hubbyNoteHistory: [
      { id: 'one', text: 'one' },
      { id: 'two', text: 'two' }
    ]
  }, {
    maxArchiveItems: 2,
    now: '2026-08-13T04:00:00Z',
    createId: () => 'new-id'
  });

  assert.deepEqual(patch.hubbyNoteArchive.map((item) => item.id), ['new-id', 'one', 'two']);
  assert.deepEqual(patch.hubbyNoteHistory.map((item) => item.id), ['new-id', 'one']);
});

test('publishing clones retained archive entries instead of mutating live state objects', () => {
  const retained = { id: 'retained', text: 'retained page', favorite: true };
  const state = { hubbyNoteArchive: [retained] };
  const patch = buildNotebookPublishPatch('new page', state, {
    now: '2026-08-13T04:00:00Z',
    createId: () => 'new-id'
  });

  assert.notEqual(patch.hubbyNoteArchive[1], retained);
  patch.hubbyNoteArchive[1].favorite = false;
  assert.equal(state.hubbyNoteArchive[0].favorite, true);
});
