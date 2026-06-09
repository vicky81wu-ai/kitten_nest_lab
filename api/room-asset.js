const ASSETS = {
  'home-day': '/assets/rooms/home/day.jpg',
  'home-night': '/assets/rooms/home/night.jpg',
  'coffee-corner-morning-evening': '/assets/rooms/coffee-corner/morning-evening.jpg'
};

module.exports = async function handler(req, res) {
  try {
    const key = String((req.query && req.query.key) || '').trim();
    const rel = ASSETS[key];
    if (!rel) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('Unknown room asset');
    }

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const url = `${proto}://${host}${rel}`;
    const upstream = await fetch(url, { cache: 'no-store' });

    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('Room asset not found');
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    res.statusCode = 200;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', String(buf.length));
    return res.end(buf);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(error.message || 'room asset error');
  }
};
