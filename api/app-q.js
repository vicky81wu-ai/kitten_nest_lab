const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function hydrateHtml(html, state) {
  const queue = Array.isArray(state.alexBubbles) && state.alexBubbles.length ? state.alexBubbles : [];
  const bubbleText = queue[0] || state.alexBubble || 'come here, kitten.';
  const bubbleHtml = escapeHtml(bubbleText);
  const bubbleJs = escapeJs(bubbleText);

  return html
    .replace('<div id="bubble" class="bubble">come here, kitten.</div>', `<div id="bubble" class="bubble">${bubbleHtml}</div>`)
    .replace("if(r==='game')say('come here, kitten.')", `if(r==='game')say(${bubbleJs})`)
    .replace("$('toGame').onclick=()=>{go('game');say('coffee’s still warm. sit.')} ;", `$('toGame').onclick=()=>{go('game');say(${bubbleJs})} ;`)
    .replace("$('toGame').onclick=()=>{go('game');say('coffee's still warm. sit.')} ;", `$('toGame').onclick=()=>{go('game');say(${bubbleJs})} ;`);
}

const bridge = `
<script>
(function(){
  window.__kittenNestBridge = 'cloud-bridge-q5-touch-click-guard';

  const STATE_URL = '/api/state';
  const ADVANCE_GUARD_MS = 720;
  const TOUCH_CLICK_GUARD_MS = 1200;
  let cloudState = null;
  let queueIndex = 0;
  let lastStateStamp = '';
  let applying = false;
  let manualHidden = false;
  let lastTouchAt = 0;
  let lastAdvanceAt = 0;

  const css = document.createElement('style');
  css.textContent = '.bubble{pointer-events:auto!important;}.tattooHot{pointer-events:auto!important;}';
  document.head.appendChild(css);

  function bubbleEl(){ return document.getElementById('bubble'); }
  function tattooEl(){ return document.querySelector('.tattooHot'); }
  function panelOpen(){ return document.querySelector('.gameMenu.show,.gomokuPanel.show,.memoriesPanel.show'); }

  function queue(){
    if(!cloudState) return [];
    if(Array.isArray(cloudState.coffeeCornerBubbles) && cloudState.coffeeCornerBubbles.length){
      return cloudState.coffeeCornerBubbles.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    }
    if(cloudState.coffeeCornerBubble) return [String(cloudState.coffeeCornerBubble).trim()].filter(Boolean);
    if(Array.isArray(cloudState.alexBubbles)){
      return cloudState.alexBubbles.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    }
    return cloudState.alexBubble ? [String(cloudState.alexBubble)] : [];
  }

  function currentText(){
    const q = queue();
    if(!q.length) return '';
    return q[((queueIndex % q.length) + q.length) % q.length];
  }

  function userHidden(){
    const b = bubbleEl();
    return manualHidden || !!(b && b.getAttribute('data-bubble-user-hidden') === '1');
  }

  function markHidden(value){
    const b = bubbleEl();
    manualHidden = !!value;
    if(!b) return;
    if(value) b.setAttribute('data-bubble-user-hidden', '1');
    else b.removeAttribute('data-bubble-user-hidden');
  }

  function syncQueueIndex(){
    if(!cloudState) return;
    const q = queue();
    const canonicalIndex = Object.prototype.hasOwnProperty.call(cloudState, 'coffeeCornerBubbleIndex') ? cloudState.coffeeCornerBubbleIndex : '';
    const legacyIndex = Object.prototype.hasOwnProperty.call(cloudState, 'bubbleIndex') ? cloudState.bubbleIndex : '';
    const stamp = String(cloudState.updatedAt || '') + '|' + String(canonicalIndex) + '|' + String(legacyIndex) + '|' + JSON.stringify(q);
    if(stamp !== lastStateStamp){
      lastStateStamp = stamp;
      if(Object.prototype.hasOwnProperty.call(cloudState, 'coffeeCornerBubbleIndex')) queueIndex = Number(cloudState.coffeeCornerBubbleIndex || 0) || 0;
      else queueIndex = Number(cloudState.bubbleIndex || 0) || 0;
    }
  }

  function apply(reason){
    const b = bubbleEl();
    const text = currentText();
    if(!b || !text) return;
    if(panelOpen() && reason !== 'user') return;
    if(userHidden() && reason !== 'user'){
      b.textContent = text;
      b.setAttribute('data-cloud','1');
      return;
    }
    applying = true;
    if(reason === 'user') markHidden(false);
    b.textContent = text;
    b.setAttribute('data-cloud','1');
    b.classList.remove('hidden');
    setTimeout(function(){ applying = false; }, 40);
  }

  function hideBubble(e){
    const b = bubbleEl();
    if(!b || panelOpen()) return false;
    stop(e);
    markHidden(true);
    applying = true;
    b.classList.add('hidden');
    setTimeout(function(){ applying = false; }, 40);
    return true;
  }

  function showNext(e){
    const q = queue();
    if(!q.length || panelOpen()) return false;
    stop(e);
    const now = Date.now();
    if(now - lastAdvanceAt < ADVANCE_GUARD_MS) return true;
    lastAdvanceAt = now;
    if(q.length > 1) queueIndex = (queueIndex + 1) % q.length;
    markHidden(false);
    apply('user');
    return true;
  }

  async function load(reason){
    try{
      const res = await fetch(STATE_URL + '?t=' + Date.now(), { cache:'no-store' });
      if(!res.ok) return;
      cloudState = await res.json();
      window.kittenNestCloudState = cloudState;
      syncQueueIndex();
      apply(reason || 'refresh');
    }catch(e){ console.log('cloud state unavailable', e); }
  }

  function inside(el, e){
    if(!el || !e || typeof e.clientX !== 'number') return false;
    const r = el.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  function hitKind(e){
    const t = e && e.target;
    if(t && t.closest){
      if(t.closest('#bubble') || t.closest('.bubble')) return 'bubble';
      if(t.closest('.tattooHot')) return 'tattoo';
    }
    if(inside(bubbleEl(), e)) return 'bubble';
    if(inside(tattooEl(), e)) return 'tattoo';
    return '';
  }

  function stop(e){
    if(!e) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function capture(e){
    const kind = hitKind(e);
    if(!kind) return;
    if(e.type === 'click' && Date.now() - lastTouchAt < TOUCH_CLICK_GUARD_MS){ stop(e); return; }
    if(e.type === 'touchend') lastTouchAt = Date.now();

    const b = bubbleEl();
    const isHidden = userHidden() || (b && b.classList.contains('hidden'));
    if(kind === 'bubble') hideBubble(e);
    else if(kind === 'tattoo') isHidden ? showNext(e) : hideBubble(e);
  }

  function observe(){
    const b = bubbleEl();
    if(!b || b.__qObserve) return;
    b.__qObserve = true;
    const mo = new MutationObserver(function(){
      if(applying || userHidden()) return;
      const text = currentText();
      if(text && b.textContent !== text && !panelOpen()) setTimeout(function(){ apply('refresh'); }, 150);
    });
    mo.observe(b, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  function tick(reason){ observe(); load(reason || 'refresh'); }

  document.addEventListener('click', capture, true);
  document.addEventListener('touchend', capture, true);
  window.addEventListener('load', function(){ tick('refresh'); setInterval(function(){ tick('refresh'); }, 4000); });
  window.addEventListener('focus', function(){ tick('refresh'); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick('refresh'); });
  setTimeout(function(){ tick('refresh'); }, 250);
  setTimeout(function(){ tick('refresh'); }, 900);
  setTimeout(function(){ tick('refresh'); }, 1800);
})();
</script>`;

module.exports = async function handler(req, res) {
  const file = path.join(process.cwd(), 'index.html');
  const state = await readPublicState(req);
  let html = fs.readFileSync(file, 'utf8');
  html = hydrateHtml(html, state);
  html = html.replace('</body>', bridge + '\n</body>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};