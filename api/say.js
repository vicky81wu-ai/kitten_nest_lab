function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readState(base, key) {
  const response = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
    headers: { apikey: key, authorization: `Bearer ${key}` }
  });
  const rows = await response.json();
  if (!response.ok) throw new Error((rows && rows.message) || 'read failed');
  return rows && rows[0] ? rows[0].value || {} : {};
}

async function writeState(base, key, value) {
  const response = await fetch(`${base}/rest/v1/nest_state?key=eq.main`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'return=minimal'
    },
    body: JSON.stringify({ value })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || 'write failed');
}

module.exports = async function handler(req, res) {
  try {
    if (req.query.t !== process.env.NEST_TOKEN) {
      return json(res, 401, { ok: false, error: 'unauthorized' });
    }

    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!base || !key) return json(res, 500, { ok: false, error: 'missing env' });

    const rawText = req.query.text || req.query.m || '';
    const alexBubble = String(rawText).trim().slice(0, 220);
    if (!alexBubble) return json(res, 400, { ok: false, error: 'missing text' });

    const current = await readState(base, key);
    const next = {
      ...current,
      alexBubble,
      updatedAt: new Date().toISOString()
    };

    await writeState(base, key, next);
    return json(res, 200, { ok: true, alexBubble, updatedAt: next.updatedAt });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
};
