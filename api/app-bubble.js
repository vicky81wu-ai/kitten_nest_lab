const appAssetctl = require('./app-assetctl');

const bubbleControllerScript = '<script src="/assets/bubble-controller.js?v=20260610-1"></script>';
const hubbyNoteControllerScript = '<script src="/assets/hubby-note-controller.js?v=20260610-editor-1"></script>';
const bubbleBootScript = `
<script>
(function(){
  function boot(){
    if(!window.KittenNestState || !window.KittenNestBubble) return;
    if(!window.__kittenNestBubbleAttached){
      window.__kittenNestBubbleAttached = window.KittenNestBubble.attach(window.KittenNestState);
    }
    if(window.KittenNestHubbyNote && !window.__kittenNestHubbyNoteAttached){
      window.__kittenNestHubbyNoteAttached = window.KittenNestHubbyNote.attach(window.KittenNestState);
    }
    window.KittenNestState.refresh('bubble').catch(function(){});
  }
  window.addEventListener('load', boot);
  window.addEventListener('focus', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 300);
  setTimeout(boot, 1300);
})();
</script>`;

function injectBubbleController(html) {
  const bundle = `${bubbleControllerScript}\n${hubbyNoteControllerScript}\n${bubbleBootScript}\n`;
  return String(html).replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithBubbleController(body) {
    if (typeof body === 'string') return originalSend(injectBubbleController(body));
    return originalSend(body);
  };
  return appAssetctl(req, res);
};
