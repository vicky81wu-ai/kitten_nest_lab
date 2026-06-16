(function(){
  var VERSION = 'scene-overlay-lifecycle-20260615-test-1';
  var qs = new URLSearchParams(location.search);
  var enabled = qs.get('sceneOverlayLifecycleTest') === '1';
  if(!enabled) return;

  var overlays = [];
  var lastToken = 0;
  var lastScene = '';

  function $(id){ return document.getElementById(id); }
  function home(){ return $('home'); }
  function game(){ return $('gameRoom'); }
  function bg(){ return $('gameBg'); }

  function currentScene(){
    var h = home();
    var g = game();
    if(document.body.classList.contains('sceneRouterCleanLap')) return 'lapClose';
    if(document.body.classList.contains('scene-atlas')) return 'nestAtlas';
    if(g && g.classList.contains('active')) return 'coffeeCorner';
    if(h && h.classList.contains('active')) return 'home';
    return 'unknown';
  }

  function coverBox(image){
    if(!image) return null;
    var r = image.getBoundingClientRect();
    var nw = image.naturalWidth || 0;
    var nh = image.naturalHeight || 0;
    if(!r.width || !r.height || !nw || !nh) return null;
    var br = r.width / r.height;
    var ir = nw / nh;
    var w = r.width, h = r.height, x = 0, y = 0;
    if(br > ir){ h = r.width / ir; y = (r.height - h) / 2; }
    else{ w = r.height * ir; x = (r.width - w) / 2; }
    if(!w || !h) return null;
    return { left:r.left + x, top:r.top + y, width:w, height:h };
  }

  function sceneUsesGameImage(scene){
    return scene === 'coffeeCorner' || scene === 'lapClose';
  }

  function imageReady(scene){
    if(!sceneUsesGameImage(scene)) return Promise.resolve(true);
    var image = bg();
    if(!image) return Promise.resolve(false);
    if(!image.complete || !image.naturalWidth) return new Promise(function(resolve){
      var done = false;
      function finish(value){ if(done) return; done = true; resolve(value); }
      image.addEventListener('load', function(){ finish(true); }, { once:true });
      image.addEventListener('error', function(){ finish(false); }, { once:true });
      setTimeout(function(){ finish(!!(image.complete && image.naturalWidth)); }, 900);
    });
    if(image.decode) return image.decode().then(function(){ return true; }).catch(function(){ return true; });
    return Promise.resolve(true);
  }

  function coverReady(scene){
    if(!sceneUsesGameImage(scene)) return true;
    return !!coverBox(bg());
  }

  function stateReady(){
    return fetch('/api/state?ts=' + Date.now(), { cache:'no-store' })
      .then(function(res){ return res.ok; })
      .catch(function(){ return false; });
  }

  function routerSettled(){
    return new Promise(function(resolve){
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ resolve(true); });
      });
    });
  }

  function setReady(scene, ready){
    document.body.setAttribute('data-scene-overlay-lifecycle-test', VERSION);
    document.body.setAttribute('data-scene-overlay-lifecycle-current', scene);
    if(ready) document.body.setAttribute('data-scene-overlay-lifecycle-ready-scene', scene);
    else document.body.removeAttribute('data-scene-overlay-lifecycle-ready-scene');
  }

  function place(scene){
    overlays.forEach(function(item){
      if(!item || item.scene !== scene || typeof item.place !== 'function') return;
      try{ item.place({ scene:scene, version:VERSION }); }
      catch(e){ console.warn('[sceneOverlayLifecycle] overlay place failed', item.id, e); }
    });
  }

  async function reconcile(reason){
    var token = ++lastToken;
    var scene = currentScene();
    if(scene !== lastScene){
      lastScene = scene;
      setReady(scene, false);
    }else{
      document.body.setAttribute('data-scene-overlay-lifecycle-current', scene);
    }

    await routerSettled();
    if(token !== lastToken) return;

    await imageReady(scene);
    if(token !== lastToken) return;

    await stateReady();
    if(token !== lastToken) return;

    if(!coverReady(scene)){
      setTimeout(function(){ reconcile('cover-not-ready:' + reason); }, 120);
      return;
    }

    setReady(scene, true);
    place(scene);
    setTimeout(function(){ if(token === lastToken) place(scene); }, 60);
  }

  function register(item){
    if(!item || !item.id || !item.scene || typeof item.place !== 'function') return false;
    var exists = overlays.some(function(x){ return x.id === item.id; });
    if(!exists) overlays.push(item);
    reconcile('register:' + item.id);
    return true;
  }

  function request(reason){ reconcile(reason || 'request'); }

  window.KittenNestOverlayLifecycle = {
    version: VERSION,
    register: register,
    request: request,
    currentScene: currentScene,
    coverBox: coverBox,
    overlays: overlays
  };

  function start(){
    document.body.setAttribute('data-scene-overlay-lifecycle-test', VERSION);
    window.dispatchEvent(new CustomEvent('overlayLifecycleReady', { detail:{ version:VERSION } }));
    reconcile('start');
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){
      window.addEventListener(name, function(){ reconcile(name); });
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) reconcile('visibility'); });
    document.addEventListener('click', function(){ setTimeout(function(){ reconcile('click'); }, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(function(){ reconcile('touchend'); }, 40); }, true);
    var mo = new MutationObserver(function(){ reconcile('mutation'); });
    mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    setTimeout(function(){ reconcile('settle-250'); }, 250);
    setTimeout(function(){ reconcile('settle-900'); }, 900);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
