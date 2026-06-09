const fs = require('fs');
const path = require('path');

const bridge = `
<script>
(function(){
  window.__kittenNestBridge = 'cloud-bridge-q1-document-capture';

  const STATE_URL = '/api/state';
  let cloudState = null;
  let queueIndex = 0;
  let lastStateStamp = '';
  let applying = false;
  let lastTouchAt = 0;

  const css = document.createElement('style');
  css.textContent = '.bubble{pointer-events:auto!important;}';
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
    }
  }

  function apply(force){
    const b = bubbleEl();
    const text = currentText();
    if(!b || !text) return;
    if(panelOpen() && !force) return;
    applying = true;
    b.textContent = text;
    b.setAttribute('data-cloud','1');
    b.classList.remove('hidden');
    setTimeout(function(){ applying = false; }, 40);
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

  function isTarget(e){
    const t = e && e.target;
    if(t && t.closest){
      if(t.closest('#bubble') || t.closest('.bubble') || t.closest('.tattooHot')) return true;
    }
    return inside(bubbleEl(), e) || inside(tattooEl(), e);
  }

  function stop(e){
    if(!e) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function next(e){
    const q = queue();
    if(q.length <= 1 || panelOpen()) return false;
    stop(e);
    queueIndex = (queueIndex + 1) % q.length;
    apply(true);
    return true;
  }

  function capture(e){
    if(!isTarget(e)) return;
    if(e.type === 'click' && Date.now() - lastTouchAt < 450){ stop(e); return; }
    if(e.type === 'touchend') lastTouchAt = Date.now();
    next(e);
  }

  function observe(){
    const b = bubbleEl();
    if(!b || b.__qObserve) return;
    b.__qObserve = true;
    const mo = new MutationObserver(function(){
      if(applying) return;
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

module.exports = function handler(req, res) {
  const file = path.join(process.cwd(), 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('</body>', bridge + '\n</body>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
