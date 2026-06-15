(function(){
  var VERSION = 'scene-router-v1-test-20260614-7';
  var LAP_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var state = {
    current: 'originalHome',
    stack: [],
    lock: false,
    mainCoffeeSrc: '',
    lastRouterTouchAt: 0,
    installed: false,
    needsSteamWake: false
  };

  var scenes = {
    originalHome: { id: 'originalHome', leftDock: { action: 'go', target: 'nestAtlas' }, rightDock: { action: 'go', target: 'coffeeCorner' } },
    coffeeCorner: { id: 'coffeeCorner', leftDock: { action: 'go', target: 'originalHome' }, rightDock: null },
    lapClose: { id: 'lapClose', parent: 'coffeeCorner', leftDock: { action: 'back' }, rightDock: null },
    nestAtlas: { id: 'nestAtlas', leftDock: null, rightDock: { action: 'go', target: 'originalHome' } }
  };

  function $(id){ return document.getElementById(id); }
  function home(){ return $('home'); }
  function game(){ return $('gameRoom'); }
  function bg(){ return $('gameBg'); }
  function steam(){ return document.querySelector('#gameRoom .steam'); }
  function photoGlow(){ return document.querySelector('#gameRoom .photoGlow'); }

  function ensureStyle(){
    if($('sceneRouterStyle')) return;
    var s = document.createElement('style');
    s.id = 'sceneRouterStyle';
    s.textContent = [
      'body.sceneRouterTest #sceneRouterStatus{position:absolute;left:10px;top:calc(env(safe-area-inset-top) + 36px);z-index:120;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.34);color:rgba(255,255,255,.78);font:10px/1.2 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;pointer-events:none;opacity:.68}',
      'body.sceneRouterTest #sceneAtlasPlaceholder{position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,rgba(28,15,28,.72),rgba(17,8,18,.82));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:white;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}',
      'body.sceneRouterTest.scene-atlas #sceneAtlasPlaceholder{display:flex}',
      'body.sceneRouterTest #sceneAtlasPlaceholder .box{max-width:320px;border-radius:26px;padding:22px;background:rgba(255,245,248,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 18px 40px rgba(0,0,0,.24)}',
      'body.sceneRouterTest #sceneAtlasPlaceholder h2{margin:0 0 8px;font-size:24px}',
      'body.sceneRouterTest #sceneAtlasPlaceholder p{margin:5px 0;font-size:13px;opacity:.82}',
      'body.sceneRouterTest .sceneRouterLapHot{position:absolute;border:0;padding:0;background:transparent;border-radius:22px;z-index:65;pointer-events:auto;color:transparent;font-size:0;touch-action:manipulation}',
      'body.sceneRouterDebug .sceneRouterLapHot{background:rgba(255,80,130,.18);outline:2px solid rgba(255,80,130,.85)}',
      'body.sceneRouterLocked .toGameHot,body.sceneRouterLocked .toHomeHot,body.sceneRouterLocked .sceneRouterLapHot{pointer-events:none!important}',
      'body.sceneRouterLap #bubble,body.sceneRouterLocked #bubble{opacity:0!important;pointer-events:none!important}',
      'body.sceneRouterLap #gameRoom .steam,body.sceneRouterLap #gameRoom .photoGlow,body.sceneRouterLocked #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}',
      'body.sceneRouterTest:not(.sceneRouterLap).leavingCoffeeCorner #gameRoom.active .steam,body.sceneRouterTest:not(.sceneRouterLap) #gameRoom.active.leavingCoffeeCorner .steam{display:block!important;opacity:.92!important;pointer-events:none!important}',
      'body.sceneRouterTest #home.active .clock,body.sceneRouterTest #home.active .hand,body.sceneRouterTest #home.active .weather,body.sceneRouterTest #home.active .jarSparks,body.sceneRouterTest #gameRoom.active .steam,body.sceneRouterTest #gameRoom.active .photoGlow{-webkit-backface-visibility:hidden;backface-visibility:hidden;will-change:opacity,transform}',
      'body.sceneRouterTest.overlayRepaintTick #home.active .clock{transform:rotate(7deg) translateZ(0.01px)}',
      'body.sceneRouterTest.overlayRepaintTick #gameRoom.active .steam{transform:translateZ(0.01px)}',
      '#sceneRouterFade{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:58;pointer-events:none;opacity:0;transition:opacity 360ms cubic-bezier(.22,.8,.25,1);will-change:opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureStatus(){
    var el = $('sceneRouterStatus');
    if(!el){ el = document.createElement('div'); el.id = 'sceneRouterStatus'; document.body.appendChild(el); }
    updateStatus();
  }

  function updateStatus(){
    var el = $('sceneRouterStatus');
    if(!el) return;
    el.textContent = 'sceneRouter: ' + state.current + ' | stack: ' + (state.stack.length ? state.stack.join(' > ') : 'empty');
  }

  function ensureAtlasPlaceholder(){
    if($('sceneAtlasPlaceholder')) return;
    var el = document.createElement('div');
    el.id = 'sceneAtlasPlaceholder';
    el.innerHTML = '<div class="box"><h2>Nest Atlas</h2><p>猫窝星图占位测试页</p><p>右下返回 Original Home</p><p>这里以后放 Dream / Life / Private / Story / Nest City / Future。</p></div>';
    document.body.appendChild(el);
  }

  function ensureFade(){
    var r = game();
    if(!r) return null;
    var f = $('sceneRouterFade');
    if(!f){ f = document.createElement('img'); f.id = 'sceneRouterFade'; f.alt = ''; f.setAttribute('aria-hidden', 'true'); r.appendChild(f); }
    return f;
  }

  function currentCoffeeSrc(){
    var image = bg();
    if(!image) return state.mainCoffeeSrc || '/assets/rooms/coffee-corner/morning-evening.jpg';
    var src = image.getAttribute('src') || image.currentSrc || image.src || '';
    if(src && src.indexOf('lap-close-01.jpg') === -1) state.mainCoffeeSrc = src;
    return state.mainCoffeeSrc || src || '/assets/rooms/coffee-corner/morning-evening.jpg';
  }

  function clearLegacyLeaving(){
    var g = game();
    if(!g) return;
    if(document.body.classList.contains('sceneRouterLap') || document.body.classList.contains('coffeeLapVariant')) return;
    document.body.classList.remove('leavingCoffeeCorner');
    g.classList.remove('leavingCoffeeCorner');
  }

  function repaintActiveOverlays(){
    var nodes = [];
    var h = home();
    var g = game();
    if(h && h.classList.contains('active')) nodes = nodes.concat(Array.prototype.slice.call(h.querySelectorAll('.clock,.hand,.weather,.jarSparks')));
    if(g && g.classList.contains('active')) nodes = nodes.concat(Array.prototype.slice.call(g.querySelectorAll('.steam,.photoGlow')));
    nodes.forEach(function(el){
      try{
        el.style.webkitBackfaceVisibility = 'hidden';
        el.style.backfaceVisibility = 'hidden';
        if(!el.style.willChange) el.style.willChange = 'opacity, transform';
        void el.offsetHeight;
        el.getBoundingClientRect();
      }catch(e){}
    });
    document.body.classList.add('overlayRepaintTick');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ document.body.classList.remove('overlayRepaintTick'); }); });
  }

  function setRoomActive(sceneId){
    var h = home();
    var g = game();
    document.body.classList.remove('scene-atlas');
    if(sceneId === 'originalHome'){
      if(h) h.classList.add('active');
      if(g) g.classList.remove('active');
    }else if(sceneId === 'nestAtlas'){
      if(h) h.classList.add('active');
      if(g) g.classList.remove('active');
      document.body.classList.add('scene-atlas');
    }else{
      if(h) h.classList.remove('active');
      if(g) g.classList.add('active');
      if(sceneId === 'coffeeCorner') clearLegacyLeaving();
    }
    setTimeout(repaintActiveOverlays, 0);
    setTimeout(repaintActiveOverlays, 120);
  }

  function coverBox(image){
    var r = game();
    var fallback = null;
    if(r){ var rr = r.getBoundingClientRect(); if(rr.width && rr.height) fallback = { left: rr.left, top: rr.top, width: rr.width, height: rr.height }; }
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

  function placeLapHot(){
    var hot = $('sceneRouterLapHot');
    var r = game();
    if(!r) return;
    if(!hot){
      hot = document.createElement('button');
      hot.id = 'sceneRouterLapHot';
      hot.type = 'button';
      hot.className = 'sceneRouterLapHot';
      hot.setAttribute('aria-label', 'scene router lap close');
      hot.addEventListener('click', function(e){ stop(e); push('lapClose'); }, true);
      hot.addEventListener('touchend', function(e){ stop(e); state.lastRouterTouchAt = Date.now(); push('lapClose'); }, {capture:true, passive:false});
      r.appendChild(hot);
    }
    var image = bg();
    var box = coverBox(image);
    if(!box){ hot.style.display='none'; return; }
    var parentRect = r.getBoundingClientRect();
    var c = { x: 0.275, y: 0.54, width: 0.39, height: 0.12 };
    var w = Math.max(44, box.width * c.width);
    var h = Math.max(36, box.height * c.height);
    var cx = box.left + box.width * c.x;
    var cy = box.top + box.height * c.y;
    hot.style.left = (cx - parentRect.left - w / 2) + 'px';
    hot.style.top = (cy - parentRect.top - h / 2) + 'px';
    hot.style.width = w + 'px';
    hot.style.height = h + 'px';
    hot.style.display = state.current === 'coffeeCorner' && !state.lock ? 'block' : 'none';
    hot.style.pointerEvents = state.current === 'coffeeCorner' && !state.lock ? 'auto' : 'none';
  }

  function hideLapHot(){
    var hot = $('sceneRouterLapHot');
    if(hot){ hot.style.display = 'none'; hot.style.pointerEvents = 'none'; }
  }

  function ensureSteam(){
    var s = steam();
    if(!s || state.current !== 'coffeeCorner') return false;
    clearLegacyLeaving();
    s.style.display = '';
    s.style.opacity = '';
    s.style.pointerEvents = '';
    s.style.animation = '';
    if(!s.querySelector('svg') || s.getAttribute('data-steam-svg') !== '2'){
      s.removeAttribute('data-steam-svg');
      if(window.KittenNestCoffeeSteam && window.KittenNestCoffeeSteam.install) window.KittenNestCoffeeSteam.install();
    }
    return true;
  }

  function restorePhotoGlow(){
    var p = photoGlow();
    if(!p || state.current !== 'coffeeCorner' || state.lock) return false;
    p.style.display = '';
    p.style.opacity = '';
    p.style.pointerEvents = '';
    return true;
  }

  function runLifecycle(sceneId, stage){
    if(sceneId === 'coffeeCorner'){
      if(stage === 'afterEnter'){ ensureSteam(); restorePhotoGlow(); repaintActiveOverlays(); }
    }
    if(sceneId === 'originalHome'){
      if(stage === 'onEnter') hideLapHot();
    }
  }

  function stop(e){
    if(!e) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function withLock(fn){
    if(state.lock) return;
    state.lock = true;
    document.body.classList.add('sceneRouterLocked');
    var token = Date.now();
    state.lockToken = token;
    try{ fn(); } finally {
      setTimeout(function(){
        if(state.lockToken !== token) return;
        state.lock = false;
        document.body.classList.remove('sceneRouterLocked');
        refreshScene();
      }, 460);
    }
  }

  function transitionBg(targetSrc, done){
    var image = bg();
    var fade = ensureFade();
    if(!image || !fade){ if(done) done(); return; }
    fade.src = targetSrc;
    fade.style.opacity = '0';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ fade.style.opacity = '1'; }); });
    setTimeout(function(){
      image.src = targetSrc;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ fade.style.opacity = '0'; if(done) done(); }); });
    }, 260);
  }

  function setScene(next, mode){
    var prev = state.current;
    if(!scenes[next] || state.lock) return;
    if(prev === next) return;
    withLock(function(){
      runLifecycle(prev, 'onLeave');
      if(mode === 'push') state.stack.push(prev);
      state.current = next;
      document.body.classList.toggle('sceneRouterLap', next === 'lapClose');
      document.body.classList.toggle('coffeeLapVariant', next === 'lapClose');
      if(next === 'coffeeCorner') clearLegacyLeaving();
      setRoomActive(next);
      if(next === 'coffeeCorner') ensureSteam();
      if(next === 'coffeeCorner'){
        transitionBg(currentCoffeeSrc(), function(){
          runLifecycle(next, 'onEnter');
          setTimeout(function(){ runLifecycle(next, 'afterEnter'); refreshScene(); }, 60);
        });
      }else if(next === 'lapClose'){
        currentCoffeeSrc();
        transitionBg(LAP_URL, function(){
          runLifecycle(next, 'onEnter');
          setTimeout(function(){ runLifecycle(next, 'afterEnter'); refreshScene(); }, 60);
        });
      }else{
        runLifecycle(next, 'onEnter');
        setTimeout(function(){ runLifecycle(next, 'afterEnter'); refreshScene(); }, 60);
      }
    });
  }

  function go(target){ setScene(target, 'go'); }
  function push(target){ setScene(target, 'push'); }
  function back(){
    if(state.lock) return;
    var target = state.stack.length ? state.stack.pop() : (scenes[state.current] && scenes[state.current].parent) || 'originalHome';
    setScene(target, 'back');
  }
  function jumpTo(target){ state.stack = []; setScene(target, 'jumpTo'); }

  function handleDock(action){
    if(!action) return;
    if(action.action === 'go') go(action.target);
    else if(action.action === 'push') push(action.target);
    else if(action.action === 'back') back();
    else if(action.action === 'jumpTo') jumpTo(action.target);
  }

  function dockSideFromTarget(target){
    if(!target || !target.closest) return '';
    if(target.closest('.toGameHot')) return 'rightDock';
    if(target.closest('.toHomeHot')) return 'leftDock';
    return '';
  }

  function capture(e){
    var side = dockSideFromTarget(e.target);
    if(!side) return;
    if(e.type === 'click' && Date.now() - state.lastRouterTouchAt < 650){ stop(e); return; }
    if(e.type === 'touchend') state.lastRouterTouchAt = Date.now();
    stop(e);
    handleDock(scenes[state.current] && scenes[state.current][side]);
  }

  function refreshScene(){
    updateStatus();
    if(state.current === 'coffeeCorner'){
      clearLegacyLeaving();
      placeLapHot();
      ensureSteam();
      if(!state.lock) restorePhotoGlow();
    }else{
      hideLapHot();
    }
    repaintActiveOverlays();
  }

  function start(options){
    options = options || {};
    document.body.classList.add('sceneRouterTest');
    if(options.debug) document.body.classList.add('sceneRouterDebug');
    ensureStyle();
    ensureStatus();
    ensureAtlasPlaceholder();
    ensureFade();
    currentCoffeeSrc();
    setRoomActive('originalHome');
    state.current = 'originalHome';
    state.stack = [];
    state.needsSteamWake = false;
    refreshScene();
    if(!state.installed){
      state.installed = true;
      document.addEventListener('click', capture, true);
      document.addEventListener('touchend', capture, {capture:true, passive:false});
      window.addEventListener('resize', refreshScene);
      window.addEventListener('orientationchange', refreshScene);
      window.addEventListener('pageshow', function(){ setTimeout(refreshScene, 80); setTimeout(refreshScene, 420); });
      window.addEventListener('focus', function(){ setTimeout(refreshScene, 80); setTimeout(refreshScene, 420); });
      document.addEventListener('visibilitychange', function(){ if(!document.hidden){ setTimeout(refreshScene, 80); setTimeout(refreshScene, 420); } });
      setTimeout(refreshScene, 250);
      setTimeout(refreshScene, 900);
      setTimeout(refreshScene, 1600);
    }
  }

  window.KittenNestSceneRouter = {
    version: VERSION,
    start: start,
    go: go,
    push: push,
    back: back,
    jumpTo: jumpTo,
    state: state,
    scenes: scenes,
    refreshScene: refreshScene
  };
})();
