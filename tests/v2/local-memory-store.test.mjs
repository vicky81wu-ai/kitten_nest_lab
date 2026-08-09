import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearLegacyMemorySlot,
  writeLegacyMemorySlot
} from '../../v2/runtime/core/local-memory-store.mjs';

function writableDatabase() {
  const observations = { modes: [], puts: [], deletes: [], closes: 0 };
  const indexedDb = {
    databases: async () => [{ name: 'kittenNestLabDB', version: 1 }],
    open() {
      const request = {};
      queueMicrotask(() => {
        const db = {
          version: 1,
          objectStoreNames: { contains: (name) => name === 'images' },
          transaction(storeName, mode) {
            observations.modes.push({ storeName, mode });
            const transaction = {
              objectStore: () => ({
                put(value, key) { observations.puts.push({ value, key }); },
                delete(key) { observations.deletes.push(key); }
              })
            };
            queueMicrotask(() => transaction.oncomplete?.());
            return transaction;
          },
          close() { observations.closes += 1; }
        };
        request.result = db;
        request.onsuccess?.();
      });
      return request;
    }
  };
  return { indexedDb, observations };
}

test('local photo setup writes and clears only an explicit image slot', async () => {
  const { indexedDb, observations } = writableDatabase();
  const image = { type: 'image/png', size: 2048 };
  await writeLegacyMemorySlot({ indexedDb, key: 'photo2', value: image });
  await clearLegacyMemorySlot({ indexedDb, key: 'photo2' });
  assert.deepEqual(observations.modes, [
    { storeName: 'images', mode: 'readwrite' },
    { storeName: 'images', mode: 'readwrite' }
  ]);
  assert.deepEqual(observations.puts, [{ value: image, key: 'photo2' }]);
  assert.deepEqual(observations.deletes, ['photo2']);
  assert.equal(observations.closes, 2);
});

test('local photo setup rejects non-images and keys outside the six slots', async () => {
  const { indexedDb } = writableDatabase();
  await assert.rejects(
    writeLegacyMemorySlot({ indexedDb, key: 'photo9', value: { type: 'image/png', size: 12 } }),
    /Unknown local image slot/
  );
  await assert.rejects(
    writeLegacyMemorySlot({ indexedDb, key: 'photo0', value: { type: 'text/plain', size: 12 } }),
    /Choose an image file/
  );
});
