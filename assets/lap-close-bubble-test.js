(function(){
  var VERSION = 'lap-close-bubble-test-20260614-1';
  var enabled = new URLSearchParams(location.search).get('lapBubbleTest') === '1';
  if(!enabled) return;

  var TEXT = 'Come here, kitten. I’ve got you.';

  function game(){ return document.getElementById('gameRoom'); }
  function bubble(){ return document.getElementById('sceneRouterCleanLapBubble'); }

  function ensureStyle(){
    if(document.getElementById('lapCloseBubbleTestStyle')) return;
    var s = document.createElement('style');
    s.id = 'lapCloseBubbleTestStyle';
    s.textContent = [
      '#sceneRouterCleanLapBubble{display:none;position:absolute;left:calc(max(18px, env(safe-area-inset-left)) + 24px);top:calc(max(18px, env(safe-area-inset-top)) + 58px);z-index:66;max-width:min(50vw,280px);padding:12px 14px;border-radius:20px;background:rgba(255,248,245,.88);border:1.4px solid rgba(255,255,255,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 10px 28px rgba(83,38,51,.18),inset 0 0 0 1px rgba(120,50,70,.1);font-size:clamp(14px,3.45vw,19px);line-height:1.28;color:#733447;font-weight:540;text-shadow:0 1px rgba(255,255,255,.72);pointer-events:none}',
      'body.sceneRouterCleanLap #sceneRouterCleanLapBubble{display:block}',
      '#sceneRouterCleanLapBubble:after{content:"";position:absolute;left:24px;bottom:-9px;border-width:10px 7px 0 7px;border-style:solid;border-color:rgba(255,248,245,.88) transparent transparent transparent}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureBubble(){
    var g = game();
    if(!g) return null;
    var b = bubble();
    if(!b){
      b = document.createElement('div');
      b.id = 'sceneRouterCleanLapBubble';
      b.setAttribute('aria-hidden', 'true');
      g.appendChild(b);
    }
    b.textContent = TEXT;
    return b;
  }

  function refresh(){
    ensureStyle();
    ensureBubble();
  }

  window.KittenNestLapCloseBubbleTest = { version: VERSION, refresh: refresh };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
  window.addEventListener('load', refresh);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) refresh(); });
})();
