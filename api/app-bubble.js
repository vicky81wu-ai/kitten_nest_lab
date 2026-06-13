const appAssetctl = require('./app-assetctl');

const coffeeCornerPolishStyle = '<link rel="stylesheet" href="/assets/coffee-corner-polish.css?v=20260613-css-sunbeam-4">';
const hotspotPositionerScript = '<script src="/assets/hotspot-positioner.js?v=20260613-bubble-base-1"></script>';
const coffeeSteamScript = '<script src="/assets/coffee-steam-svg.js?v=20260613-mist-1"></script>';
const bubbleControllerScript = '<script src="/assets/bubble-controller.js?v=20260610-1"></script>';
const hubbyNoteControllerScript = '<script src="/assets/hubby-note-controller.js?v=20260613-archive-first-paw-1"></script>';
const setupToggleScript = '<script src="/assets/setup-toggle.js?v=20260613-touchfix-1"></script>';
const consoleRestoreScript = '<script src="/assets/console-hot-restore.js?v=20260610-1"></script>';
const bubbleBootScript = `
<script>
(function(){
  function boot(){
    if(window.KittenNestHotspots && window.KittenNestHotspots.start && !window.__kittenNestHotspotsStarted){
      window.__kittenNestHotspotsStarted = true;
      window.KittenNestHotspots.start();
    }
    if(window.KittenNestCoffeeSteam && window.KittenNestCoffeeSteam.install){
      window.KittenNestCoffeeSteam.install();
    }
    if(!window.KittenNestState || !window.KittenNestBubble) return;
    if(!window.__kittenNestBubbleAttached){
      window.__kittenNestBubbleAttached = window.KittenNestBubble.attach(window.KittenNestState);
    }
    if(window.KittenNestHubbyNote && !window.__kittenNestHubbyNoteAttached){
      window.__kittenNestHubbyNoteAttached = window.KittenNestHubbyNote.attach(window.KittenNestState);
    }
    if(window.KittenNestHubbyNote && window.KittenNestHubbyNote.renderAuth){
      window.KittenNestHubbyNote.renderAuth();
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
  const bundle = `${hotspotPositionerScript}\n${coffeeSteamScript}\n${bubbleControllerScript}\n${hubbyNoteControllerScript}\n${setupToggleScript}\n${bubbleBootScript}\n${consoleRestoreScript}\n`;
  return String(html)
    .replace('</head>', `${coffeeCornerPolishStyle}\n</head>`)
    .replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithBubbleController(body) {
    if (typeof body === 'string') return originalSend(injectBubbleController(body));
    return originalSend(body);
  };
  return appAssetctl(req, res);
};
