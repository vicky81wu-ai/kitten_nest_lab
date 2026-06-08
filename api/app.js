const fs = require('fs');
const path = require('path');

const bridge = `
<script>
(function(){
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
        setTimeout(function(){ applyState(false); }, 350);
      }
    });
    mo.observe(bubble, { childList:true, characterData:true, subtree:true });
  }

  function tick(force){
    installObserver();
    loadState(force);
  }

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick(true); });
  window.addEventListener('focus', function(){ tick(true); });
  window.addEventListener('load', function(){ tick(true); setInterval(function(){ tick(false); }, 5000); });
  setTimeout(function(){ tick(true); }, 500);
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
