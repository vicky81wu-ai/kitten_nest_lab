(function(){
  var qs = new URLSearchParams(location.search);
  var lifecycleTest = qs.get('sceneOverlayLifecycleTest') === '1';
  var index = 0;
  var stamp = '';
  var hidden = false;
  var lastAdvanceAt = 0;
  var ADVANCE_GUARD_MS = 720;

  function bubble(){ return document.getElementById('bubble'); }
  function tattoo(){ return document.querySelector('.tattooHot'); }
  function currentScene(){
    var game = document.getElementById('gameRoom');
    if(document.body.classList.contains('sceneRouterCleanLap')) return 'lapClose';
    if(game && game.classList.contains('active')) return 'coffeeCorner';
    return 'other';
  }
  function lifecycleReady(){
    if(!lifecycleTest || currentScene() !== 'coffeeCorner') return true;
    return document.body.getAttribute('data-overlay-lifecycle-ready-scene') === 'coffeeCorner';
  }

  function ensureLifecycleStyle(){
    if(!lifecycleTest || document.getElementById('coffeeCornerBubbleLifecycleStyle')) return;
    var s = document.createElement('style');
    s.id = 'coffeeCornerBubbleLifecycleStyle';
    s.textContent = [
      'body[data-scene-overlay-lifecycle-test] #bubble[data-bubble-controller="guarded"]{visibility:hidden!important}',
      'body[data-scene-overlay-lifecycle-test][data-overlay-lifecycle-ready-scene="coffeeCorner"] #gameRoom.active #bubble[data-bubble-controller="guarded"]:not(.hidden){visibility:visible!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function list(state){
    if(!state) return [];
    if(Array.isArray(state.alexBubbles)){
      return state.alexBubbles.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    }
    return state.alexBubble ? [String(state.alexBubble)] : [];
  }

  function makeStamp(state){
    var q = list(state);
    return String(state && state.updatedAt || '') + '|' + JSON.stringify(q);
  }

  function current(state){
    var q = list(state);
    if(!q.length) return '';
    return q[((index % q.length) + q.length) % q.length];
  }

  function isUserHidden(){
    var b = bubble();
    return hidden || !!(b && b.getAttribute('data-bubble-user-hidden') === '1');
  }

  function markHidden(value){
    var b = bubble();
    hidden = !!value;
    if(!b) return;
    if(value) b.setAttribute('data-bubble-user-hidden', '1');
    else b.removeAttribute('data-bubble-user-hidden');
  }

  function show(state, options){
    options = options || {};
    ensureLifecycleStyle();
    var b = bubble();
    var text = current(state);
    if(!b || !text) return false;
    b.textContent = text;
    b.setAttribute('data-bubble-controller', 'guarded');
    if(lifecycleTest) b.setAttribute('data-overlay-lifecycle-bound', 'coffeeCorner.bubble');
    if(isUserHidden() && !options.user){
      return true;
    }
    markHidden(false);
    if(!lifecycleReady()){
      b.classList.add('hidden');
      if(window.KittenNestOverlayLifecycle) window.KittenNestOverlayLifecycle.request('coffee-corner-bubble-show-wait');
      return true;
    }
    b.classList.remove('hidden');
    return true;
  }

  function hide(){
    var b = bubble();
    if(!b) return false;
    markHidden(true);
    b.classList.add('hidden');
    return true;
  }

  function next(state, options){
    options = options || {};
    var q = list(state);
    if(!q.length) return false;
    var now = Date.now();
    if(!options.force && now - lastAdvanceAt < ADVANCE_GUARD_MS) return true;
    lastAdvanceAt = now;
    index = (index + 1) % q.length;
    return show(state, { user:true });
  }

  function sync(state){
    ensureLifecycleStyle();
    var nextStamp = makeStamp(state);
    if(nextStamp && nextStamp !== stamp){
      stamp = nextStamp;
      index = Number(state && state.bubbleIndex || 0) || 0;
      show(state, { user:false });
      return true;
    }
    if(lifecycleTest && lifecycleReady() && !isUserHidden()){
      var b = bubble();
      if(b) b.classList.remove('hidden');
    }
    return false;
  }

  function registerOverlayLifecycle(){
    if(!lifecycleTest || !window.KittenNestOverlayLifecycle) return false;
    window.KittenNestOverlayLifecycle.register({
      id: 'coffeeCorner.bubble',
      scene: 'coffeeCorner',
      place: function(){
        var client = window.KittenNestState;
        if(client && client.get) sync(client.get());
      }
    });
    return true;
  }

  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;
    ensureLifecycleStyle();
    client.subscribe(function(payload){ sync(payload && payload.state); });
    if(client.get) sync(client.get());
    registerOverlayLifecycle();
    window.addEventListener('overlayLifecycleReady', registerOverlayLifecycle);
    return true;
  }

  window.KittenNestBubble = {
    version: 'guarded-bubble-controller-20260615-overlay-lifecycle-test-1',
    list: list,
    current: current,
    show: show,
    hide: hide,
    next: next,
    sync: sync,
    attach: attach,
    bubble: bubble,
    tattoo: tattoo,
    isUserHidden: isUserHidden,
    markHidden: markHidden
  };
})();
