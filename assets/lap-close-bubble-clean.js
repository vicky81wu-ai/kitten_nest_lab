(function(){
  var VERSION = 'lap-close-bubble-clean-20260615-queue-promoted-1';
  var qs = new URLSearchParams(location.search);

  function $(id){ return document.getElementById(id); }

  function suppressLegacyBubble(){
    var old = $('sceneRouterLapBubble');
    if(old){
      old.textContent = '';
      old.setAttribute('data-has-text', '0');
      old.style.setProperty('display', 'none', 'important');
      old.style.setProperty('opacity', '0', 'important');
      old.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  function installLegacySuppressStyle(){
    if($('lapCloseLegacyBubbleSuppressStyle')) return;
    var s = document.createElement('style');
    s.id = 'lapCloseLegacyBubbleSuppressStyle';
    s.textContent = '#sceneRouterLapBubble{display:none!important;opacity:0!important;pointer-events:none!important}';
    document.head.appendChild(s);
  }

  function startSuppressor(){
    installLegacySuppressStyle();
    suppressLegacyBubble();
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, suppressLegacyBubble); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) suppressLegacyBubble(); });
    document.addEventListener('click', function(){ setTimeout(suppressLegacyBubble, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(suppressLegacyBubble, 40); }, true);
    setTimeout(suppressLegacyBubble, 80);
    setTimeout(suppressLegacyBubble, 250);
    setTimeout(suppressLegacyBubble, 700);
    setTimeout(suppressLegacyBubble, 1400);
  }

  startSuppressor();

  var text = qs.has('lapBubbleText') ? qs.get('lapBubbleText') : '';
  var queue = text ? [text] : [];
  var index = 0;
  var visible = false;
  var stamp = '';
  var lastToggleAt = 0;
  var TOGGLE_GUARD_MS = 520;
  var bubbleCard = { id:'coffeeCorner.lapCloseBubble.cleanRouter', selector:'#sceneRouterCleanLapBubble', coordinate:{ x:0.365, y:0.205, width:0.43 } };
  var bodyCard = { id:'coffeeCorner.lapBodyHot.cleanRouter', selector:'#sceneRouterCleanLapBodyHot', coordinate:{ x:0.60, y:0.695, width:0.42, height:0.22 } };

  function room(){ return $('gameRoom'); }
  function img(){ return $('gameBg'); }
  function activeLap(){ return document.body.classList.contains('sceneRouterCleanLap') && room() && room().classList.contains('active'); }
  function currentText(){
    if(!queue.length) return '';
    return queue[((index % queue.length) + queue.length) % queue.length] || '';
  }
  function cleanList(value){
    if(Array.isArray(value)) return value.map(function(x){ return String(x || '').trim(); }).filter(Boolean).slice(0,30);
    return [];
  }
  function stateList(state){
    if(!state) return [];
    var q = cleanList(state.coffeeCornerLapCloseBubbles);
    if(q.length) return q;
    var one = String(state.coffeeCornerLapCloseBubble || state.lapCloseBubble || '').trim();
    return one ? [one] : [];
  }
  function makeStamp(state){
    return String(state && (state.coffeeCornerLapCloseBubbleUpdatedAt || state.updatedAt) || '') + '|' + JSON.stringify(stateList(state));
  }
  function syncState(state){
    if(!state) return false;
    var nextStamp = makeStamp(state);
    if(nextStamp === stamp) return false;
    stamp = nextStamp;
    queue = stateList(state);
    index = Number(state.coffeeCornerLapCloseBubbleIndex || 0) || 0;
    text = currentText();
    visible = false;
    sync();
    return true;
  }
  async function refreshState(){
    try{
      var res = await fetch('/api/state?ts=' + Date.now(), { cache:'no-store' });
      var data = await res.json();
      syncState(data);
    }catch(e){ console.warn('[coffeeCornerLapCloseBubbleQueue] state read failed', e); }
  }
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
    text = currentText();
    el.textContent = text;
    el.setAttribute('data-has-text', text ? '1' : '0');
    el.setAttribute('data-visible', visible && text ? '1' : '0');
    el.setAttribute('data-coffee-corner-lap-close-bubble-queue', String(queue.length));
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
      hot.setAttribute('aria-label', 'coffee corner lap close bubble hotspot');
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
    refreshState();
    if(!currentText()) return;
    var now = Date.now();
    if(now - lastToggleAt < TOGGLE_GUARD_MS) return;
    lastToggleAt = now;
    if(visible){
      visible = false;
      if(queue.length > 1) index = (index + 1) % queue.length;
    }else{
      visible = true;
    }
    sync();
  }

  function sync(){
    suppressLegacyBubble();
    if(!activeLap()) visible = false;
    ensureBubble();
    ensureBodyHot();
    placeBubble();
    placeBodyHot();
    var el = $('sceneRouterCleanLapBubble');
    if(el) el.setAttribute('data-visible', visible && currentText() ? '1' : '0');
  }

  function start(){
    document.body.setAttribute('data-lap-bubble', VERSION);
    document.body.setAttribute('data-coffee-corner-lap-close-bubble-queue', '1');
    if(qs.get('debugLapBubble') === '1') document.body.setAttribute('data-debug-lap-bubble', '1');
    refreshState();
    sync();
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, function(){ refreshState(); sync(); }); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden){ refreshState(); sync(); } });
    document.addEventListener('click', function(){ setTimeout(function(){ refreshState(); sync(); }, 80); }, true);
    document.addEventListener('touchend', function(){ setTimeout(function(){ refreshState(); sync(); }, 80); }, true);
    setTimeout(function(){ refreshState(); sync(); }, 250);
    setTimeout(function(){ refreshState(); sync(); }, 900);
    setTimeout(function(){ refreshState(); sync(); }, 1600);
  }

  window.KittenNestLapCloseBubbleClean = { version:VERSION, bubbleCard:bubbleCard, bodyCard:bodyCard, sync:sync, refreshState:refreshState, setText:function(value){ text = String(value || ''); queue = text ? [text] : []; visible = false; sync(); }, setQueue:function(value){ queue = cleanList(value); index = 0; visible = false; sync(); }, show:function(){ if(currentText()){ visible = true; sync(); } }, hide:function(){ visible = false; sync(); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
