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
  window.__kittenNestBridge = 'cloud-bridge-q3-single-bubble-hotspot';

  const STATE_URL = '/api/state';
  let cloudState = null;
  let queueIndex = 0;
  let lastStateStamp = '';
  let applying = false;
  let manualHidden = false;
  let lastTouchAt = 0;

  const css = document.createElement('style');
  css.textContent = '.bubble{pointer-events:auto!important;}.tattooHot{pointer-events:auto!important;}';
  document.head.appendChild(css);

  function bubbleEl(){ return document.getElementById('bubble'); }
  function tattooEl(){ return document.querySelector('.tattooHot'); }
  function panelOpen(){ return document.querySelector('.gameMenu.show,.gomokuPanel.show,.memoriesPanel.show'); }

  function queue(){
    if(!cloudState) return [];
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

  function syncQueueIndex(){
    if(!cloudState) return;
    const stamp = String(cloudState.updatedAt || '') + '|' + JSON.stringify(cloudState.alexBubbles || cloudState.alexBubble || '');
    if(stamp !== lastStateStamp){
      lastStateStamp = stamp;
      queueIndex = Number(cloudState.bubbleIndex || 0) || 0;
      manualHidden = false;
    }
  }

  function apply(force){
    const b = bubbleEl();
    const text = currentText();
    if(!b || !text) return;
    if(panelOpen() && !force) return;
    if(manualHidden && !force) return;
    applying = true;
    b.textContent = text;
    b.setAttribute('data-cloud','1');
    b.classList.remove('hidden');
    setTimeout(function(){ applying = false; }, 40);
  }

  function hideBubble(e){
    const b = bubbleEl();
    if(!b || panelOpen()) return false;
    stop(e);
    manualHidden = true;
    applying = true;
    b.classList.add('hidden');
    setTimeout(function(){ applying = false; }, 40);
    return true;
  }

  function showNext(e){
    const q = queue();
    if(!q.length || panelOpen()) return false;
    stop(e);
    if(q.length > 1) queueIndex = (queueIndex + 1) % q.length;
    manualHidden = false;
    apply(true);
    return true;
  }

  async function load(force){
    try{
      const res = await fetch(STATE_URL + '?t=' + Date.now(), { cache:'no-store' });
      if(!res.ok) return;
      cloudState = await res.json();
      window.kittenNestCloudState = cloudState;
      syncQueueIndex();
      apply(force);
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
    if(e.type === 'click' && Date.now() - lastTouchAt < 450){ stop(e); return; }
    if(e.type === 'touchend') lastTouchAt = Date.now();

    const b = bubbleEl();
    const isHidden = manualHidden || (b && b.classList.contains('hidden'));
    if(kind === 'bubble') hideBubble(e);
    else if(kind === 'tattoo') isHidden ? showNext(e) : hideBubble(e);
  }

  function observe(){
    const b = bubbleEl();
    if(!b || b.__qObserve) return;
    b.__qObserve = true;
    const mo = new MutationObserver(function(){
      if(applying || manualHidden) return;
      const text = currentText();
      if(text && b.textContent !== text && !panelOpen()) setTimeout(function(){ apply(false); }, 150);
    });
    mo.observe(b, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  function tick(force){ observe(); load(force); }

  document.addEventListener('click', capture, true);
  document.addEventListener('touchend', capture, true);
  window.addEventListener('load', function(){ tick(true); setInterval(function(){ tick(false); }, 4000); });
  window.addEventListener('focus', function(){ tick(true); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick(true); });
  setTimeout(function(){ tick(true); }, 250);
  setTimeout(function(){ tick(true); }, 900);
  setTimeout(function(){ tick(true); }, 1800);
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
