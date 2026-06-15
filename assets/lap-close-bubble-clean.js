(function(){
  var VERSION = 'lap-close-bubble-clean-20260614-test-1';
  var enabled = new URLSearchParams(location.search).get('lapBubbleTest') === '1';
  if(!enabled) return;

  var TEXT = '坐稳，小猫。';
  var CARD = {
    id: 'coffeeCorner.lapCloseBubble.cleanRouter',
    selector: '#sceneRouterCleanLapBubble',
    imageId: 'gameBg',
    roomElementId: 'gameRoom',
    coordinate: { x: 0.365, y: 0.205, width: 0.43, anchor: 'topLeft', heightMode: 'auto' }
  };

  function $(id){ return document.getElementById(id); }
  function room(){ return $('gameRoom'); }
  function image(){ return $('gameBg'); }
  function bubble(){ return $('sceneRouterCleanLapBubble'); }
  function activeLap(){ return document.body.classList.contains('sceneRouterCleanLap') && room() && room().classList.contains('active'); }

  function ensureStyle(){
    if($('lapCloseBubbleCleanStyle')) return;
    var style = document.createElement('style');
    style.id = 'lapCloseBubbleCleanStyle';
    style.textContent = [
      '#sceneRouterCleanLapBubble{display:none;position:absolute;z-index:66;max-width:min(54vw,310px);padding:12px 14px;border-radius:20px;background:rgba(255,248,245,.88);border:1.4px solid rgba(255,255,255,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 10px 28px rgba(83,38,51,.18),inset 0 0 0 1px rgba(120,50,70,.1);font-size:clamp(14px,3.45vw,19px);line-height:1.28;color:#733447;font-weight:540;text-shadow:0 1px rgba(255,255,255,.72);pointer-events:none}',
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
      el.setAttribute('data-coordinate-overlay', CARD.id);
      el.setAttribute('data-owner', 'sceneRouterClean');
      el.setAttribute('data-scene', 'lapClose');
      r.appendChild(el);
    }
    el.textContent = TEXT;
    el.setAttribute('data-has-text', TEXT ? '1' : '0');
    return el;
  }

  function coverBox(img){
    if(!img) return null;
    var rect = img.getBoundingClientRect();
    var naturalW = img.naturalWidth || rect.width;
    var naturalH = img.naturalHeight || rect.height;
    if(!rect.width || !rect.height || !naturalW || !naturalH) return null;
    var boxRatio = rect.width / rect.height;
    var imgRatio = naturalW / naturalH;
    var drawW = rect.width;
    var drawH = rect.height;
    var offsetX = 0;
    var offsetY = 0;
    if(boxRatio > imgRatio){ drawH = rect.width / imgRatio; offsetY = (rect.height - drawH) / 2; }
    else{ drawW = rect.height * imgRatio; offsetX = (rect.width - drawW) / 2; }
    return { left: rect.left + offsetX, top: rect.top + offsetY, width: drawW, height: drawH };
  }

  function place(){
    var el = ensureBubble();
    if(!el) return false;
    if(!activeLap()) return false;
    var box = coverBox(image());
    if(!box) return false;
    var parent = el.offsetParent || document.body;
    var parentRect = parent.getBoundingClientRect();
    var c = CARD.coordinate;
    var w = box.width * c.width;
    var left = box.left + box.width * c.x - parentRect.left;
    var top = box.top + box.height * c.y - parentRect.top;
    el.style.setProperty('left', left + 'px', 'important');
    el.style.setProperty('top', top + 'px', 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('width', w + 'px', 'important');
    el.style.setProperty('max-width', w + 'px', 'important');
    el.style.setProperty('height', 'auto', 'important');
    return true;
  }

  function sync(){
    ensureBubble();
    place();
  }

  function start(){
    document.body.setAttribute('data-lap-bubble-test', VERSION);
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
    setTimeout(sync, 1600);
  }

  window.KittenNestLapCloseBubbleClean = { version: VERSION, card: CARD, sync: sync, place: place, setText: function(value){ TEXT = String(value || ''); sync(); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
