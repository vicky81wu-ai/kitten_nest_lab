export const LEGACY_MEMORY_DATABASE = 'kittenNestLabDB';
export const LEGACY_MEMORY_STORE = 'images';
export const LEGACY_MEMORY_KEYS = Object.freeze([
  'photo0',
  'photo1',
  'photo2',
  'photo3',
  'photo4',
  'photo5'
]);

export async function findLegacyMemoryDatabase(
  indexedDb,
  databaseName = LEGACY_MEMORY_DATABASE
) {
  if (!indexedDb || typeof indexedDb.databases !== 'function') {
    return { status: 'unsupported', version: null };
  }
  try {
    const databases = await indexedDb.databases();
    const match = databases.find((database) => database?.name === databaseName);
    if (!match) return { status: 'absent', version: null };
    return {
      status: 'available',
      version: Number.isFinite(match.version) ? match.version : 1
    };
  } catch (error) {
    return { status: 'unavailable', version: null, error };
  }
}

function openExistingDatabase(indexedDb, databaseName, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, version);
    let upgradeAttempted = false;

    request.onupgradeneeded = () => {
      upgradeAttempted = true;
      request.transaction?.abort();
    };
    request.onsuccess = () => {
      if (upgradeAttempted) {
        request.result?.close();
        resolve(null);
        return;
      }
      resolve(request.result);
    };
    request.onerror = () => {
      if (upgradeAttempted || request.error?.name === 'AbortError') resolve(null);
      else reject(request.error || new Error('Legacy memory database could not be opened'));
    };
  });
}

function readSlots(db, storeName, keys) {
  return new Promise((resolve, reject) => {
    const slots = Array(keys.length).fill(null);
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    keys.forEach((key, index) => {
      const request = store.get(key);
      request.onsuccess = () => {
        slots[index] = request.result || null;
      };
    });
    transaction.oncomplete = () => resolve(slots);
    transaction.onerror = () => reject(transaction.error || new Error('Legacy memory read failed'));
    transaction.onabort = () => reject(transaction.error || new Error('Legacy memory read aborted'));
  });
}

export async function readLegacyMemorySlots({
  indexedDb = globalThis.indexedDB,
  databaseName = LEGACY_MEMORY_DATABASE,
  storeName = LEGACY_MEMORY_STORE,
  keys = LEGACY_MEMORY_KEYS
} = {}) {
  const info = await findLegacyMemoryDatabase(indexedDb, databaseName);
  if (info.status !== 'available') {
    return { status: info.status, slots: Array(keys.length).fill(null) };
  }

  let db = null;
  try {
    db = await openExistingDatabase(indexedDb, databaseName, info.version);
    if (!db) return { status: 'absent', slots: Array(keys.length).fill(null) };
    if (!db.objectStoreNames.contains(storeName)) {
      return { status: 'absent', slots: Array(keys.length).fill(null) };
    }
    const slots = await readSlots(db, storeName, keys);
    return { status: 'ready', slots };
  } catch (error) {
    return { status: 'unavailable', slots: Array(keys.length).fill(null), error };
  } finally {
    db?.close();
  }
}
