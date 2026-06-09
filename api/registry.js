const fs = require('fs');
const path = require('path');

async function readCloudState(req) {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const response = await fetch(`${proto}://${host}/api/state?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

function mergeRegistry(base, cloud) {
  const extra = cloud && cloud.registry && typeof cloud.registry === 'object' ? cloud.registry : {};
  return {
    ...base,
    ...extra,
    map: { ...(base.map || {}), ...(extra.map || {}) },
    rooms: [...(base.rooms || []), ...(extra.rooms || [])],
    widgets: [...(base.widgets || []), ...(extra.widgets || [])],
    actions: [...(base.actions || []), ...(extra.actions || [])],
    dailyRefreshTargets: extra.dailyRefreshTargets || base.dailyRefreshTargets || []
  };
}

module.exports = async function handler(req, res) {
  const file = path.join(process.cwd(), 'data', 'nest-registry.json');
  const base = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cloudState = await readCloudState(req);
  const registry = mergeRegistry(base, cloudState);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    registry,
    currentState: {
      roomStatus: cloudState.roomStatus || '',
      updatedAt: cloudState.updatedAt || '',
      knownTextKeys: Object.keys(cloudState).filter(key => /Bubble|Bubbles|Note|Text|Board|Puzzle|Notebook|Message/i.test(key))
    }
  });
};
