module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({
    ok: false,
    disabled: true,
    message: 'Temporary bubble write test endpoint is disabled. Use /api/set-state or /api/mcp for future updates.'
  });
};
