(function(){
  var index = 0;
  var stamp = '';
  var hidden = false;
  var lastAdvanceAt = 0;
  var ADVANCE_GUARD_MS = 720;

  function bubble(){ return document.getElementById('bubble'); }
  function tattoo(){ return document.querySelector('.tattooHot'); }

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
    var b = bubble();
    var text = current(state);
    if(!b || !text) return false;
    b.textContent = text;
    b.setAttribute('data-bubble-controller', 'guarded');
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
      index = Number(state && state.bubbleIndex || 0) || 0;
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
    version: 'guarded-bubble-controller-20260616-clean-1',
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
