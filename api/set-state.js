const textTargetRegistry = require('../data/text-targets.v1.json');

function cleanLines(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function now() {
  return new Date().toISOString();
}

function noteArchiveOf(state) {
  if (Array.isArray(state && state.hubbyNoteArchive)) return state.hubbyNoteArchive;
  if (Array.isArray(state && state.hubbyNoteHistory)) return state.hubbyNoteHistory;
  return [];
}

function pendingDraftsOf(state) {
  return Array.isArray(state && state.pendingDrafts) ? state.pendingDrafts : [];
}

function clampText(value, maxChars) {
  return String(value || '').trim().slice(0, maxChars || 5000);
}

function cleanTargetLines(value, maxLines) {
  return cleanLines(value).slice(0, maxLines || 30);
}

function textTargets() {
  return textTargetRegistry && textTargetRegistry.targets ? textTargetRegistry.targets : {};
}

function getTextTarget(targetId) {
  const id = String(targetId || '').trim();
  if (!id) return null;
  return textTargets()[id] || null;
}

function parseTextTargetEnvelope(rawPatch) {
  const body = rawPatch && rawPatch.textTarget && typeof rawPatch.textTarget === 'object'
    ? rawPatch.textTarget
    : null;

  if (!body) return null;
  return {
    targetId: String(body.targetId || '').trim(),
    text: String(body.text || ''),
    mode: String(body.mode || body.action || 'publish').trim().toLowerCase() || 'publish',
    dryRun: body.dryRun === true
  };
}

function previousCoffeeOf(state) {
  return {
    alexBubble: state.alexBubble || '',
    alexBubbles: state.alexBubbles || (state.alexBubble ? [state.alexBubble] : []),
    bubbleIndex: state.bubbleIndex || 0,
    coffeeCornerBubble: state.coffeeCornerBubble || '',
    coffeeCornerBubbles: state.coffeeCornerBubbles || (state.coffeeCornerBubble ? [state.coffeeCornerBubble] : []),
    coffeeCornerBubbleIndex: state.coffeeCornerBubbleIndex || 0,
    savedAt: now()
  };
}

function buildCoffeeCornerBubblePatch(text, state) {
  const list = cleanTargetLines(text, 30);
  if (!list.length) throw new Error('Text is empty.');

  return {
    previousPublished: previousCoffeeOf(state || {}),
    coffeeCornerBubble: list[0] || '',
    coffeeCornerBubbles: list,
    coffeeCornerBubbleIndex: 0,
    coffeeCornerBubbleUpdatedAt: now(),
    alexBubble: list[0] || '',
    alexBubbles: list,
    bubbleIndex: 0
  };
}

function buildLapCloseBubblePatch(text) {
  const list = cleanTargetLines(text, 30);
  if (!list.length) throw new Error('Text is empty.');

  return {
    coffeeCornerLapCloseBubble: list[0] || '',
    coffeeCornerLapCloseBubbles: list,
    coffeeCornerLapCloseBubbleIndex: 0,
    coffeeCornerLapCloseBubbleUpdatedAt: now()
  };
}

function buildWeatherTextPatch(text) {
  const list = cleanTargetLines(text, 2);
  return {
    windowTemp: list[0] || '',
    windowDesc: list[1] || ''
  };
}

function buildHubbyNotePatch(text, state) {
  const note = clampText(text, 5000);
  if (!note) throw new Error('Text is empty.');

  const old = String(state && state.hubbyNote || '').trim();
  const archive = noteArchiveOf(state);
  const savedAt = now();
  const nextArchive = old ? [{ text: old, savedAt: state.hubbyNoteUpdatedAt || state.updatedAt || savedAt }, ...archive] : archive;

  return {
    hubbyNote: note,
    hubbyNoteUpdatedAt: savedAt,
    hubbyNoteArchive: nextArchive,
    hubbyNoteHistory: nextArchive.slice(0, 20)
  };
}

function buildSingleTextPatch(target, text) {
  const value = clampText(text, target.maxChars || 2000);
  if (!value) throw new Error('Text is empty.');

  const patch = { [target.field]: value };
  if (target.updatedAtField) patch[target.updatedAtField] = now();
  return patch;
}

function buildDraftPatch(target, text, state) {
  const body = clampText(text, target.maxChars || 5000);
  if (!body) throw new Error('Text is empty.');

  const draft = {
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: 'textTargetEnvelope',
    targetId: target.targetId,
    targetRoom: target.targetRoom || target.targetId,
    type: target.draftType || 'textTargetDraft',
    field: target.currentField || target.field || null,
    text: body,
    status: 'pending',
    createdAt: now()
  };

  return { pendingDrafts: [draft, ...pendingDraftsOf(state)].slice(0, 50) };
}

function buildTextTargetPatch(target, text, state, mode) {
  if (mode === 'draft') return buildDraftPatch(target, text, state || {});
  if (mode !== 'publish') throw new Error('Unsupported text target mode. Use publish or draft.');

  if (target.targetId === 'coffeeCornerBubble') return buildCoffeeCornerBubblePatch(text, state || {});
  if (target.targetId === 'coffeeCornerLapCloseBubble') return buildLapCloseBubblePatch(text);
  if (target.targetId === 'windowWeather') return buildWeatherTextPatch(text);
  if (target.targetId === 'hubbyNote') return buildHubbyNotePatch(text, state || {});
  if (target.type === 'single') return buildSingleTextPatch(target, text);

  throw new Error(`Unsupported text target: ${target.targetId}`);
}

function buildTextTargetDryRun(rawPatch, state) {
  const request = parseTextTargetEnvelope(rawPatch);
  if (!request) return null;

  const target = getTextTarget(request.targetId);
  if (!target) {
    throw new Error(`Unknown text target: ${request.targetId}. Allowed: ${Object.keys(textTargets()).join(', ')}`);
  }

  const patch = buildTextTargetPatch(target, request.text, state || {}, request.mode);
  return {
    request: {
      targetId: target.targetId,
      mode: request.mode,
      dryRun: request.dryRun
    },
    target: {
      targetId: target.targetId,
      type: target.type,
      textClass: target.textClass,
      tag: target.tag
    },
    patch
  };
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

function applyLapCloseTagFromAlexBubbles(patch) {
  const rawLines = Array.isArray(patch.alexBubbles) ? patch.alexBubbles : (patch.alexBubble ? [patch.alexBubble] : []);
  const raw = rawLines.map((line) => String(line || '')).join('\n');
  const marker = '[coffeeCornerLapClose]';
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) return;

  const before = cleanLines(raw.slice(0, markerIndex).replace(/^\s*\[coffeeCorner\]\s*/i, ''));
  const after = raw.slice(markerIndex + marker.length);
  const nextTag = after.search(/\n\s*\[[^\]]+\]\s*\n/);
  const lapText = nextTag >= 0 ? after.slice(0, nextTag) : after;
  const lapList = cleanLines(lapText).slice(0, 30);

  if (lapList.length) {
    patch.coffeeCornerLapCloseBubbles = lapList;
    patch.coffeeCornerLapCloseBubble = lapList[0] || '';
    patch.coffeeCornerLapCloseBubbleIndex = 0;
    patch.coffeeCornerLapCloseBubbleUpdatedAt = new Date().toISOString();
  }

  if (before.length) {
    patch.alexBubble = before[0];
    patch.alexBubbles = before;
    patch.bubbleIndex = 0;
  } else {
    delete patch.alexBubble;
    delete patch.alexBubbles;
    delete patch.bubbleIndex;
    delete patch.previousPublished;
  }
}

function normalizePatch(rawPatch, state) {
  const patch = { ...(rawPatch || {}) };
  applyLapCloseDraftsOnPublish(patch, state);
  applyLapCloseTagFromAlexBubbles(patch);
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

  try {
    const rawPatch = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    const readResponse = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
      headers: { apikey: key, authorization: `Bearer ${key}` }
    });
    const rows = await readResponse.json();
    const state = rows[0] ? rows[0].value : {};

    const textTargetDryRun = buildTextTargetDryRun(rawPatch, state);
    if (textTargetDryRun) {
      if (!textTargetDryRun.request.dryRun) {
        return res.status(400).json({ ok: false, error: 'Text target envelope publish is not enabled yet. Use dryRun:true first.' });
      }
      return res.status(200).json({
        ok: true,
        dryRun: true,
        writesState: false,
        callsSupabaseWrite: false,
        ...textTargetDryRun
      });
    }

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
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
};