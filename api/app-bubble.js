const appAssetctl = require('./app-assetctl');

const coffeeCornerPolishStyle = '<link rel="stylesheet" href="/assets/coffee-corner-polish.css?v=20260616-coffee-bubble-coordinate-promoted-1">';
const hotspotPositionerScript = '<script src="/assets/hotspot-positioner.js?v=20260614-steam-overlay-locked-1"></script>';
const coffeeSteamScript = '<script src="/assets/coffee-steam-svg.js?v=20260613-mist-1"></script>';
const sourceOfTruthGateScript = '<script src="/assets/source-of-truth-gate.js?v=20260616-test-1"></script>';
const overlayLockTestScript = '<script src="/assets/overlay-lock-test.js?v=20260614-overlay-lock-test-1"></script>';
const overlayLifecycleCoordinatorScript = '<script src="/assets/overlay-lifecycle-coordinator.js?v=20260617-safety-test-1"></script>';
const lapCloseBubbleCleanScript = '<script src="/assets/lap-close-bubble-clean.js?v=20260616-clean-1"></script>';
const sceneManifestIsolationScript = '<script src="/assets/scene-manifest-isolation.js?v=20260616-promoted-1"></script>';
const coffeeCornerVariantScript = '<script src="/assets/coffee-corner-variant.js?v=20260613-enter-canvas-verified-1"></script>';
const bubbleControllerScript = '<script src="/assets/bubble-controller.js?v=20260616-clean-1"></script>';
const hubbyNoteControllerScript = '<script src="/assets/hubby-note-controller.js?v=20260614-no-consolehot-1"></script>';
const setupToggleScript = '<script src="/assets/setup-toggle.js?v=20260613-touchfix-1"></script>';
const consoleRestoreScript = '<script src="/assets/console-hot-restore.js?v=20260610-1"></script>';
const consoleCleanRestoreScript = '<script src="/assets/console-hot-clean-restore.js?v=20260614-clean-console-1"></script>';
const coffeeCleanLeaveGuardScript = '<script src="/assets/coffee-clean-leave-guard.js?v=20260614-clean-leave-1"></script>';
const clockHandsGuardScript = '<script src="/assets/clock-hands-guard.js?v=20260614-clock-1"></script>';
const sceneRouterScript = '<script src="/assets/scene-router.v1.js?v=20260614-router-5-rollback"></script>';
const sceneRouterCleanScript = '<script src="/assets/scene-router-clean.v1.js?v=20260616-remove-legacy-lap-bubble-1"></script>';
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

function applySourceCleanup(html){
  return String(html)
    .replace('<div id="temp" class="temp">23°C</div>', '<div id="temp" class="temp" data-source-cleanup="weather"></div>')
    .replace('<div id="desc" class="desc">Soft breeze</div>', '<div id="desc" class="desc" data-source-cleanup="weather"></div>')
    .replace("$('moon').onclick=()=>{homeDim=!homeDim;body.classList.toggle('homeDim',homeDim);$('temp').textContent=homeDim?'22°C':'23°C';$('desc').textContent=homeDim?'Moonlit breeze':'Soft breeze'};", "$('moon').onclick=()=>{homeDim=!homeDim;body.classList.toggle('homeDim',homeDim)};")
    .replace('.clock{position:absolute;left:6.15%;top:24.65%;width:31.2%;', '.clock{position:absolute;left:0;top:0;width:0;');
}

function injectBubbleController(html, options = {}) {
  const clean = !!options.cleanDefault;
  const output = applySourceCleanup(html);
  const scripts = [
    hotspotPositionerScript,
    coffeeSteamScript,
    sourceOfTruthGateScript,
    overlayLockTestScript
  ];
  if (options.overlayLifecycleTest) scripts.push(overlayLifecycleCoordinatorScript);
  scripts.push(
    lapCloseBubbleCleanScript,
    sceneManifestIsolationScript
  );
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
  return output
    .replace('</head>', `${coffeeCornerPolishStyle}\n</head>`)
    .replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const url = String(req.url || '');
  const sceneRouterTest = url.includes('sceneRouterTest=1');
  const sceneRouterLegacy = url.includes('sceneRouterLegacy=1');
  const overlayLifecycleTest = url.includes('sceneOverlayLifecycleTest=1');
  const cleanDefault = !sceneRouterTest && !sceneRouterLegacy;
  const originalSend = res.send.bind(res);
  res.send = function sendWithBubbleController(body) {
    if (typeof body === 'string') return originalSend(injectBubbleController(body, { sceneRouterTest, overlayLifecycleTest, cleanDefault }));
    return originalSend(body);
  };
  return appAssetctl(req, res);
};