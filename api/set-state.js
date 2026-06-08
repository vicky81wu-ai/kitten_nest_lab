module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nest-Token');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-nest-token'] !== process.env.NEST_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  const patch = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  const readResponse = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
    headers: { apikey: key, authorization: `Bearer ${key}` }
  });
  const rows = await readResponse.json();
  const value = { ...(rows[0] ? rows[0].value : {}), ...patch, updatedAt: new Date().toISOString() };

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
  if (!writeResponse.ok) return res.status(500).json(result);
  return res.status(200).json({ ok: true, value });
};
