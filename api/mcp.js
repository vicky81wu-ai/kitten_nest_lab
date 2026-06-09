const TOOL_NAMES = [
  'read_nest_state',
  'update_alex_bubble',
  'update_hubby_note',
  'update_mood_note',
  'update_room_status'
];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Nest-Token, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!res.getHeader || !res.getHeader('Mcp-Session-Id')) res.setHeader('Mcp-Session-Id', 'kitten-nest-session');
  res.end(JSON.stringify(body));
}

function queryValue(req, key) {
  if (req.query && req.query[key]) return String(req.query[key]);
  try {
    const u = new URL(req.url || '', 'https://kitten-nest.local');
    return u.searchParams.get(key) || '';
  } catch {
    return '';
  }
}

function authed(req) {
  const token = process.env.NEST_TOKEN;
  if (!token) return false;
  const auth = req.headers.authorization || '';
  const headerToken = req.headers['x-nest-token'] || '';
  const urlToken = queryValue(req, 't') || queryValue(req, 'token') || queryValue(req, 'key');
  return auth === `Bearer ${token}` || headerToken === token || urlToken === token;
}

async function db(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('Missing Supabase environment variables');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error((data && data.message) || text || `database ${response.status}`);
  return data;
}

async function readState() {
  const rows = await db('nest_state?key=eq.main&select=value');
  return rows && rows[0] ? rows[0].value : {};
}

async function writeState(patch) {
  const current = await readState();
  const value = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await db('nest_state?key=eq.main', {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ value })
  });
  return value;
}

function normalizeBubbleQueue(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim().slice(0, 220))
    .filter(Boolean)
    .slice(0, 30);
}

function toolList() {
  const textArg = {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  };
  return [
    { name: 'read_nest_state', description: 'Read the current Kitten Nest state.', inputSchema: { type: 'object', properties: {} } },
    { name: 'update_alex_bubble', description: 'Update Alex speech bubble queue text in Kitten Nest. One line becomes one bubble.', inputSchema: textArg },
    { name: 'update_hubby_note', description: 'Update Hubby Note text in Kitten Nest.', inputSchema: textArg },
    { name: 'update_mood_note', description: 'Update Mood Note text in Kitten Nest.', inputSchema: textArg },
    { name: 'update_room_status', description: 'Update room status in Kitten Nest.', inputSchema: textArg }
  ];
}

async function callTool(name, args = {}) {
  if (name === 'read_nest_state') return readState();
  if (!TOOL_NAMES.includes(name)) throw new Error(`Unknown tool: ${name}`);
  const text = String(args.text || '');

  if (name === 'update_alex_bubble') {
    const alexBubbles = normalizeBubbleQueue(text);
    if (!alexBubbles.length) throw new Error('Missing bubble text');
    return writeState({ alexBubble: alexBubbles[0], alexBubbles, bubbleIndex: 0 });
  }

  const map = {
    update_hubby_note: 'hubbyNote',
    update_mood_note: 'moodNote',
    update_room_status: 'roomStatus'
  };
  return writeState({ [map[name]]: text });
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET') {
    return json(res, 200, {
      jsonrpc: '2.0',
      result: {
        name: 'kitten-nest-mcp',
        endpoint: '/api/mcp',
        tools: toolList().map(t => t.name),
        note: 'POST JSON-RPC methods initialize, tools/list, tools/call here.'
      }
    });
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const method = body.method;
    const id = body.id || null;

    if (method === 'initialize') {
      return json(res, 200, { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'kitten-nest-mcp', version: '0.1.2' } } });
    }
    if (method === 'notifications/initialized') {
      return json(res, 202, { jsonrpc: '2.0', id, result: {} });
    }
    if (method === 'tools/list') {
      return json(res, 200, { jsonrpc: '2.0', id, result: { tools: toolList() } });
    }
    if (method === 'tools/call') {
      const params = body.params || {};
      const toolName = params.name;
      if (toolName !== 'read_nest_state' && !authed(req)) {
        return json(res, 200, { jsonrpc: '2.0', id, error: { code: -32001, message: 'Unauthorized write. Add the private token as X-Nest-Token, Bearer token, or ?t= token on the server URL.' } });
      }
      const result = await callTool(toolName, params.arguments || {});
      return json(res, 200, { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } });
    }

    return json(res, 200, { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
  } catch (error) {
    return json(res, 200, { jsonrpc: '2.0', id: null, error: { code: -32000, message: error.message } });
  }
};
