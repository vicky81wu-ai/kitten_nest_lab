(function(){
  var VERSION = 'lap-close-bubble-clean-20260614-1';
  var TEXT = 'Come closer, kitten.';

  function room(){ return document.getElementById('gameRoom'); }
  function bubble(){ return document.getElementById('sceneRouterCleanLapBubble'); }

  function ensureStyle(){
    if(document.getElementById('lapCloseBubbleCleanStyle')) return;
    var style = document.createElement('style');
    style.id = 'lapCloseBubbleCleanStyle';
    style.textContent = [
      '#sceneRouterCleanLapBubble{display:none;position:absolute;left:calc(max(18px, env(safe-area-inset-left)) + 30px);top:calc(max(18px, env(safe-area-inset-top)) + 57px);z-index:66;max-width:min(48vw,270px);padding:12px 14px;border-radius:20px;background:rgba(255,248,245,.88);border:1.4px solid rgba(255,255,255,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 10px 28px rgba(83,38,51,.18),inset 0 0 0 1px rgba(120,50,70,.1);font-size:clamp(14px,3.45vw,19px);line-height:1.28;color:#733447;font-weight:540;text-shadow:0 1px rgba(255,255,255,.72);pointer-events:none}',
      '#sceneRouterCleanLapBubble:after{content:"";position:absolute;left:24px;bottom:-9px;border-width:10px 7px 0 7px;border-style:solid;border-color:rgba(255,248,245,.88) transparent transparent transparent}',
      'body.sceneRouterCleanLap #sceneRouterCleanLapBubble[data-has-text="1"]{display:block}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureBubble(){
    ensureStyle();
    var r = room();
    if(!r) return null;
    var el = bubble();
    if(!el){
      el = document.createElement('div');
      el.id = 'sceneRouterCleanLapBubble';
      el.setAttribute('aria-hidden', 'true');
      r.appendChild(el);
    }
    el.textContent = TEXT;
    el.setAttribute('data-has-text', TEXT ? '1' : '0');
    return el;
  }

  function sync(){ ensureBubble(); }

  function start(){
    sync();
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) sync(); });
    document.addEventListener('click', function(){ setTimeout(sync, 80); }, true);
    document.addEventListener('touchend', function(){ setTimeout(sync, 80); }, true);
    setTimeout(sync, 250);
    setTimeout(sync, 900);
  }

  window.KittenNestLapCloseBubbleClean = { version: VERSION, sync: sync, setText: function(value){ TEXT = String(value || ''); sync(); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
