(function(){
  var index = 0;
  var stamp = '';
  var hidden = false;
  var lastAdvanceAt = 0;
  var ADVANCE_GUARD_MS = 720;

  function bubble(){ return document.getElementById('bubble'); }
  function tattoo(){ return document.querySelector('.tattooHot'); }
  function cleanList(value){
    return Array.isArray(value)
      ? value.map(function(x){ return String(x || '').trim(); }).filter(Boolean)
      : [];
  }

  function list(state){
    if(!state) return [];
    var canonical = cleanList(state.coffeeCornerBubbles);
    if(canonical.length) return canonical;
    if(state.coffeeCornerBubble) return [String(state.coffeeCornerBubble).trim()].filter(Boolean);
    var legacy = cleanList(state.alexBubbles);
    if(legacy.length) return legacy;
    return state.alexBubble ? [String(state.alexBubble)] : [];
  }

  function makeStamp(state){
    var q = list(state);
    var canonicalIndex = state && Object.prototype.hasOwnProperty.call(state, 'coffeeCornerBubbleIndex') ? state.coffeeCornerBubbleIndex : '';
    var legacyIndex = state && Object.prototype.hasOwnProperty.call(state, 'bubbleIndex') ? state.bubbleIndex : '';
    return String(state && state.updatedAt || '') + '|' + String(canonicalIndex) + '|' + String(legacyIndex) + '|' + JSON.stringify(q);
  }

  function currentIndex(state){
    if(state && Object.prototype.hasOwnProperty.call(state, 'coffeeCornerBubbleIndex')){
      return Number(state.coffeeCornerBubbleIndex || 0) || 0;
    }
    return Number(state && state.bubbleIndex || 0) || 0;
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
    var b = bubble();
    var text = current(state);
    if(!b || !text) return false;
    b.textContent = text;
    b.setAttribute('data-bubble-controller', 'guarded');
    b.setAttribute('data-bubble-source', cleanList(state && state.coffeeCornerBubbles).length || state && state.coffeeCornerBubble ? 'coffeeCornerBubble' : 'alexBubbleFallback');
    if(isUserHidden() && !options.user){
      return true;
    }
    markHidden(false);
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
    var nextStamp = makeStamp(state);
    if(nextStamp && nextStamp !== stamp){
      stamp = nextStamp;
      index = currentIndex(state);
      show(state, { user:false });
      return true;
    }
    return false;
  }

  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;
    client.subscribe(function(payload){ sync(payload && payload.state); });
    if(client.get) sync(client.get());
    return true;
  }

  window.KittenNestBubble = {
    version: 'guarded-bubble-controller-20260616-compat-read-1',
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
