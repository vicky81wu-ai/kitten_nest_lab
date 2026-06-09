const TOOL_NAMES = [
  'read_nest_state',
  'update_alex_bubble',
  'update_hubby_note',
  'update_mood_note',
  'update_room_status',
  'create_bubble_draft',
  'read_pending_drafts',
  'clear_pending_drafts'
];

const SESSION_ID = 'kitten-nest-session';
const MCP_VERSION = '2025-06-18';
const SERVER_NAME = 'kitten-nest-mcp';
const SERVER_VERSION = '0.1.4';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Nest-Token, Mcp-Session-Id, MCP-Protocol-Version');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, MCP-Protocol-Version');
}

function setMcpHeaders(res) {
  res.setHeader('Mcp-Session-Id', SESSION_ID);
  res.setHeader('MCP-Protocol-Version', MCP_VERSION);
  res.setHeader('Cache-Control', 'no-store');
}

function json(res, status, body) {
  res.statusCode = status;
  setMcpHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function wantsSse(req) {
  return String(req.headers.accept || '').includes('text/event-stream');
}

function sse(res) {
  res.statusCode = 200;
  setMcpHeaders(res);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`event: endpoint\ndata: /api/mcp\n\n`);
  res.write(`event: ready\ndata: ${JSON.stringify({ name: SERVER_NAME, version: SERVER_VERSION })}\n\n`);
  res.write(`: kitten-nest keepalive\n\n`);
  setTimeout(() => res.end(), 25000);
}

function rpc(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
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
  const auth = String(req.headers.authorization || '');
  const headerToken = String(req.headers['x-nest-token'] || '');
  const urlToken = queryValue(req, 't') || queryValue(req, 'token') || queryValue(req, 'key');
  return auth === `Bearer ${token}` || headerToken === token || urlToken === token;
}

async function bodyJson(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const parts = [];
  for await (const part of req) parts.push(part);
  const raw = Buffer.concat(parts).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
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

function makeDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pendingDraftsOf(state) {
  return Array.isArray(state.pendingDrafts) ? state.pendingDrafts : [];
}

function textSchema(description) {
  return {
    type: 'object',
    properties: {
      text: { type: 'string', description }
    },
    required: ['text'],
    additionalProperties: false
  };
}

function draftSchema() {
  return {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Draft bubble text. Use multiple lines for a rotating bubble queue.' },
      targetRoom: { type: 'string', description: 'Target room id, such as coffeeCorner, home, restaurant, fountain, or global.' }
    },
    required: ['text'],
    additionalProperties: false
  };
}

function toolList() {
  return [
    {
      name: 'read_nest_state',
      description: 'Read the current Kitten Nest world state.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'create_bubble_draft',
      description: 'Create a pending Kitten Nest bubble draft for Vicky to publish from the writer console. This does not directly change the visible nest bubble.',
      inputSchema: draftSchema()
    },
    {
      name: 'read_pending_drafts',
      description: 'Read pending Kitten Nest drafts waiting in the writer console.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'clear_pending_drafts',
      description: 'Clear all pending Kitten Nest drafts from the writer console.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'update_alex_bubble',
      description: 'Update the visible Alex speech bubble queue in Kitten Nest. Each line becomes one rotating bubble.',
      inputSchema: textSchema('Bubble text. Use multiple lines for multiple rotating bubbles.')
    },
    {
      name: 'update_hubby_note',
      description: 'Update the Hubby Note text in Kitten Nest.',
      inputSchema: textSchema('Hubby Note text.')
    },
    {
      name: 'update_mood_note',
      description: 'Update the Mood Note text in Kitten Nest.',
      inputSchema: textSchema('Mood Note text.')
    },
    {
      name: 'update_room_status',
      description: 'Update the current room status text in Kitten Nest.',
      inputSchema: textSchema('Room status text.')
    }
  ];
}

async function createBubbleDraft(args = {}) {
  const text = String(args.text || '').trim();
  if (!text) throw new Error('Missing draft text');
  const targetRoom = String(args.targetRoom || 'coffeeCorner').trim() || 'coffeeCorner';
  const current = await readState();
  const pendingDrafts = pendingDraftsOf(current);
  const draft = {
    id: makeDraftId(),
    source: 'alex',
    targetRoom,
    type: 'bubbleDraft',
    text: text.slice(0, 5000),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const value = await writeState({ pendingDrafts: [draft, ...pendingDrafts].slice(0, 50) });
  return { draft, pendingDrafts: value.pendingDrafts || [] };
}

async function callTool(name, args = {}) {
  if (name === 'read_nest_state') return readState();
  if (name === 'read_pending_drafts') {
    const state = await readState();
    return { pendingDrafts: pendingDraftsOf(state) };
  }
  if (!TOOL_NAMES.includes(name)) throw new Error(`Unknown tool: ${name}`);

  if (name === 'create_bubble_draft') return createBubbleDraft(args);
  if (name === 'clear_pending_drafts') return writeState({ pendingDrafts: [] });

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

function serverInfo() {
  return { name: SERVER_NAME, version: SERVER_VERSION };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET') {
    if (wantsSse(req)) return sse(res);
    return json(res, 200, {
      ok: true,
      name: SERVER_NAME,
      version: SERVER_VERSION,
      transport: 'streamable-http-jsonrpc',
      endpoint: '/api/mcp',
      tools: toolList().map(t => t.name),
      note: 'POST JSON-RPC methods initialize, notifications/initialized, tools/list, tools/call here.'
    });
  }

  if (req.method !== 'POST') return json(res, 405, rpcError(null, -32600, 'Method not allowed'));

  let id = null;
  try {
    const body = await bodyJson(req);
    const method = body.method;
    id = Object.prototype.hasOwnProperty.call(body, 'id') ? body.id : null;

    if (method === 'initialize') {
      return json(res, 200, rpc(id, {
        protocolVersion: MCP_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: serverInfo()
      }));
    }

    if (method === 'notifications/initialized') {
      res.statusCode = 202;
      setMcpHeaders(res);
      return res.end('');
    }

    if (method === 'ping') {
      return json(res, 200, rpc(id, {}));
    }

    if (method === 'tools/list') {
      return json(res, 200, rpc(id, { tools: toolList() }));
    }

    if (method === 'tools/call') {
      const params = body.params || {};
      const toolName = params.name;
      const publicTools = ['read_nest_state', 'read_pending_drafts'];
      if (!publicTools.includes(toolName) && !authed(req)) {
        return json(res, 200, rpcError(id, -32001, 'Unauthorized write. Add the private token as X-Nest-Token, Bearer token, or ?t= token on the server URL.'));
      }
      const result = await callTool(toolName, params.arguments || {});
      return json(res, 200, rpc(id, { content: [{ type: 'text', text: JSON.stringify(result) }] }));
    }

    return json(res, 200, rpcError(id, -32601, 'Method not found'));
  } catch (error) {
    return json(res, 200, rpcError(id, -32000, error.message));
  }
};
