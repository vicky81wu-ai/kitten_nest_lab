(function(){
  var VERSION = 'overlay-lifecycle-coordinator-20260615-test-3';
  var qs = new URLSearchParams(location.search);
  var enabled = qs.get('sceneOverlayLifecycleTest') === '1';
  if(!enabled) return;

  var items = [];
  var scheduled = false;
  var cycle = 0;

  function currentScene(){
    var home = document.getElementById('home');
    var game = document.getElementById('gameRoom');
    if(document.body.classList.contains('sceneRouterCleanLap')) return 'lapClose';
    if(document.body.classList.contains('scene-atlas')) return 'nestAtlas';
    if(game && game.classList.contains('active')) return 'coffeeCorner';
    if(home && home.classList.contains('active')) return 'home';
    return 'unknown';
  }

  function imageForScene(scene){
    if(scene === 'coffeeCorner' || scene === 'lapClose') return document.getElementById('gameBg');
    if(scene === 'home') return document.querySelector('#home img, #home .roomBg, #home .bg');
    return null;
  }

  function imageReady(img){
    if(!img) return true;
    if(img.tagName && img.tagName.toLowerCase() !== 'img') return true;
    return !!(img.complete && img.naturalWidth && img.naturalHeight);
  }

  function coverBox(img){
    if(!img || !imageReady(img)) return null;
    var r = img.getBoundingClientRect();
    var nw = img.naturalWidth || 0;
    var nh = img.naturalHeight || 0;
    if(!r.width || !r.height || !nw || !nh) return null;
    var br = r.width / r.height;
    var ir = nw / nh;
    var w = r.width, h = r.height, x = 0, y = 0;
    if(br > ir){ h = r.width / ir; y = (r.height - h) / 2; }
    else{ w = r.height * ir; x = (r.width - w) / 2; }
    if(!w || !h) return null;
    return { left:r.left + x, top:r.top + y, width:w, height:h };
  }

  function decodeImage(img){
    if(!img) return Promise.resolve();
    if(img.tagName && img.tagName.toLowerCase() !== 'img') return Promise.resolve();
    if(!imageReady(img)){
      return new Promise(function(resolve){
        var done = false;
        function finish(){ if(done) return; done = true; resolve(); }
        img.addEventListener('load', finish, { once:true });
        img.addEventListener('error', finish, { once:true });
        setTimeout(finish, 900);
      });
    }
    if(img.decode){
      try{ return img.decode().catch(function(){}); }
      catch(e){ return Promise.resolve(); }
    }
    return Promise.resolve();
  }

  function raf(){
    return new Promise(function(resolve){ requestAnimationFrame(function(){ resolve(); }); });
  }

  function stateReady(){
    return fetch('/api/state?ts=' + Date.now(), { cache:'no-store' })
      .then(function(res){ return !!res.ok; })
      .catch(function(){ return false; });
  }

  function findItem(id){
    return items.find(function(item){ return item.id === id; });
  }

  function register(item){
    if(!item || !item.id || typeof item.place !== 'function') return false;
    var old = findItem(item.id);
    if(old) Object.assign(old, item);
    else items.push(item);
    request('register:' + item.id);
    return true;
  }

  function unregister(id){
    items = items.filter(function(item){ return item.id !== id; });
  }

  function mark(scene, ready, reason){
    document.body.setAttribute('data-overlay-lifecycle', VERSION);
    document.body.setAttribute('data-overlay-lifecycle-scene', scene);
    document.body.setAttribute('data-overlay-lifecycle-cycle', String(cycle));
    document.body.setAttribute('data-overlay-lifecycle-reason', String(reason || ''));
    if(ready) document.body.setAttribute('data-overlay-lifecycle-ready-scene', scene);
    else document.body.removeAttribute('data-overlay-lifecycle-ready-scene');
  }

  function place(reason){
    var scene = currentScene();
    cycle += 1;
    mark(scene, true, reason);
    items.forEach(function(item){
      if(item.scene && item.scene !== scene) return;
      try{ item.place({ scene: scene, reason: reason || '', cycle: cycle, version: VERSION }); }
      catch(e){ console.warn('[overlayLifecycle] place failed:', item.id, e); }
    });
  }

  function sceneNeedsCover(scene){
    return scene === 'coffeeCorner' || scene === 'lapClose';
  }

  function request(reason){
    if(scheduled) return;
    scheduled = true;
    var requestedScene = currentScene();
    var img = imageForScene(requestedScene);
    mark(requestedScene, false, reason || 'request');
    decodeImage(img)
      .then(raf)
      .then(raf)
      .then(stateReady)
      .then(function(){
        scheduled = false;
        var scene = currentScene();
        var currentImg = imageForScene(scene);
        if(sceneNeedsCover(scene) && !coverBox(currentImg)){
          setTimeout(function(){ request('cover-not-ready:' + (reason || 'request')); }, 120);
          return;
        }
        place(reason || 'request');
        setTimeout(function(){ place((reason || 'request') + ':settle'); }, 60);
      });
  }

  function bindImage(img){
    if(!img || img.getAttribute('data-overlay-lifecycle-bound') === '1') return;
    img.setAttribute('data-overlay-lifecycle-bound', '1');
    img.addEventListener('load', function(){ request('image-load'); });
    img.addEventListener('error', function(){ request('image-error'); });
  }

  function scanImages(){
    bindImage(document.getElementById('gameBg'));
    document.querySelectorAll('#home img').forEach(bindImage);
  }

  function start(){
    document.body.setAttribute('data-overlay-lifecycle', VERSION);
    scanImages();
    if(document.body){
      var bodyObserver = new MutationObserver(function(){ request('body-class'); });
      bodyObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });
    }
    var childObserver = new MutationObserver(function(){ scanImages(); request('dom-child'); });
    childObserver.observe(document.documentElement, { childList:true, subtree:true });
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){
      window.addEventListener(name, function(){ request(name); });
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) request('visibilitychange'); });
    document.addEventListener('click', function(){ request('click'); }, true);
    document.addEventListener('touchend', function(){ request('touchend'); }, true);
    window.dispatchEvent(new CustomEvent('overlayLifecycleReady', { detail:{ version:VERSION } }));
    request('start');
  }

  window.KittenNestOverlayLifecycle = {
    version: VERSION,
    register: register,
    unregister: unregister,
    request: request,
    place: place,
    currentScene: currentScene,
    coverBox: coverBox,
    items: items
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
