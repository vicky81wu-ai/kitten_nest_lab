export function cleanQueue(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function firstPresent(state, fields = []) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(state || {}, field)) continue;
    const value = state[field];
    if (Array.isArray(value) ? value.length : value !== '' && value != null) {
      return { field, value };
    }
  }
  return { field: '', value: undefined };
}

export function resolveTextPortState(state, object) {
  const fields = object?.readFields || {};
  const queueHit = firstPresent(state, fields.queue || []);
  const singleHit = firstPresent(state, fields.single || []);
  const indexHit = firstPresent(state, fields.index || []);
  const queue = cleanQueue(queueHit.value);

  if (queue.length) {
    return {
      queue,
      index: Number(indexHit.value || 0) || 0,
      sourceField: queueHit.field
    };
  }

  const single = String(singleHit.value ?? '').trim();
  return {
    queue: single ? [single] : [],
    index: Number(indexHit.value || 0) || 0,
    sourceField: singleHit.field
  };
}
