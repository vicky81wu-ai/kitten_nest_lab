import { notebookArchive, notebookArchiveKey } from './notebook-state.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function configOf(config = {}) {
  const archiveFields = Array.isArray(config.archiveFields) && config.archiveFields.length
    ? config.archiveFields
    : ['hubbyNoteArchive', 'hubbyNoteHistory'];
  return {
    currentField: config.currentField || 'hubbyNote',
    updatedAtField: config.updatedAtField || 'hubbyNoteUpdatedAt',
    authorField: config.authorField || 'hubbyNoteAuthor',
    defaultAuthor: config.defaultAuthor === 'alex' ? 'alex' : 'vicky',
    favoriteField: config.favoriteField || 'hubbyNoteFavorite',
    archiveField: archiveFields[0],
    historyField: archiveFields[1] || archiveFields[0],
    trashField: config.trashField || 'hubbyNoteTrash',
    maxArchiveItems: Number.isFinite(config.maxArchiveItems)
      ? Math.max(0, config.maxArchiveItems)
      : 20,
    maxChars: Number.isFinite(config.maxChars) ? Math.max(1, config.maxChars) : 5000
  };
}

function cloneItem(item) {
  if (typeof item === 'string') return { text: item };
  return item && typeof item === 'object' && !Array.isArray(item) ? { ...item } : {};
}

function archiveOf(state, config) {
  return notebookArchive(state, [config.archiveField, config.historyField]).map(cloneItem);
}

function historyPatch(archive, config) {
  return {
    [config.archiveField]: archive,
    [config.historyField]: archive.slice(0, config.maxArchiveItems)
  };
}

function requireArchiveIndex(archive, key) {
  const index = archive.findIndex((item, itemIndex) => notebookArchiveKey(item, itemIndex) === key);
  if (index < 0) throw new Error('这页档案刚刚变动了，请重新点一次。');
  return index;
}

function defaultId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function notebookWriteFields(config = {}) {
  const value = configOf(config);
  return [
    value.currentField,
    value.updatedAtField,
    value.authorField,
    value.favoriteField,
    value.archiveField,
    value.historyField,
    value.trashField
  ];
}

export function buildNotebookSavePatch(raw, state = {}, rawConfig = {}, options = {}) {
  const config = configOf(rawConfig);
  const note = text(raw).slice(0, config.maxChars);
  if (!note) throw new Error('先写一点点再保存，小猫。');

  const archive = archiveOf(state, config);
  const duplicateIndex = archive.findIndex((item) => text(item.text || item.note) === note);
  const author = options.author === 'alex' ? 'alex' : config.defaultAuthor;
  const savedAt = options.now || new Date().toISOString();
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
    [config.currentField]: note,
    [config.updatedAtField]: savedAt,
    [config.authorField]: author,
    [config.favoriteField]: false,
    ...historyPatch(archive, config)
  };
}

export function buildNotebookFavoritePatch(key, state = {}, rawConfig = {}) {
  const config = configOf(rawConfig);
  const archive = archiveOf(state, config);
  const index = requireArchiveIndex(archive, key);
  archive[index] = { ...archive[index], favorite: !Boolean(archive[index].favorite) };
  return {
    patch: historyPatch(archive, config),
    favorite: archive[index].favorite
  };
}

export function buildNotebookDeletePatch(key, state = {}, rawConfig = {}, options = {}) {
  const config = configOf(rawConfig);
  const archive = archiveOf(state, config);
  const index = requireArchiveIndex(archive, key);
  const [removed] = archive.splice(index, 1);
  const deletedAt = options.now || new Date().toISOString();
  const trash = Array.isArray(state?.[config.trashField])
    ? state[config.trashField].map(cloneItem)
    : [];
  trash.unshift({
    id: (options.createId || defaultId)(),
    text: text(removed.text || removed.note),
    deletedAt,
    originalSavedAt: removed.savedAt || removed.createdAt || removed.updatedAt || '',
    source: 'archive',
    ...(removed.author ? { author: removed.author } : {}),
    favorite: Boolean(removed.favorite)
  });
  return {
    patch: {
      ...historyPatch(archive, config),
      [config.trashField]: trash
    },
    removed
  };
}
