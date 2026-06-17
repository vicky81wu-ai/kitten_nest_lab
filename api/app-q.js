const fs = require('fs');
const path = require('path');

function escapeJs(value) {
  return JSON.stringify(String(value));
}

async function readPublicState(req) {
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

function coffeeCornerBubbleText(state) {
  const canonicalQueue = Array.isArray(state.coffeeCornerBubbles) && state.coffeeCornerBubbles.length ? state.coffeeCornerBubbles : [];
  const legacyQueue = Array.isArray(state.alexBubbles) && state.alexBubbles.length ? state.alexBubbles : [];
  const queue = canonicalQueue.length ? canonicalQueue : legacyQueue;
  return queue[0] || state.coffeeCornerBubble || state.alexBubble || '';
}

function hydrateHtml(html, state) {
  const bubbleText = coffeeCornerBubbleText(state);
  const bubbleJs = escapeJs(bubbleText);

  return html
    .replace('<div id="bubble" class="bubble">come here, kitten.</div>', '<div id="bubble" class="bubble hidden"></div>')
    .replace("if(r==='game')say('come here, kitten.')", bubbleText ? `if(r==='game')say(${bubbleJs})` : "if(r==='game'){}")
    .replace("$('toGame').onclick=()=>{go('game');say('coffee’s still warm. sit.')} ;", bubbleText ? `$('toGame').onclick=()=>{go('game');say(${bubbleJs})} ;` : "$('toGame').onclick=()=>{go('game')} ;")
    .replace("$('toGame').onclick=()=>{go('game');say('coffee's still warm. sit.')} ;", bubbleText ? `$('toGame').onclick=()=>{go('game');say(${bubbleJs})} ;` : "$('toGame').onclick=()=>{go('game')} ;")
    .replace("$('tattoo').onclick=()=>{bubbleOn=!bubbleOn;syncBubble()};", "$('tattoo').onclick=()=>{};");
}

module.exports = async function handler(req, res) {
  const file = path.join(process.cwd(), 'index.html');
  const state = await readPublicState(req);
  let html = fs.readFileSync(file, 'utf8');
  html = hydrateHtml(html, state);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};