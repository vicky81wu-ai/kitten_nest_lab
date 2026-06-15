(function(){
  var VERSION = 'overlay-lifecycle-coordinator-20260615-1';
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

  function decodeImage(img){
    if(!img || !img.decode || !imageReady(img)) return Promise.resolve();
    try{ return img.decode().catch(function(){}); }
    catch(e){ return Promise.resolve(); }
  }

  function raf(){
    return new Promise(function(resolve){ requestAnimationFrame(function(){ resolve(); }); });
  }

  function findItem(id){
    return items.find(function(item){ return item.id === id; });
  }

  function register(item){
    if(!item || !item.id || typeof item.place !== 'function') return;
    var old = findItem(item.id);
    if(old) Object.assign(old, item);
    else items.push(item);
    request('register:' + item.id);
  }

  function unregister(id){
    items = items.filter(function(item){ return item.id !== id; });
  }

  function place(reason){
    var scene = currentScene();
    document.body.setAttribute('data-overlay-lifecycle', VERSION);
    document.body.setAttribute('data-overlay-lifecycle-scene', scene);
    document.body.setAttribute('data-overlay-lifecycle-cycle', String(++cycle));
    items.forEach(function(item){
      if(item.scene && item.scene !== scene) return;
      try{ item.place({ scene: scene, reason: reason || '', cycle: cycle }); }
      catch(e){ console.warn('[overlayLifecycle] place failed:', item.id, e); }
    });
  }

  function request(reason){
    if(scheduled) return;
    scheduled = true;
    var requestedScene = currentScene();
    var img = imageForScene(requestedScene);
    decodeImage(img).then(function(){ return raf(); }).then(raf).then(function(){
      scheduled = false;
      place(reason || 'request');
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
    scanImages();
    var mo = new MutationObserver(function(){ scanImages(); request('dom-mutation'); });
    mo.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','src','style'] });
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){
      window.addEventListener(name, function(){ request(name); });
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) request('visibilitychange'); });
    document.addEventListener('click', function(){ request('click'); }, true);
    document.addEventListener('touchend', function(){ request('touchend'); }, true);
    request('start');
  }

  window.KittenNestOverlayLifecycle = {
    version: VERSION,
    register: register,
    unregister: unregister,
    request: request,
    place: place,
    currentScene: currentScene
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
