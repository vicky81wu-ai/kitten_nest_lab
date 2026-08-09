import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findLegacyMemoryDatabase,
  readLegacyMemorySlots
} from '../../v2/runtime/core/legacy-memory-source.mjs';

function existingDatabase(values = {}) {
  const observations = {
    opens: [],
    modes: [],
    closes: 0
  };
  const indexedDb = {
    async databases() {
      return [{ name: 'kittenNestLabDB', version: 1 }];
    },
    open(name, version) {
      observations.opens.push({ name, version });
      const request = {};
      queueMicrotask(() => {
        const db = {
          objectStoreNames: { contains: (store) => store === 'images' },
          transaction(storeName, mode) {
            observations.modes.push({ storeName, mode });
            const transaction = {};
            const pending = [];
            transaction.objectStore = () => ({
              get(key) {
                const itemRequest = {};
                pending.push(() => {
                  itemRequest.result = values[key];
                  itemRequest.onsuccess?.();
                });
                return itemRequest;
              }
            });
            queueMicrotask(() => {
              pending.forEach((complete) => complete());
              queueMicrotask(() => transaction.oncomplete?.());
            });
            return transaction;
          },
          close() {
            observations.closes += 1;
          }
        };
        request.result = db;
        request.onsuccess?.();
      });
      return request;
    }
  };
  return { indexedDb, observations };
}

test('memory discovery refuses to create a database when safe enumeration is unavailable', async () => {
  const result = await findLegacyMemoryDatabase({ open: () => assert.fail('must not open') });
  assert.equal(result.status, 'unsupported');
});

test('an absent legacy memory database is not opened as a side effect', async () => {
  let opens = 0;
  const result = await readLegacyMemorySlots({
    indexedDb: {
      databases: async () => [],
      open: () => { opens += 1; }
    }
  });
  assert.equal(result.status, 'absent');
  assert.equal(opens, 0);
  assert.deepEqual(result.slots, Array(6).fill(null));
});

test('existing legacy photo slots are read through a readonly transaction', async () => {
  const { indexedDb, observations } = existingDatabase({
    photo0: 'first-photo',
    photo3: 'fourth-photo'
  });
  const result = await readLegacyMemorySlots({ indexedDb });
  assert.equal(result.status, 'ready');
  assert.equal(result.slots[0], 'first-photo');
  assert.equal(result.slots[1], null);
  assert.equal(result.slots[3], 'fourth-photo');
  assert.deepEqual(observations.opens, [{ name: 'kittenNestLabDB', version: 1 }]);
  assert.deepEqual(observations.modes, [{ storeName: 'images', mode: 'readonly' }]);
  assert.equal(observations.closes, 1);
});
