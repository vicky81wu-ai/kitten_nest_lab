(function(){
  var VERSION = 'lap-bubble-clean-test-20260614-1';
  var enabled = new URLSearchParams(location.search).get('lapBubbleTest') === '1';
  if(!enabled) return;

  var DEFAULT_TEXT = 'Come here, kitten.';

  function ensureStyle(){
    if(document.getElementById('lapBubbleCleanTestStyle')) return;
    var style = document.createElement('style');
    style.id = 'lapBubbleCleanTestStyle';
    style.textContent = [
      '#sceneRouterCleanLapBubble{position:absolute;left:calc(max(18px,env(safe-area-inset-left)) + 30px);top:calc(max(18px,env(safe-area-inset-top)) + 57px);z-index:72;max-width:min(48vw,270px);padding:12px 14px;border-radius:20px;background:rgba(255,248,245,.88);border:1.4px solid rgba(255,255,255,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 10px 28px rgba(83,38,51,.18),inset 0 0 0 1px rgba(120,50,70,.1);font-size:clamp(14px,3.45vw,19px);line-height:1.28;color:#733447;font-weight:540;text-shadow:0 1px rgba(255,255,255,.72);pointer-events:none;opacity:0;transform:translateY(5px) scale(.98);transition:opacity .22s ease,transform .22s ease}',
      '#sceneRouterCleanLapBubble[data-active="1"]{opacity:1;transform:translateY(0) scale(1)}',
      '#sceneRouterCleanLapBubble:after{content:"";position:absolute;left:24px;bottom:-9px;border-width:10px 7px 0 7px;border-style:solid;border-color:rgba(255,248,245,.88) transparent transparent transparent}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureBubble(){
    ensureStyle();
    var room = document.getElementById('gameRoom');
    if(!room) return null;
    var bubble = document.getElementById('sceneRouterCleanLapBubble');
    if(!bubble){
      bubble = document.createElement('div');
      bubble.id = 'sceneRouterCleanLapBubble';
      bubble.className = 'sceneRouterCleanLapBubble';
      bubble.setAttribute('data-owner', 'sceneRouterClean');
      bubble.setAttribute('data-coordinate-owner', 'viewportSafeUpperLeft');
      bubble.textContent = DEFAULT_TEXT;
      room.appendChild(bubble);
    }
    return bubble;
  }

  function isLap(){
    var router = window.KittenNestSceneRouterClean;
    return !!(document.body.classList.contains('sceneRouterCleanLap') || (router && router.state && router.state.current === 'lapClose'));
  }

  function sync(){
    var bubble = ensureBubble();
    if(!bubble) return;
    bubble.setAttribute('data-active', isLap() ? '1' : '0');
  }

  function start(){
    document.body.setAttribute('data-lap-bubble-test', VERSION);
    sync();
    window.addEventListener('pageshow', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) sync(); });
    document.addEventListener('click', function(){ setTimeout(sync, 40); setTimeout(sync, 260); }, true);
    document.addEventListener('touchend', function(){ setTimeout(sync, 40); setTimeout(sync, 260); }, true);
    setTimeout(sync, 200);
    setTimeout(sync, 700);
    setTimeout(sync, 1400);
  }

  window.KittenNestLapBubbleCleanTest = { version: VERSION, sync: sync, text: DEFAULT_TEXT };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
