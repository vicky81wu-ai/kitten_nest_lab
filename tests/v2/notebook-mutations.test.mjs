import test from 'node:test';
import assert from 'node:assert/strict';
import { notebookArchiveKey } from '../../v2/runtime/core/notebook-state.mjs';
import {
  buildNotebookDeletePatch,
  buildNotebookFavoritePatch,
  buildNotebookSavePatch,
  notebookWriteFields
} from '../../v2/runtime/core/notebook-mutations.mjs';

const config = {
  currentField: 'hubbyNote',
  updatedAtField: 'hubbyNoteUpdatedAt',
  favoriteField: 'hubbyNoteFavorite',
  archiveFields: ['hubbyNoteArchive', 'hubbyNoteHistory'],
  trashField: 'hubbyNoteTrash',
  maxArchiveItems: 2,
  maxChars: 5000
};

test('saving writes the current page and archives the confirmed page immediately', () => {
  const patch = buildNotebookSavePatch('  new powder page  ', {
    hubbyNote: 'old current',
    hubbyNoteArchive: [{ id: 'old', text: 'old archive', savedAt: '2026-08-08T00:00:00Z' }]
  }, config, {
    now: '2026-08-09T10:00:00Z',
    createId: () => 'new-id'
  });
  assert.equal(patch.hubbyNote, 'new powder page');
  assert.equal(patch.hubbyNoteUpdatedAt, '2026-08-09T10:00:00Z');
  assert.equal(patch.hubbyNoteFavorite, false);
  assert.deepEqual(patch.hubbyNoteArchive.map((item) => item.id), ['new-id', 'old']);
  assert.deepEqual(patch.hubbyNoteHistory, patch.hubbyNoteArchive.slice(0, 2));
});

test('saving identical text does not duplicate the permanent archive', () => {
  const patch = buildNotebookSavePatch('same', {
    hubbyNoteArchive: [{ id: 'same-id', text: 'same', favorite: true }]
  }, config, {
    now: '2026-08-09T10:00:00Z',
    createId: () => 'must-not-be-used'
  });
  assert.equal(patch.hubbyNoteArchive.length, 1);
  assert.equal(patch.hubbyNoteArchive[0].id, 'same-id');
  assert.equal(patch.hubbyNoteArchive[0].favorite, true);
});

test('favorite toggles only the selected archive page', () => {
  const state = {
    hubbyNoteArchive: [
      { id: 'one', text: 'one', favorite: false },
      { id: 'two', text: 'two', favorite: true }
    ]
  };
  const result = buildNotebookFavoritePatch(notebookArchiveKey(state.hubbyNoteArchive[0], 0), state, config);
  assert.equal(result.favorite, true);
  assert.deepEqual(result.patch.hubbyNoteArchive.map((item) => item.favorite), [true, true]);
  assert.equal(Object.hasOwn(result.patch, 'hubbyNote'), false);
});

test('delete is a soft delete that moves one page into trash', () => {
  const state = {
    hubbyNote: 'current stays put',
    hubbyNoteArchive: [
      { id: 'one', text: 'one', savedAt: '2026-08-07T00:00:00Z', favorite: true },
      { id: 'two', text: 'two' }
    ],
    hubbyNoteTrash: [{ id: 'older-trash', text: 'older' }]
  };
  const result = buildNotebookDeletePatch(notebookArchiveKey(state.hubbyNoteArchive[0], 0), state, config, {
    now: '2026-08-09T11:00:00Z',
    createId: () => 'trash-id'
  });
  assert.deepEqual(result.patch.hubbyNoteArchive.map((item) => item.id), ['two']);
  assert.equal(result.patch.hubbyNoteTrash[0].id, 'trash-id');
  assert.equal(result.patch.hubbyNoteTrash[0].text, 'one');
  assert.equal(result.patch.hubbyNoteTrash[0].favorite, true);
  assert.equal(result.patch.hubbyNoteTrash[0].originalSavedAt, '2026-08-07T00:00:00Z');
  assert.equal(Object.hasOwn(result.patch, 'hubbyNote'), false);
});

test('the notebook allowlist contains only its six registered fields', () => {
  assert.deepEqual(notebookWriteFields(config), [
    'hubbyNote',
    'hubbyNoteUpdatedAt',
    'hubbyNoteFavorite',
    'hubbyNoteArchive',
    'hubbyNoteHistory',
    'hubbyNoteTrash'
  ]);
});
