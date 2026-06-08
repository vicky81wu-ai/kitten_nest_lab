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

async function readCloudState() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return {};

  const response = await fetch(`${base}/rest/v1/nest_state?key=eq.main&select=value`, {
    headers: { apikey: key, authorization: `Bearer ${key}` }
  });
  if (!response.ok) return {};
  const rows = await response.json();
  return rows && rows[0] ? rows[0].value || {} : {};
}

function hydrateHtml(html, state) {
  const bubbleText = state.alexBubble || 'come here, kitten.';
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
  window.__kittenNestBridge = 'cloud-bridge-v8-server-hydrate';

  const css = document.createElement('style');
  css.textContent = [
    '.memoriesPanel .panel{max-height:calc(100dvh - 96px)!important;padding-bottom:calc(22px + env(safe-area-inset-bottom,0px))!important;}',
    '.memoriesPanel .bar{position:sticky!important;bottom:0!important;padding-top:10px!important;padding-bottom:max(8px,env(safe-area-inset-bottom,0px))!important;background:linear-gradient(180deg,rgba(255,242,241,0),rgba(255,242,241,.92) 35%,rgba(255,242,241,.96))!important;}'
  ].join('\n');
  document.head.appendChild(css);

  const STATE_URL = '/api/state';
  let cloudState = null;
  let applying = false;

  function bubbleEl(){ return document.getElementById('bubble'); }
  function panelOpen(){ return document.querySelector('.gameMenu.show,.gomokuPanel.show,.memoriesPanel.show'); }
  function cloudText(){ return cloudState && cloudState.alexBubble ? String(cloudState.alexBubble) : ''; }

  function applyState(force){
    const bubble = bubbleEl();
    const text = cloudText();
    if(!bubble || !text) return;
    if(panelOpen() && !force) return;
    applying = true;
    bubble.textContent = text;
    bubble.setAttribute('data-cloud', '1');
    setTimeout(function(){ applying = false; }, 30);
  }

  async function loadState(force){
    try{
      const res = await fetch(STATE_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if(!res.ok) return;
      cloudState = await res.json();
      window.kittenNestCloudState = cloudState;
      applyState(force);
    }catch(e){ console.log('nest cloud state unavailable', e); }
  }

  function installObserver(){
    const bubble = bubbleEl();
    if(!bubble || bubble.__cloudObserverInstalled) return;
    bubble.__cloudObserverInstalled = true;
    const mo = new MutationObserver(function(){
      if(applying) return;
      const text = cloudText();
      if(text && bubble.textContent !== text && !panelOpen()){
        setTimeout(function(){ applyState(false); }, 220);
      }
    });
    mo.observe(bubble, { childList:true, characterData:true, subtree:true });
  }

  function tick(force){ installObserver(); loadState(force); }

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick(true); });
  window.addEventListener('focus', function(){ tick(true); });
  window.addEventListener('load', function(){ tick(true); setInterval(function(){ tick(false); }, 4000); });
  setTimeout(function(){ tick(true); }, 250);
  setTimeout(function(){ tick(true); }, 900);
  setTimeout(function(){ tick(true); }, 1800);
})();
</script>`;

module.exports = async function handler(req, res) {
  const file = path.join(process.cwd(), 'index.html');
  const state = await readCloudState();
  let html = fs.readFileSync(file, 'utf8');
  html = hydrateHtml(html, state);
  html = html.replace('</body>', bridge + '\n</body>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
