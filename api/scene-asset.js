const PUBLIC_STORAGE_ROOT = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/';
const MAX_ASSET_BYTES = 4_250_000;

const SCENE_ASSETS = Object.freeze({
  'lap-close': 'assets/rooms/coffee-corner/variants/lap-close-01.jpg',
  'beach-handhold-sunset': 'assets/rooms/coffee-corner/beach/beach-handhold-sunset.jpg',
  'beach-bracelet-promise': 'assets/rooms/coffee-corner/beach/beach-bracelet-promise.jpg',
  'beach-stall-order': 'assets/rooms/coffee-corner/beach/beach-stall-order.jpg'
});

function resolveSceneAsset(id) {
  const path = SCENE_ASSETS[String(id || '')];
  return path ? `${PUBLIC_STORAGE_ROOT}${path}` : null;
}

function sniffImageType(bytes, upstreamType = '') {
  if (bytes?.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes?.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes?.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  return String(upstreamType).startsWith('image/') ? upstreamType : 'application/octet-stream';
}

async function fetchSceneAsset(url, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }
    });
    if (!response.ok) throw new Error(`Upstream asset returned HTTP ${response.status}`);
    const advertisedSize = Number(response.headers.get('content-length') || 0);
    if (advertisedSize > MAX_ASSET_BYTES) throw new Error('Upstream asset exceeds the proxy limit');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_ASSET_BYTES) throw new Error('Invalid upstream asset size');
    return { bytes, headers: response.headers };
  } finally {
    clearTimeout(timer);
  }
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const url = resolveSceneAsset(id);
  if (!url) {
    res.status(404).json({ error: 'Unknown scene asset' });
    return;
  }

  try {
    const { bytes, headers } = await fetchSceneAsset(url);
    res.setHeader('Content-Type', sniffImageType(bytes, headers.get('content-type')));
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const etag = headers.get('etag');
    if (etag) res.setHeader('ETag', etag);
    res.status(200).send(bytes);
  } catch (error) {
    const status = error?.name === 'AbortError' ? 504 : 502;
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json({ error: status === 504 ? 'Scene asset timed out' : 'Scene asset unavailable' });
  }
}

module.exports = handler;
module.exports.resolveSceneAsset = resolveSceneAsset;
module.exports.sniffImageType = sniffImageType;
module.exports.SCENE_ASSETS = SCENE_ASSETS;
