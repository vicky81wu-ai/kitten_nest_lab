(function(){
  var VERSION = 'scene-router-clean-v1-20260614-2';
  var LAP_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var state = {
    current: 'originalHome',
    stack: [],
    lock: false,
    installed: false,
    lastRouterTouchAt: 0,
    coffeeSrc: '',
    debug: false
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
    if($('sceneRouterCleanStyle')) return;
    var s = document.createElement('style');
    s.id = 'sceneRouterCleanStyle';
    s.textContent = [
      'body.sceneRouterClean #sceneRouterCleanStatus{display:none}',
      'body.sceneRouterCleanDebug #sceneRouterCleanStatus{display:block;position:absolute;left:10px;top:calc(env(safe-area-inset-top) + 36px);z-index:120;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.34);color:rgba(255,255,255,.78);font:10px/1.2 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;pointer-events:none;opacity:.68}',
      'body.sceneRouterClean #sceneAtlasPlaceholder{position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,rgba(28,15,28,.72),rgba(17,8,18,.82));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:white;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}',
      'body.sceneRouterClean.scene-atlas #sceneAtlasPlaceholder{display:flex}',
      'body.sceneRouterClean #sceneAtlasPlaceholder .box{max-width:320px;border-radius:26px;padding:22px;background:rgba(255,245,248,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 18px 40px rgba(0,0,0,.24)}',
      'body.sceneRouterClean #sceneAtlasPlaceholder h2{margin:0 0 8px;font-size:24px}',
      'body.sceneRouterClean #sceneAtlasPlaceholder p{margin:5px 0;font-size:13px;opacity:.82}',
      'body.sceneRouterClean .sceneRouterCleanLapHot{position:absolute;border:0;padding:0;background:transparent;border-radius:22px;z-index:65;pointer-events:auto;color:transparent;font-size:0;touch-action:manipulation}',
      'body.sceneRouterCleanDebug .sceneRouterCleanLapHot{background:rgba(255,80,130,.18);outline:2px solid rgba(255,80,130,.85)}',
      'body.sceneRouterCleanLocked .toGameHot,body.sceneRouterCleanLocked .toHomeHot,body.sceneRouterCleanLocked .sceneRouterCleanLapHot{pointer-events:none!important}',
      'body.sceneRouterCleanLap #bubble{opacity:0!important;pointer-events:none!important}',
      'body.sceneRouterCleanLap #gameRoom .steam,body.sceneRouterCleanLap #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureStatus(){
    if(!state.debug) return;
    var el = $('sceneRouterCleanStatus');
    if(!el){
      el = document.createElement('div');
      el.id = 'sceneRouterCleanStatus';
      document.body.appendChild(el);
    }
    updateStatus();
  }

  function removeStatus(){
    var el = $('sceneRouterCleanStatus');
    if(el && !state.debug) el.remove();
  }

  function updateStatus(){
    if(!state.debug) return;
    var el = $('sceneRouterCleanStatus');
    if(!el) return;
    el.textContent = 'cleanRouter: ' + state.current + ' | stack: ' + (state.stack.length ? state.stack.join(' > ') : 'empty');
  }

  function ensureAtlasPlaceholder(){
    if($('sceneAtlasPlaceholder')) return;
    var el = document.createElement('div');
    el.id = 'sceneAtlasPlaceholder';
    el.innerHTML = '<div class="box"><h2>Nest Atlas</h2><p>猫窝星图占位测试页</p><p>右下返回 Original Home</p><p>此入口只用于干净 sceneRouter 测试。</p></div>';
    document.body.appendChild(el);
  }

  function rememberCoffeeSrc(){
    var image = bg();
    if(!image) return state.coffeeSrc;
    var src = image.getAttribute('src') || image.currentSrc || image.src || '';
    if(src && src.indexOf('lap-close-01.jpg') === -1) state.coffeeSrc = src;
    return state.coffeeSrc || src || '/assets/rooms/coffee-corner/morning-evening.jpg';
  }

  function setCoffeeSrc(){
    var image = bg();
    if(!image) return;
    var src = state.coffeeSrc || rememberCoffeeSrc();
    if(src && image.getAttribute('src') !== src) image.src = src;
  }

  function setLapSrc(){
    var image = bg();
    if(!image) return;
    rememberCoffeeSrc();
    if(image.getAttribute('src') !== LAP_URL) image.src = LAP_URL;
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
    }
  }

  function coverBox(image){
    var r = game();
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

  function placeLapHot(){
    var r = game();
    if(!r) return;
    var hot = $('sceneRouterCleanLapHot');
    if(!hot){
      hot = document.createElement('button');
      hot.id = 'sceneRouterCleanLapHot';
      hot.type = 'button';
      hot.className = 'sceneRouterCleanLapHot';
      hot.setAttribute('aria-label', 'clean scene router lap close');
      hot.addEventListener('click', function(e){ stop(e); push('lapClose'); }, true);
      hot.addEventListener('touchend', function(e){ stop(e); state.lastRouterTouchAt = Date.now(); push('lapClose'); }, { capture:true, passive:false });
      r.appendChild(hot);
    }
    var box = coverBox(bg());
    if(!box){ hot.style.display = 'none'; return; }
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
    var hot = $('sceneRouterCleanLapHot');
    if(hot){ hot.style.display = 'none'; hot.style.pointerEvents = 'none'; }
  }

  function ensureCoffeeAmbient(){
    if(state.current !== 'coffeeCorner') return;
    var s = steam();
    if(s){
      s.style.display = '';
      s.style.opacity = '';
      s.style.pointerEvents = '';
      if((!s.querySelector('svg') || s.getAttribute('data-steam-svg') !== '2') && window.KittenNestCoffeeSteam && window.KittenNestCoffeeSteam.install){
        window.KittenNestCoffeeSteam.install();
      }
    }
    var p = photoGlow();
    if(p){
      p.style.display = '';
      p.style.opacity = '';
      p.style.pointerEvents = '';
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
    document.body.classList.add('sceneRouterCleanLocked');
    var token = Date.now();
    state.lockToken = token;
    try{ fn(); } finally {
      setTimeout(function(){
        if(state.lockToken !== token) return;
        state.lock = false;
        document.body.classList.remove('sceneRouterCleanLocked');
        refreshScene();
      }, 240);
    }
  }

  function setScene(next, mode){
    var prev = state.current;
    if(!scenes[next] || state.lock) return;
    if(prev === next) return;
    withLock(function(){
      if(mode === 'push') state.stack.push(prev);
      state.current = next;
      document.body.classList.toggle('sceneRouterCleanLap', next === 'lapClose');
      setRoomActive(next);
      if(next === 'coffeeCorner'){
        setCoffeeSrc();
        setTimeout(ensureCoffeeAmbient, 0);
      }else if(next === 'lapClose'){
        setLapSrc();
      }
      refreshScene();
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
      placeLapHot();
      if(!state.lock) ensureCoffeeAmbient();
    }else{
      hideLapHot();
    }
  }

  function start(options){
    options = options || {};
    state.debug = !!options.debug;
    document.body.classList.add('sceneRouterClean');
    document.body.classList.toggle('sceneRouterCleanDebug', state.debug);
    ensureStyle();
    removeStatus();
    ensureStatus();
    ensureAtlasPlaceholder();
    rememberCoffeeSrc();
    setRoomActive('originalHome');
    state.current = 'originalHome';
    state.stack = [];
    refreshScene();
    if(!state.installed){
      state.installed = true;
      document.addEventListener('click', capture, true);
      document.addEventListener('touchend', capture, { capture:true, passive:false });
      window.addEventListener('resize', refreshScene);
      window.addEventListener('orientationchange', refreshScene);
      window.addEventListener('pageshow', function(){ setTimeout(refreshScene, 80); });
      window.addEventListener('focus', function(){ setTimeout(refreshScene, 80); });
      document.addEventListener('visibilitychange', function(){ if(!document.hidden) setTimeout(refreshScene, 80); });
      setTimeout(refreshScene, 250);
      setTimeout(refreshScene, 900);
    }
  }

  window.KittenNestSceneRouterClean = {
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
