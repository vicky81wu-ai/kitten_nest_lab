function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function author(value) {
  const normalized = text(value).toLowerCase();
  return normalized === 'alex' || normalized === 'vicky' ? normalized : '';
}

export function notebookArchive(state, fields = ['hubbyNoteArchive', 'hubbyNoteHistory']) {
  for (const field of fields) {
    if (Array.isArray(state?.[field])) return state[field];
  }
  return [];
}

function dateLabel(value) {
  const raw = text(value);
  if (!raw) return '';
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) return raw;
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function notebookArchiveKey(item, index) {
  const value = typeof item === 'string' ? { text: item } : item || {};
  const id = text(value.id);
  if (id) return `id:${id}`;
  const rawDate = text(value.savedAt || value.createdAt || value.updatedAt);
  return rawDate ? `date:${rawDate}:${index}` : `archive:${index}`;
}

function archivePage(item, index) {
  const value = typeof item === 'string' ? { text: item } : item || {};
  const body = text(value.text || value.note);
  if (!body) return null;
  const rawDate = value.savedAt || value.createdAt || value.updatedAt || '';
  return {
    key: notebookArchiveKey(value, index),
    kind: 'archive',
    label: `档案 ${index + 1}`,
    text: body,
    date: dateLabel(rawDate),
    author: author(value.author),
    favorite: Boolean(value.favorite),
    archiveIndex: index
  };
}

export function resolveNotebookState(state = {}, config = {}) {
  const currentField = config.currentField || 'hubbyNote';
  const updatedAtField = config.updatedAtField || 'hubbyNoteUpdatedAt';
  const favoriteField = config.favoriteField || 'hubbyNoteFavorite';
  const authorField = config.authorField || 'hubbyNoteAuthor';
  const archiveFields = config.archiveFields || ['hubbyNoteArchive', 'hubbyNoteHistory'];
  const maxArchiveItems = Number.isFinite(config.maxArchiveItems)
    ? Math.max(0, config.maxArchiveItems)
    : 20;
  const currentText = text(state?.[currentField]);
  const current = {
    key: 'current',
    kind: 'current',
    label: '当前页',
    text: currentText || config.emptyText || '本本正在等这一页醒来。',
    date: dateLabel(state?.[updatedAtField] || state?.updatedAt),
    author: author(state?.[authorField]),
    favorite: Boolean(state?.[favoriteField]),
    empty: !currentText
  };
  const archive = notebookArchive(state, archiveFields)
    .map(archivePage)
    .filter(Boolean)
    .slice(0, maxArchiveItems);
  return {
    current,
    archive,
    pages: [current, ...archive]
  };
}
