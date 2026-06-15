(function(){
  var VERSION = 'scene-manifest-isolation-20260615-promoted-1';
  var qs = new URLSearchParams(location.search);
  if(qs.get('sceneManifestOff') === '1') return;

  var manifest = null;
  var disabled = new WeakMap();
  var panelMemory = new WeakMap();

  function homeSceneId(){ return 'home'; }

  function currentScene(){
    var home = document.getElementById('home');
    var game = document.getElementById('gameRoom');
    if(document.body.classList.contains('sceneRouterCleanLap')) return 'lapClose';
    if(document.body.classList.contains('scene-atlas')) return 'nestAtlas';
    if(game && game.classList.contains('active')) return 'coffeeCorner';
    if(home && home.classList.contains('active')) return homeSceneId();
    return 'unknown';
  }

  function sceneAllowedIds(sceneId){
    if(!manifest || !manifest.scenes) return {};
    var scene = manifest.scenes[sceneId];
    var out = {};
    if(!scene) return out;
    (scene.owns || []).forEach(function(id){ out[id] = true; });
    (scene.inherits || []).forEach(function(id){ out[id] = true; });
    return out;
  }

  function allObjectEntries(){
    if(!manifest || !manifest.objects) return [];
    return Object.keys(manifest.objects).map(function(id){ return { id:id, card:manifest.objects[id] }; });
  }

  function allowedSelectors(allowed){
    var out = [];
    allObjectEntries().forEach(function(entry){
      if(!allowed[entry.id]) return;
      (entry.card.selectors || []).forEach(function(sel){ out.push(sel); });
    });
    return out;
  }

  function matchesAny(el, selectors){
    if(!el || !el.matches) return false;
    return selectors.some(function(sel){ try{ return el.matches(sel); }catch(e){ return false; } });
  }

  function setDisabled(el, objectId){
    if(!disabled.has(el)){
      disabled.set(el, { pointerEvents: el.style.pointerEvents || '', opacity: el.style.opacity || '' });
    }
    el.style.setProperty('pointer-events', 'none', 'important');
    el.setAttribute('data-scene-manifest-disabled', objectId);
  }

  function restoreDisabled(el){
    var old = disabled.get(el);
    if(!old) return;
    el.style.pointerEvents = old.pointerEvents;
    if(el.getAttribute('data-scene-manifest-hide') === '1') el.style.opacity = old.opacity;
    el.removeAttribute('data-scene-manifest-disabled');
    el.removeAttribute('data-scene-manifest-hide');
    disabled.delete(el);
  }

  function closePanel(el, card, objectId){
    if(!panelMemory.has(el)){
      panelMemory.set(el, { className: el.className });
    }
    (card.closeClasses || ['show']).forEach(function(cls){ el.classList.remove(cls); });
    (card.addCloseClasses || []).forEach(function(cls){ el.classList.add(cls); });
    el.setAttribute('data-scene-manifest-closed', objectId);
    el.style.setProperty('pointer-events', 'none', 'important');
  }

  function restorePanel(el){
    var old = panelMemory.get(el);
    if(!old) return;
    el.className = old.className;
    el.removeAttribute('data-scene-manifest-closed');
    el.style.pointerEvents = '';
    panelMemory.delete(el);
  }

  function applyObject(id, card, allowed, safeSelectors){
    (card.selectors || []).forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(allowed || matchesAny(el, safeSelectors)){
          restoreDisabled(el);
          restorePanel(el);
          return;
        }
        if(card.kind === 'panel') closePanel(el, card, id);
        else if(card.kind === 'hotspot') setDisabled(el, id);
        else if(card.kind === 'textOverlay' && card.ownerScene === 'lapClose'){
          setDisabled(el, id);
          el.style.setProperty('opacity', '0', 'important');
          el.setAttribute('data-scene-manifest-hide', '1');
        }
      });
    });
  }

  function reconcile(){
    if(!manifest) return;
    var sceneId = currentScene();
    var allowed = sceneAllowedIds(sceneId);
    var safeSelectors = allowedSelectors(allowed);
    document.body.setAttribute('data-scene-manifest', VERSION);
    document.body.setAttribute('data-scene-manifest-current', sceneId);
    allObjectEntries().forEach(function(entry){
      applyObject(entry.id, entry.card, !!allowed[entry.id], safeSelectors);
    });
  }

  function trap(e){
    var target = e.target;
    if(!target || !target.closest) return;
    var blocked = target.closest('[data-scene-manifest-disabled]');
    if(!blocked) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    reconcile();
  }

  function ensureDebugStyle(){
    if(qs.get('debugSceneManifest') !== '1') return;
    if(document.getElementById('sceneManifestDebugStyle')) return;
    var style = document.createElement('style');
    style.id = 'sceneManifestDebugStyle';
    style.textContent = 'body:after{content:"sceneManifest: " attr(data-scene-manifest-current);position:absolute;left:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:130;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.34);color:rgba(255,255,255,.78);font:10px/1.2 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;pointer-events:none}';
    document.head.appendChild(style);
  }

  async function load(){
    ensureDebugStyle();
    try{
      var res = await fetch('/data/scene-manifest.home-name-test.v1.json?v=20260615-home-name-promoted-1', { cache:'no-store' });
      manifest = await res.json();
      reconcile();
    }catch(e){
      console.warn('[sceneManifest] failed to load manifest', e);
    }
  }

  function start(){
    load();
    document.addEventListener('click', trap, true);
    document.addEventListener('touchend', trap, { capture:true, passive:false });
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, function(){ setTimeout(reconcile, 30); }); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) setTimeout(reconcile, 30); });
    document.addEventListener('click', function(){ setTimeout(reconcile, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(reconcile, 40); }, true);
    setTimeout(reconcile, 120);
    setTimeout(reconcile, 360);
    setTimeout(reconcile, 900);
  }

  window.KittenNestSceneManifestIsolationTest = { version: VERSION, reconcile: reconcile, currentScene: currentScene, homeSceneId: homeSceneId };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
