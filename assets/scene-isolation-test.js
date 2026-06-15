(function(){
  var VERSION = 'scene-isolation-test-20260615-1';
  var qs = new URLSearchParams(location.search);
  if(qs.get('sceneIsolationTest') !== '1') return;

  var parentHotSelectors = [
    '.consoleHot',
    '.photoHot',
    '.tattooHot',
    '.weather',
    '#setupToggleButton'
  ];
  var panelSelectors = [
    '.gameMenu',
    '.gomokuPanel',
    '.memoriesPanel',
    '#setup',
    '#hubbyNotePanel'
  ];

  function inLap(){
    var game = document.getElementById('gameRoom');
    return document.body.classList.contains('sceneRouterCleanLap') && !!(game && game.classList.contains('active'));
  }

  function ensureStyle(){
    if(document.getElementById('sceneIsolationTestStyle')) return;
    var style = document.createElement('style');
    style.id = 'sceneIsolationTestStyle';
    style.textContent = [
      'body.sceneIsolationTest.sceneRouterCleanLap .consoleHot,body.sceneIsolationTest.sceneRouterCleanLap .photoHot,body.sceneIsolationTest.sceneRouterCleanLap .tattooHot,body.sceneIsolationTest.sceneRouterCleanLap .weather,body.sceneIsolationTest.sceneRouterCleanLap #setupToggleButton{pointer-events:none!important}',
      'body.sceneIsolationTest.sceneRouterCleanLap .gameMenu,body.sceneIsolationTest.sceneRouterCleanLap .gomokuPanel,body.sceneIsolationTest.sceneRouterCleanLap .memoriesPanel,body.sceneIsolationTest.sceneRouterCleanLap #setup,body.sceneIsolationTest.sceneRouterCleanLap #hubbyNotePanel{display:none!important;pointer-events:none!important}',
      'body.sceneIsolationTestDebug.sceneRouterCleanLap:after{content:"sceneIsolationTest";position:absolute;left:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:130;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.34);color:rgba(255,255,255,.78);font:10px/1.2 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;pointer-events:none}'
    ].join('');
    document.head.appendChild(style);
  }

  function closePanels(){
    panelSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.classList.remove('show');
        if(el.id === 'setup') el.classList.add('hidden');
      });
    });
  }

  function markHotspots(){
    parentHotSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.setAttribute('data-scene-isolated-parent-hot', '1');
      });
    });
  }

  function sync(){
    ensureStyle();
    document.body.classList.add('sceneIsolationTest');
    document.body.classList.toggle('sceneIsolationTestActive', inLap());
    if(qs.get('debugSceneIsolation') === '1') document.body.classList.add('sceneIsolationTestDebug');
    markHotspots();
    if(inLap()) closePanels();
  }

  function trapParentHot(e){
    if(!inLap()) return;
    var t = e.target;
    if(!t || !t.closest) return;
    var hit = parentHotSelectors.some(function(sel){ return !!t.closest(sel); });
    if(!hit) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    closePanels();
  }

  function start(){
    document.body.setAttribute('data-scene-isolation-test', VERSION);
    ensureStyle();
    sync();
    document.addEventListener('click', trapParentHot, true);
    document.addEventListener('touchend', trapParentHot, { capture:true, passive:false });
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, sync); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) sync(); });
    document.addEventListener('click', function(){ setTimeout(sync, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(sync, 40); }, true);
    setTimeout(sync, 120);
    setTimeout(sync, 360);
    setTimeout(sync, 900);
  }

  window.KittenNestSceneIsolationTest = { version: VERSION, sync: sync, closePanels: closePanels, inLap: inLap };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
