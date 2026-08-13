(function exposeNotebookPublish(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KittenNestNotebookPublish = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createNotebookPublishApi() {
  'use strict';

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function knownAuthor(value) {
    const author = text(value).toLowerCase();
    return author === 'alex' || author === 'vicky' ? author : '';
  }

  function cloneItem(item) {
    if (typeof item === 'string') return { text: item };
    return item && typeof item === 'object' && !Array.isArray(item) ? { ...item } : {};
  }

  function archiveOf(state, archiveField, historyField) {
    if (Array.isArray(state && state[archiveField])) return state[archiveField].map(cloneItem);
    if (Array.isArray(state && state[historyField])) return state[historyField].map(cloneItem);
    return [];
  }

  function defaultId() {
    return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function buildNotebookPublishPatch(raw, state = {}, options = {}) {
    const currentField = options.currentField || 'hubbyNote';
    const updatedAtField = options.updatedAtField || 'hubbyNoteUpdatedAt';
    const authorField = options.authorField || 'hubbyNoteAuthor';
    const favoriteField = options.favoriteField || 'hubbyNoteFavorite';
    const archiveField = options.archiveField || 'hubbyNoteArchive';
    const historyField = options.historyField || 'hubbyNoteHistory';
    const maxArchiveItems = Number.isFinite(options.maxArchiveItems)
      ? Math.max(0, options.maxArchiveItems)
      : 20;
    const maxChars = Number.isFinite(options.maxChars) ? Math.max(1, options.maxChars) : 5000;
    const note = text(raw).slice(0, maxChars);
    if (!note) throw new Error('Text is empty.');

    const author = knownAuthor(options.author) || 'vicky';
    const savedAt = options.now || new Date().toISOString();
    const archive = archiveOf(state, archiveField, historyField);
    const duplicateIndex = archive.findIndex((item) => text(item.text || item.note) === note);

    if (duplicateIndex < 0) {
      archive.unshift({
        id: (options.createId || defaultId)(),
        text: note,
        savedAt,
        author,
        favorite: false
      });
    }

    return {
      [currentField]: note,
      [updatedAtField]: savedAt,
      [authorField]: author,
      [favoriteField]: false,
      [archiveField]: archive,
      [historyField]: archive.slice(0, maxArchiveItems)
    };
  }

  return { buildNotebookPublishPatch };
});
