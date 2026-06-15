(function(){
  var VERSION = 'lap-close-bubble-clean-20260614-test-2';
  var qs = new URLSearchParams(location.search);
  if(qs.get('lapBubbleTest') !== '1') return;

  var text = qs.get('lapBubbleText') || '';
  var visible = false;
  var bubbleCard = { id:'coffeeCorner.lapCloseBubble.cleanRouter', selector:'#sceneRouterCleanLapBubble', coordinate:{ x:0.365, y:0.205, width:0.43 } };
  var bodyCard = { id:'coffeeCorner.lapBodyHot.cleanRouterTest', selector:'#sceneRouterCleanLapBodyHot', coordinate:{ x:0.60, y:0.665, width:0.42, height:0.22 } };

  function $(id){ return document.getElementById(id); }
  function room(){ return $('gameRoom'); }
  function img(){ return $('gameBg'); }
  function activeLap(){ return document.body.classList.contains('sceneRouterCleanLap') && room() && room().classList.contains('active'); }
  function box(){
    var image = img();
    if(!image) return null;
    var r = image.getBoundingClientRect();
    var nw = image.naturalWidth || r.width;
    var nh = image.naturalHeight || r.height;
    if(!r.width || !r.height || !nw || !nh) return null;
    var br = r.width / r.height;
    var ir = nw / nh;
    var w = r.width, h = r.height, x = 0, y = 0;
    if(br > ir){ h = r.width / ir; y = (r.height - h) / 2; }
    else{ w = r.height * ir; x = (r.width - w) / 2; }
    return { left:r.left + x, top:r.top + y, width:w, height:h };
  }

  function style(){
    if($('lapCloseBubbleCleanStyle')) return;
    var s = document.createElement('style');
    s.id = 'lapCloseBubbleCleanStyle';
    s.textContent = [
      '#sceneRouterCleanLapBubble{display:none;position:absolute;z-index:66;padding:12px 14px;border-radius:20px;background:rgba(255,248,245,.88);border:1.4px solid rgba(255,255,255,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 10px 28px rgba(83,38,51,.18),inset 0 0 0 1px rgba(120,50,70,.1);font-size:clamp(14px,3.45vw,19px);line-height:1.28;color:#733447;font-weight:540;text-shadow:0 1px rgba(255,255,255,.72);pointer-events:none}',
      '#sceneRouterCleanLapBubble:after{content:"";position:absolute;left:24px;bottom:-9px;border-width:10px 7px 0 7px;border-style:solid;border-color:rgba(255,248,245,.88) transparent transparent transparent}',
      'body.sceneRouterCleanLap #sceneRouterCleanLapBubble[data-visible="1"][data-has-text="1"]{display:block}',
      '#sceneRouterCleanLapBodyHot{display:none;position:absolute;z-index:67;border:0;padding:0;background:transparent;border-radius:24px;color:transparent;font-size:0;touch-action:manipulation;pointer-events:none}',
      'body.sceneRouterCleanLap #sceneRouterCleanLapBodyHot{display:block;pointer-events:auto}',
      'body[data-debug-lap-bubble="1"] #sceneRouterCleanLapBodyHot{background:rgba(255,80,130,.16);outline:2px solid rgba(255,80,130,.85)}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureBubble(){
    style();
    var r = room();
    if(!r) return null;
    var el = $('sceneRouterCleanLapBubble');
    if(!el){
      el = document.createElement('div');
      el.id = 'sceneRouterCleanLapBubble';
      el.setAttribute('data-coordinate-overlay', bubbleCard.id);
      el.setAttribute('data-owner', 'sceneRouterClean');
      el.setAttribute('data-scene', 'lapClose');
      r.appendChild(el);
    }
    el.textContent = text;
    el.setAttribute('data-has-text', text ? '1' : '0');
    el.setAttribute('data-visible', visible && text ? '1' : '0');
    return el;
  }

  function ensureBodyHot(){
    style();
    var r = room();
    if(!r) return null;
    var hot = $('sceneRouterCleanLapBodyHot');
    if(!hot){
      hot = document.createElement('button');
      hot.id = 'sceneRouterCleanLapBodyHot';
      hot.type = 'button';
      hot.setAttribute('aria-label', 'lap bubble hotspot');
      hot.setAttribute('data-coordinate-hotspot', bodyCard.id);
      hot.setAttribute('data-owner', 'sceneRouterClean');
      hot.setAttribute('data-scene', 'lapClose');
      hot.addEventListener('click', toggle, true);
      hot.addEventListener('touchend', toggle, { capture:true, passive:false });
      r.appendChild(hot);
    }
    return hot;
  }

  function placeBubble(){
    var el = ensureBubble();
    var b = box();
    if(!el || !b || !activeLap()) return;
    var pr = (el.offsetParent || document.body).getBoundingClientRect();
    var c = bubbleCard.coordinate;
    var w = b.width * c.width;
    el.style.setProperty('left', (b.left + b.width * c.x - pr.left) + 'px', 'important');
    el.style.setProperty('top', (b.top + b.height * c.y - pr.top) + 'px', 'important');
    el.style.setProperty('width', w + 'px', 'important');
    el.style.setProperty('max-width', w + 'px', 'important');
    el.style.setProperty('height', 'auto', 'important');
  }

  function placeBodyHot(){
    var hot = ensureBodyHot();
    var b = box();
    if(!hot || !b || !activeLap()) return;
    var pr = (hot.offsetParent || document.body).getBoundingClientRect();
    var c = bodyCard.coordinate;
    var w = b.width * c.width;
    var h = b.height * c.height;
    var cx = b.left + b.width * c.x;
    var cy = b.top + b.height * c.y;
    hot.style.setProperty('left', (cx - pr.left - w / 2) + 'px', 'important');
    hot.style.setProperty('top', (cy - pr.top - h / 2) + 'px', 'important');
    hot.style.setProperty('width', w + 'px', 'important');
    hot.style.setProperty('height', h + 'px', 'important');
  }

  function toggle(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    if(!text) return;
    visible = !visible;
    sync();
  }

  function sync(){
    if(!activeLap()) visible = false;
    ensureBubble();
    ensureBodyHot();
    placeBubble();
    placeBodyHot();
    var el = $('sceneRouterCleanLapBubble');
    if(el) el.setAttribute('data-visible', visible && text ? '1' : '0');
  }

  function start(){
    document.body.setAttribute('data-lap-bubble-test', VERSION);
    if(qs.get('debugLapBubble') === '1') document.body.setAttribute('data-debug-lap-bubble', '1');
    sync();
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, sync); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) sync(); });
    document.addEventListener('click', function(){ setTimeout(sync, 80); }, true);
    document.addEventListener('touchend', function(){ setTimeout(sync, 80); }, true);
    setTimeout(sync, 250);
    setTimeout(sync, 900);
    setTimeout(sync, 1600);
  }

  window.KittenNestLapCloseBubbleClean = { version:VERSION, bubbleCard:bubbleCard, bodyCard:bodyCard, sync:sync, setText:function(value){ text = String(value || ''); visible = false; sync(); }, show:function(){ if(text){ visible = true; sync(); } }, hide:function(){ visible = false; sync(); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
