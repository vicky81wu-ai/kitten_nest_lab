const appAssetctl = require('./app-assetctl');

const coffeeCornerPolishStyle = '<link rel="stylesheet" href="/assets/coffee-corner-polish.css?v=20260613-lap-bubble-empty-port-3">';
const hotspotPositionerScript = '<script src="/assets/hotspot-positioner.js?v=20260613-bubble-base-1"></script>';
const coffeeSteamScript = '<script src="/assets/coffee-steam-svg.js?v=20260613-mist-1"></script>';
const coffeeCornerVariantScript = '<script src="/assets/coffee-corner-variant.js?v=20260613-enter-canvas-verified-1"></script>';
const bubbleControllerScript = '<script src="/assets/bubble-controller.js?v=20260614-guard-1"></script>';
const hubbyNoteControllerScript = '<script src="/assets/hubby-note-controller.js?v=20260613-archive-first-paw-1"></script>';
const setupToggleScript = '<script src="/assets/setup-toggle.js?v=20260613-touchfix-1"></script>';
const consoleRestoreScript = '<script src="/assets/console-hot-restore.js?v=20260610-1"></script>';
const consoleCleanRestoreScript = '<script src="/assets/console-hot-clean-restore.js?v=20260614-clean-console-1"></script>';
const coffeeCleanLeaveGuardScript = '<script src="/assets/coffee-clean-leave-guard.js?v=20260614-clean-leave-1"></script>';
const clockHandsGuardScript = '<script src="/assets/clock-hands-guard.js?v=20260614-clock-1"></script>';
const sceneRouterScript = '<script src="/assets/scene-router.v1.js?v=20260614-router-5-rollback"></script>';
const sceneRouterCleanScript = '<script src="/assets/scene-router-clean.v1.js?v=20260614-clean-1"></script>';
const sceneRouterBootScript = `
<script>
(function(){
  function boot(){
    if(window.KittenNestSceneRouter && window.KittenNestSceneRouter.start && !window.__kittenNestSceneRouterStarted){
      window.__kittenNestSceneRouterStarted = true;
      window.KittenNestSceneRouter.start({ debug:false });
    }
  }
  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 300);
  setTimeout(boot, 1300);
})();
</script>`;
const sceneRouterCleanBootScript = `
<script>
(function(){
  function boot(){
    if(window.KittenNestSceneRouterClean && window.KittenNestSceneRouterClean.start && !window.__kittenNestSceneRouterCleanStarted){
      window.__kittenNestSceneRouterCleanStarted = true;
      window.KittenNestSceneRouterClean.start({ debug:false });
    }
  }
  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 300);
  setTimeout(boot, 1300);
})();
</script>`;
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
    if(window.KittenNestCoffeeCornerVariant && window.KittenNestCoffeeCornerVariant.boot){
      window.KittenNestCoffeeCornerVariant.boot();
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

function injectBubbleController(html, options = {}) {
  const clean = !!options.cleanDefault;
  const scripts = [
    hotspotPositionerScript,
    coffeeSteamScript
  ];
  if (!clean) scripts.push(coffeeCornerVariantScript);
  scripts.push(
    bubbleControllerScript,
    hubbyNoteControllerScript,
    setupToggleScript,
    bubbleBootScript
  );
  if (!clean) scripts.push(consoleRestoreScript);
  if (options.sceneRouterTest) scripts.push(sceneRouterScript, sceneRouterBootScript);
  if (clean) scripts.push(consoleCleanRestoreScript, coffeeCleanLeaveGuardScript, clockHandsGuardScript, sceneRouterCleanScript, sceneRouterCleanBootScript);

  const bundle = scripts.join('\n');
  return String(html)
    .replace('</head>', `${coffeeCornerPolishStyle}\n</head>`)
    .replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const url = String(req.url || '');
  const sceneRouterTest = url.includes('sceneRouterTest=1');
  const sceneRouterLegacy = url.includes('sceneRouterLegacy=1');
  const cleanDefault = !sceneRouterTest && !sceneRouterLegacy;
  const originalSend = res.send.bind(res);
  res.send = function sendWithBubbleController(body) {
    if (typeof body === 'string') return originalSend(injectBubbleController(body, { sceneRouterTest, cleanDefault }));
    return originalSend(body);
  };
  return appAssetctl(req, res);
};
