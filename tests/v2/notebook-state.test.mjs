import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNotebookState } from '../../v2/runtime/core/notebook-state.mjs';

test('notebook state keeps the current page and normalizes the permanent archive', () => {
  const result = resolveNotebookState({
    hubbyNote: 'current page',
    hubbyNoteUpdatedAt: '2026-08-09T12:00:00Z',
    hubbyNoteFavorite: true,
    hubbyNoteArchive: [
      { id: 'a', text: 'first archive', savedAt: '2026-08-08T12:00:00Z', favorite: true },
      'second archive',
      { id: 'empty', text: '   ' }
    ]
  });
  assert.equal(result.current.text, 'current page');
  assert.equal(result.current.date, '2026-08-09');
  assert.equal(result.current.favorite, true);
  assert.equal(result.archive.length, 2);
  assert.deepEqual(result.archive.map((page) => page.text), ['first archive', 'second archive']);
  assert.equal(result.archive[0].favorite, true);
  assert.equal(result.pages.length, 3);
});

test('canonical archive wins over history and respects the configured read limit', () => {
  const result = resolveNotebookState({
    hubbyNoteHistory: [{ text: 'legacy history' }],
    hubbyNoteArchive: [{ text: 'one' }, { text: 'two' }, { text: 'three' }]
  }, {
    maxArchiveItems: 2,
    emptyText: 'waiting'
  });
  assert.equal(result.current.text, 'waiting');
  assert.equal(result.current.empty, true);
  assert.deepEqual(result.archive.map((page) => page.text), ['one', 'two']);
});

test('history remains a read fallback when the canonical archive is absent', () => {
  const result = resolveNotebookState({
    hubbyNote: 'now',
    hubbyNoteHistory: [{ note: 'older note', createdAt: 'not-a-date' }]
  });
  assert.equal(result.archive[0].text, 'older note');
  assert.equal(result.archive[0].date, 'not-a-date');
});
