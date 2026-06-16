(function(){
  var VERSION = 'coffee-corner-bubble-lifecycle-bridge-20260615-test-1';
  var qs = new URLSearchParams(location.search);
  if(qs.get('sceneOverlayLifecycleTest') !== '1') return;

  function bubble(){ return document.getElementById('bubble'); }
  function game(){ return document.getElementById('gameRoom'); }
  function inCoffeeCorner(){
    var g = game();
    return !!(g && g.classList.contains('active')) && !document.body.classList.contains('sceneRouterCleanLap');
  }
  function coffeeReady(){
    return document.body.getAttribute('data-overlay-lifecycle-ready-scene') === 'coffeeCorner';
  }
  function state(){
    return window.KittenNestState && window.KittenNestState.get ? window.KittenNestState.get() : null;
  }

  function installStyle(){
    if(document.getElementById('coffeeCornerBubbleLifecycleStyle')) return;
    var s = document.createElement('style');
    s.id = 'coffeeCornerBubbleLifecycleStyle';
    s.textContent = [
      'body[data-coffee-corner-bubble-lifecycle-test="1"] #bubble[data-coffee-corner-bubble-waiting="1"]{display:none!important;opacity:0!important}',
      'body[data-coffee-corner-bubble-lifecycle-test="1"][data-overlay-lifecycle-ready-scene="coffeeCorner"] #bubble[data-coffee-corner-bubble-waiting="1"]{display:block!important;opacity:1!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function markWaiting(){
    var b = bubble();
    if(!b) return;
    if(inCoffeeCorner() && !coffeeReady()){
      b.setAttribute('data-coffee-corner-bubble-waiting', '1');
      b.setAttribute('data-coordinate-overlay', 'coffeeCorner.bubble');
      b.setAttribute('data-scene', 'coffeeCorner');
    }
  }

  function release(){
    var b = bubble();
    if(!b) return;
    if(!inCoffeeCorner()) return;
    if(!coffeeReady()) return;
    b.removeAttribute('data-coffee-corner-bubble-waiting');
    if(window.KittenNestBubble){
      var st = state();
      if(window.KittenNestBubble.sync) window.KittenNestBubble.sync(st);
      if(window.KittenNestBubble.show) window.KittenNestBubble.show(st, { user:false });
    }
  }

  function reconcile(){
    installStyle();
    document.body.setAttribute('data-coffee-corner-bubble-lifecycle-test', '1');
    markWaiting();
    release();
  }

  function register(){
    if(!window.KittenNestOverlayLifecycle) return false;
    window.KittenNestOverlayLifecycle.register({
      id: 'coffeeCorner.bubble',
      scene: 'coffeeCorner',
      place: function(){ reconcile(); }
    });
    return true;
  }

  function start(){
    reconcile();
    register();
    window.addEventListener('overlayLifecycleReady', function(){ register(); reconcile(); });
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){
      window.addEventListener(name, reconcile);
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) reconcile(); });
    document.addEventListener('click', function(){ setTimeout(reconcile, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(reconcile, 40); }, true);
    setTimeout(reconcile, 120);
    setTimeout(reconcile, 360);
    setTimeout(reconcile, 900);
  }

  window.KittenNestCoffeeCornerBubbleLifecycleBridge = {
    version: VERSION,
    reconcile: reconcile,
    register: register
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
