const fs = require('fs');
const path = require('path');

const bridge = `
<script>
(function(){
  const STATE_URL = '/api/state';
  let cloudState = null;
  let lastApplied = '';

  function bubbleEl(){ return document.getElementById('bubble'); }
  function panelOpen(){
    return document.querySelector('.gameMenu.show,.gomokuPanel.show,.memoriesPanel.show');
  }
  function applyState(force){
    if(!cloudState) return;
    const bubble = bubbleEl();
    const text = cloudState.alexBubble;
    if(bubble && text && (force || !panelOpen())){
      if(bubble.textContent !== text){
        bubble.textContent = text;
        lastApplied = text;
      }
    }
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

  const originalSay = window.say;
  if(typeof originalSay === 'function'){
    window.say = function(text){
      originalSay(text);
      setTimeout(function(){ applyState(false); }, 1200);
    };
  }

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) loadState(true); });
  window.addEventListener('focus', function(){ loadState(true); });
  window.addEventListener('load', function(){ loadState(true); setInterval(function(){ loadState(false); }, 15000); });
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
