function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function bodyJson(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (req.method !== 'POST') return {};
  const parts = [];
  for await (const part of req) parts.push(part);
  const raw = Buffer.concat(parts).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  try {
    const body = await bodyJson(req);
    const token = String((req.query && req.query.t) || body.t || '').trim();
    if (token !== process.env.NEST_TOKEN) return send(res, 401, { ok: false, error: 'unauthorized' });

    const rawText = String(body.text || body.m || (req.query && (req.query.text || req.query.m)) || '');
    const alexBubbles = rawText
      .split(/\r?\n/)
      .map(line => line.trim().slice(0, 220))
      .filter(Boolean)
      .slice(0, 30);
    const alexBubble = alexBubbles[0] || '';
    if (!alexBubble) return send(res, 400, { ok: false, error: 'missing text' });

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const response = await fetch(`${proto}://${host}/api/set-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nest-Token': token
      },
      body: JSON.stringify({ alexBubble, alexBubbles, bubbleIndex: 0 })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) return send(res, response.status || 500, { ok: false, error: data.error || data.message || 'set state failed' });

    return send(res, 200, {
      ok: true,
      alexBubble,
      alexBubbles,
      count: alexBubbles.length,
      updatedAt: data.value && data.value.updatedAt
    });
  } catch (error) {
    return send(res, 500, { ok: false, error: error.message });
  }
};
