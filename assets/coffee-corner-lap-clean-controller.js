(function(){
  var VERSION = 'coffee-corner-lap-clean-controller-20260614-2';
  var LAP_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var DURATION = 820;
  var lock = false;
  var mode = 'main';
  var mainSrc = '';
  var enterHot = null;
  var backHot = null;
  var installed = false;
  var refreshTimer = null;

  var enterCard = { x: 0.275, y: 0.54, width: 0.39, height: 0.12 };
  var backCard = { x: 0.12, y: 0.86, width: 0.24, height: 0.20 };

  function room(){ return document.getElementById('gameRoom'); }
  function bg(){ return document.getElementById('gameBg'); }
  function isCoffeeActive(){ var r = room(); return !!(r && r.classList.contains('active')); }

  function currentMainSrc(){
    var image = bg();
    if(!image) return mainSrc || '/assets/rooms/coffee-corner/morning-evening.jpg';
    var src = image.getAttribute('src') || image.currentSrc || image.src || '';
    if(src && src.indexOf('lap-close-01.jpg') === -1) mainSrc = src;
    return mainSrc || src || '/assets/rooms/coffee-corner/morning-evening.jpg';
  }

  function coverBox(image){
    var r = room();
    var fallback = null;
    if(r){
      var rr = r.getBoundingClientRect();
      if(rr.width && rr.height) fallback = { left: rr.left, top: rr.top, width: rr.width, height: rr.height };
    }
    if(!image) return fallback;
    var rect = image.getBoundingClientRect();
    var naturalW = image.naturalWidth || 0;
    var naturalH = image.naturalHeight || 0;
    if(!rect.width || !rect.height || !naturalW || !naturalH) return fallback;
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

  function ensureStyle(){
    if(document.getElementById('lapCleanStyle')) return;
    var style = document.createElement('style');
    style.id = 'lapCleanStyle';
    style.textContent = [
      '#gameRoom:not(.active) .steam,#gameRoom:not(.active) .photoGlow,#gameRoom.leavingCoffeeCorner .steam,#gameRoom.leavingCoffeeCorner .photoGlow,body.leavingCoffeeCorner #gameRoom .steam,body.leavingCoffeeCorner #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important;animation:none!important}',
      'body.lapCleanTransitioning #gameRoom .hot{pointer-events:none!important}',
      '#lapCleanOverlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:36;pointer-events:none;opacity:0;transform:translateZ(0) scale(1.018) translateY(6px);filter:blur(1.2px);transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      'body.lapCleanTransitioning #gameBg{transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '.lapCleanEnterHot,.lapCleanBackHot{position:absolute;border:0;padding:0;background:transparent;border-radius:22px;z-index:60;pointer-events:auto;color:transparent;font-size:0;touch-action:manipulation}',
      'body:not(.lapCleanDebug) .lapCleanEnterHot,body:not(.lapCleanDebug) .lapCleanBackHot{outline:0;box-shadow:none}',
      'body.lapCleanDebug .lapCleanEnterHot,body.lapCleanDebug .lapCleanBackHot{background:rgba(255,80,130,.18);outline:2px solid rgba(255,80,130,.85)}'
    ].join('');
    document.head.appendChild(style);
  }

  function preload(src, done){
    var image = new Image();
    var finished = false;
    function end(){ if(finished) return; finished = true; done && done(); }
    image.onload = end; image.onerror = end; image.src = src; setTimeout(end, 900);
  }

  function ensureOverlay(){
    var r = room(); if(!r) return null;
    var overlay = document.getElementById('lapCleanOverlay');
    if(!overlay){ overlay = document.createElement('img'); overlay.id = 'lapCleanOverlay'; overlay.alt = ''; overlay.setAttribute('aria-hidden', 'true'); r.appendChild(overlay); }
    return overlay;
  }

  function makeHot(className, label, handler){
    var el = document.createElement('button');
    el.type = 'button'; el.className = 'hot ' + className; el.setAttribute('aria-label', label);
    function on(e){
      if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
      handler(); return false;
    }
    el.addEventListener('click', on, true);
    el.addEventListener('touchend', on, {capture:true, passive:false});
    return el;
  }

  function ensureHotspots(){
    var r = room(); if(!r) return false;
    if(!enterHot || !document.body.contains(enterHot)){ enterHot = makeHot('lapCleanEnterHot', '坐腿上近景 clean test', enterLap); r.appendChild(enterHot); }
    if(!backHot || !document.body.contains(backHot)){ backHot = makeHot('lapCleanBackHot', '返回咖啡角 clean test', backMain); r.appendChild(backHot); }
    return true;
  }

  function placeHot(hot, card){
    var image = bg(); var r = room(); var box = coverBox(image);
    if(!hot || !r || !box) return false;
    var parentRect = r.getBoundingClientRect();
    var w = Math.max(44, box.width * card.width);
    var h = Math.max(36, box.height * card.height);
    var cx = box.left + box.width * card.x;
    var cy = box.top + box.height * card.y;
    hot.style.left = (cx - parentRect.left - w / 2) + 'px';
    hot.style.top = (cy - parentRect.top - h / 2) + 'px';
    hot.style.width = w + 'px';
    hot.style.height = h + 'px';
    return true;
  }

  function reinstallSteam(){
    if(!isCoffeeActive() || mode !== 'main') return;
    var steam = document.querySelector('#gameRoom .steam');
    if(steam){ steam.removeAttribute('data-steam-svg'); if(!steam.querySelector('svg')) steam.innerHTML = ''; }
    if(window.KittenNestCoffeeSteam && typeof window.KittenNestCoffeeSteam.install === 'function') window.KittenNestCoffeeSteam.install();
  }

  function updateHotspots(){
    ensureStyle(); ensureHotspots(); currentMainSrc();
    var active = isCoffeeActive();
    if(active && mode === 'main' && !lock) reinstallSteam();
    if(enterHot){
      placeHot(enterHot, enterCard);
      enterHot.style.display = active && mode === 'main' && !lock ? 'block' : 'none';
      enterHot.style.pointerEvents = active && mode === 'main' && !lock ? 'auto' : 'none';
    }
    if(backHot){
      placeHot(backHot, backCard);
      backHot.style.display = active && mode === 'lap' && !lock ? 'block' : 'none';
      backHot.style.pointerEvents = active && mode === 'lap' && !lock ? 'auto' : 'none';
    }
  }

  function scheduleRefresh(){
    setTimeout(updateHotspots, 60);
    setTimeout(updateHotspots, 180);
    setTimeout(updateHotspots, 520);
    setTimeout(updateHotspots, 1100);
  }

  function clearVisual(){
    var image = bg(); var overlay = ensureOverlay();
    document.body.classList.remove('lapCleanTransitioning');
    if(image){ image.style.opacity = ''; image.style.transform = ''; image.style.filter = ''; }
    if(overlay){ overlay.style.opacity = '0'; overlay.style.transform = 'translateZ(0) scale(1.018) translateY(6px)'; overlay.style.filter = 'blur(1.2px)'; }
  }

  function swapBg(src, done){
    var image = bg(); if(!image){ done && done(); return; }
    var settled = false;
    function finish(){ if(settled) return; settled = true; image.onload = null; done && done(); }
    image.onload = finish; image.src = src; setTimeout(finish, 320);
  }

  function run(kind){
    if(lock || !isCoffeeActive()) return;
    var image = bg(); var overlay = ensureOverlay(); if(!image || !overlay) return;
    lock = true; ensureStyle(); clearVisual(); updateHotspots(); document.body.classList.add('lapCleanTransitioning');
    var target = kind === 'enter' ? LAP_URL : currentMainSrc();
    if(kind === 'enter') currentMainSrc();
    preload(target, function(){
      overlay.src = target; overlay.style.opacity = '0';
      overlay.style.transform = kind === 'enter' ? 'translateZ(0) scale(1.018) translateY(6px)' : 'translateZ(0) scale(1.042) translateY(6px)';
      overlay.style.filter = kind === 'enter' ? 'blur(1.2px)' : 'blur(.9px)';
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        if(kind === 'enter'){
          document.body.classList.add('coffeeLapVariant');
          image.style.opacity = '0'; image.style.transform = 'translateZ(0) scale(1.042) translateY(6px)'; image.style.filter = 'blur(.9px)';
          overlay.style.opacity = '1'; overlay.style.transform = 'translateZ(0) scale(1) translateY(0)'; overlay.style.filter = 'blur(0)';
        }else{
          image.style.opacity = '0'; image.style.transform = 'translateZ(0) scale(1.018) translateY(-4px)'; image.style.filter = 'blur(1.1px)';
          overlay.style.opacity = '1'; overlay.style.transform = 'translateZ(0) scale(1) translateY(0)'; overlay.style.filter = 'blur(0)';
        }
      }); });
      setTimeout(function(){
        swapBg(target, function(){
          mode = kind === 'enter' ? 'lap' : 'main';
          if(mode === 'main') document.body.classList.remove('coffeeLapVariant');
          requestAnimationFrame(function(){ requestAnimationFrame(function(){
            clearVisual(); lock = false; updateHotspots(); if(mode === 'main') reinstallSteam(); scheduleRefresh();
          }); });
        });
      }, DURATION + 20);
    });
  }

  function enterLap(){ run('enter'); }
  function backMain(){ run('back'); }

  function leavingGuard(e){
    var t = e && e.target; if(!t || !t.closest || !t.closest('.toHomeHot')) return;
    var r = room(); document.body.classList.add('leavingCoffeeCorner'); if(r) r.classList.add('leavingCoffeeCorner');
    setTimeout(function(){ document.body.classList.remove('leavingCoffeeCorner'); if(r) r.classList.remove('leavingCoffeeCorner'); scheduleRefresh(); }, 900);
  }

  function start(options){
    options = options || {}; if(options.debug) document.body.classList.add('lapCleanDebug');
    ensureStyle(); ensureOverlay(); ensureHotspots(); currentMainSrc(); updateHotspots(); reinstallSteam(); scheduleRefresh();
    if(!installed){
      installed = true;
      window.addEventListener('resize', scheduleRefresh);
      window.addEventListener('orientationchange', scheduleRefresh);
      window.addEventListener('pageshow', scheduleRefresh);
      var image = bg(); if(image) image.addEventListener('load', scheduleRefresh);
      document.addEventListener('visibilitychange', function(){ if(!document.hidden) scheduleRefresh(); });
      document.addEventListener('click', scheduleRefresh, true);
      document.addEventListener('touchend', scheduleRefresh, {capture:true, passive:true});
      document.addEventListener('click', leavingGuard, true);
      document.addEventListener('touchstart', leavingGuard, {capture:true, passive:true});
      refreshTimer = setInterval(function(){ if(isCoffeeActive()) updateHotspots(); }, 450);
      setTimeout(function(){ if(refreshTimer){ clearInterval(refreshTimer); refreshTimer = null; } }, 15000);
    }
  }

  function stop(){
    [enterHot, backHot].forEach(function(h){ if(h && h.parentNode) h.parentNode.removeChild(h); });
    enterHot = null; backHot = null; clearVisual(); document.body.classList.remove('coffeeLapVariant','lapCleanDebug'); mode = 'main'; lock = false;
  }

  window.KittenNestLapClean = { version: VERSION, start: start, stop: stop, enterLap: enterLap, backMain: backMain, updateHotspots: updateHotspots, reinstallSteam: reinstallSteam };
})();
