import {
  LEGACY_MEMORY_DATABASE,
  LEGACY_MEMORY_KEYS,
  LEGACY_MEMORY_STORE
} from './legacy-memory-source.mjs';

export const MAX_LOCAL_IMAGE_BYTES = 15 * 1024 * 1024;

function openAtVersion(indexedDb, databaseName, storeName, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local image database could not be opened'));
  });
}

async function openWritableDatabase(indexedDb, databaseName, storeName) {
  if (!indexedDb?.open) throw new Error('This browser does not support local image storage');
  let version = 1;
  if (typeof indexedDb.databases === 'function') {
    try {
      const databases = await indexedDb.databases();
      const match = databases.find((database) => database?.name === databaseName);
      if (Number.isFinite(match?.version)) version = Math.max(1, match.version);
    } catch {
      // Opening the known v1 store remains a safe fallback for older WebKit builds.
    }
  }

  let db = await openAtVersion(indexedDb, databaseName, storeName, version);
  if (db.objectStoreNames.contains(storeName)) return db;
  const nextVersion = Math.max(version, Number(db.version) || 1) + 1;
  db.close();
  db = await openAtVersion(indexedDb, databaseName, storeName, nextVersion);
  if (!db.objectStoreNames.contains(storeName)) {
    db.close();
    throw new Error('Local image store is unavailable');
  }
  return db;
}

function validateSlot(key, keys) {
  if (!keys.includes(key)) throw new Error(`Unknown local image slot: ${key}`);
}

function validateImage(value) {
  if (!value || !String(value.type || '').startsWith('image/')) {
    throw new Error('Choose an image file');
  }
  if (!Number.isFinite(value.size) || value.size <= 0 || value.size > MAX_LOCAL_IMAGE_BYTES) {
    throw new Error('Image must be smaller than 15 MB');
  }
}

function mutateSlot(db, storeName, operation) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    operation(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Local image write failed'));
    transaction.onabort = () => reject(transaction.error || new Error('Local image write was aborted'));
  });
}

export async function writeLegacyMemorySlot({
  indexedDb = globalThis.indexedDB,
  databaseName = LEGACY_MEMORY_DATABASE,
  storeName = LEGACY_MEMORY_STORE,
  keys = LEGACY_MEMORY_KEYS,
  key,
  value
} = {}) {
  validateSlot(key, keys);
  validateImage(value);
  const db = await openWritableDatabase(indexedDb, databaseName, storeName);
  try {
    await mutateSlot(db, storeName, (store) => store.put(value, key));
  } finally {
    db.close();
  }
}

export async function clearLegacyMemorySlot({
  indexedDb = globalThis.indexedDB,
  databaseName = LEGACY_MEMORY_DATABASE,
  storeName = LEGACY_MEMORY_STORE,
  keys = LEGACY_MEMORY_KEYS,
  key
} = {}) {
  validateSlot(key, keys);
  const db = await openWritableDatabase(indexedDb, databaseName, storeName);
  try {
    await mutateSlot(db, storeName, (store) => store.delete(key));
  } finally {
    db.close();
  }
}
