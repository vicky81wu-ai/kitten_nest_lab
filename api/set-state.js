function cleanLines(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function noteArchiveOf(state) {
  if (Array.isArray(state && state.hubbyNoteArchive)) return state.hubbyNoteArchive;
  if (Array.isArray(state && state.hubbyNoteHistory)) return state.hubbyNoteHistory;
  return [];
}

function pendingDraftsOf(state) {
  return Array.isArray(state && state.pendingDrafts) ? state.pendingDrafts : [];
}

function applyHubbyNotePackage(patch, state) {
  const bubbleLines = Array.isArray(patch.alexBubbles) ? patch.alexBubbles : (patch.alexBubble ? [patch.alexBubble] : []);
  const joined = bubbleLines.map((line) => String(line || '')).join('\n').trim();
  const match = joined.match(/^\s*\[hubbyNote\]\s*\n([\s\S]*)$/i);
  if (!match) return false;

  const note = String(match[1] || '').trim().slice(0, 5000);
  if (!note) return false;

  const old = String(state && state.hubbyNote || '').trim();
  const archive = noteArchiveOf(state);
  const savedAt = new Date().toISOString();
  const nextArchive = old ? [{ text: old, savedAt: state.hubbyNoteUpdatedAt || state.updatedAt || savedAt }, ...archive] : archive;

  delete patch.alexBubble;
  delete patch.alexBubbles;
  delete patch.bubbleIndex;
  delete patch.previousPublished;

  patch.hubbyNote = note;
  patch.hubbyNoteUpdatedAt = savedAt;
  patch.hubbyNoteArchive = nextArchive;
  patch.hubbyNoteHistory = nextArchive.slice(0, 20);
  return true;
}

function applyLapCloseState(patch) {
  const hasArray = Array.isArray(patch.coffeeCornerLapCloseBubbles);
  const hasSingle = Object.prototype.hasOwnProperty.call(patch, 'coffeeCornerLapCloseBubble');
  if (!hasArray && !hasSingle) return;

  const source = hasArray ? patch.coffeeCornerLapCloseBubbles : patch.coffeeCornerLapCloseBubble;
  const list = Array.isArray(source)
    ? source.map((line) => String(line || '').trim()).filter(Boolean).slice(0, 30)
    : cleanLines(source).slice(0, 30);

  patch.coffeeCornerLapCloseBubbles = list;
  patch.coffeeCornerLapCloseBubble = list[0] || '';
  patch.coffeeCornerLapCloseBubbleIndex = 0;
  patch.coffeeCornerLapCloseBubbleUpdatedAt = new Date().toISOString();
}

function applyLapCloseDraftsOnPublish(patch, state) {
  if (!Array.isArray(patch.pendingDrafts) || patch.pendingDrafts.length !== 0) return;
  if (!Object.prototype.hasOwnProperty.call(patch, 'lastPublishedAt')) return;

  const drafts = pendingDraftsOf(state)
    .slice()
    .reverse()
    .filter((draft) => draft && draft.type === 'lapCloseBubbleDraft');
  if (!drafts.length) return;

  const list = cleanLines(drafts.map((draft) => draft.text || '').join('\n')).slice(0, 30);
  patch.coffeeCornerLapCloseBubbles = list;
  patch.coffeeCornerLapCloseBubble = list[0] || '';
  patch.coffeeCornerLapCloseBubbleIndex = 0;
  patch.coffeeCornerLapCloseBubbleUpdatedAt = new Date().toISOString();
}

function normalizePatch(rawPatch, state) {
  const patch = { ...(rawPatch || {}) };
  applyLapCloseDraftsOnPublish(patch, state);
  applyLapCloseState(patch);
  applyHubbyNotePackage(patch, state);
  return patch;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nest-Token');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-nest-token'] !== process.env.NEST_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  const rawPatch = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  const readResponse = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
    headers: { apikey: key, authorization: `Bearer ${key}` }
  });
  const rows = await readResponse.json();
  const state = rows[0] ? rows[0].value : {};
  const patch = normalizePatch(rawPatch, state);
  const value = { ...state, ...patch, updatedAt: new Date().toISOString() };

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