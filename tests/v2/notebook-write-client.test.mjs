import test from 'node:test';
import assert from 'node:assert/strict';
import { NotebookWriteClient } from '../../v2/runtime/core/notebook-write-client.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const config = {
  endpoint: '/api/set-state',
  authHeader: 'X-Nest-Token',
  tokenStorageKeys: ['kittenNestToken', 'nestToken']
};

test('writer sends the Nest token in the header and remembers it only after success', async () => {
  const storage = memoryStorage();
  let request;
  const client = new NotebookWriteClient({
    config,
    storage,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, value: { hubbyNote: 'saved' } })
      };
    }
  });
  const value = await client.write({
    patch: { hubbyNote: 'saved' },
    allowedFields: ['hubbyNote'],
    token: 'qa-only-token'
  });
  assert.deepEqual(value, { hubbyNote: 'saved' });
  assert.equal(request.url, '/api/set-state');
  assert.equal(request.options.headers['X-Nest-Token'], 'qa-only-token');
  assert.equal(request.options.body, JSON.stringify({ hubbyNote: 'saved' }));
  assert.equal(storage.values.get('kittenNestToken'), 'qa-only-token');
});

test('writer refuses an out-of-scope field before any request', async () => {
  let calls = 0;
  const client = new NotebookWriteClient({
    config,
    storage: memoryStorage({ kittenNestToken: 'qa-only-token' }),
    fetchImpl: async () => { calls += 1; }
  });
  await assert.rejects(
    client.write({ patch: { alexBubble: 'wrong owner' }, allowedFields: ['hubbyNote'] }),
    /越界写入/
  );
  assert.equal(calls, 0);
});

test('an unauthorized response forgets stored keys and asks for a replacement', async () => {
  const storage = memoryStorage({ kittenNestToken: 'wrong', nestToken: 'legacy-wrong' });
  const client = new NotebookWriteClient({
    config,
    storage,
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    })
  });
  await assert.rejects(
    client.write({ patch: { hubbyNote: 'x' }, allowedFields: ['hubbyNote'] }),
    /Nest key 不对/
  );
  assert.equal(storage.values.has('kittenNestToken'), false);
  assert.equal(storage.values.has('nestToken'), false);
});
