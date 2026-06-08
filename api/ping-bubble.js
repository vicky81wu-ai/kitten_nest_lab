module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.query.t !== process.env.NEST_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return res.status(500).json({ ok: false, error: 'missing env' });

  const text = 'hubby wrote this through the cloud door.';

  try {
    const readResponse = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
      headers: { apikey: key, authorization: `Bearer ${key}` }
    });
    const rows = await readResponse.json();
    const value = {
      ...(rows && rows[0] ? rows[0].value : {}),
      alexBubble: text,
      updatedAt: new Date().toISOString()
    };

    const writeResponse = await fetch(`${base}/rest/v1/nest_state?key=eq.main`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=representation'
      },
      body: JSON.stringify({ value })
    });

    const result = await writeResponse.json();
    if (!writeResponse.ok) return res.status(500).json({ ok: false, result });
    return res.status(200).json({ ok: true, alexBubble: text });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};
