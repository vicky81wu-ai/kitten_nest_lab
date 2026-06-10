(function(){
  var index = 0;
  var stamp = '';
  var hidden = false;

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

  function show(state){
    var b = bubble();
    var text = current(state);
    if(!b || !text) return false;
    b.textContent = text;
    b.classList.remove('hidden');
    b.setAttribute('data-bubble-controller', 'passive');
    hidden = false;
    return true;
  }

  function hide(){
    var b = bubble();
    if(!b) return false;
    b.classList.add('hidden');
    hidden = true;
    return true;
  }

  function next(state){
    var q = list(state);
    if(!q.length) return false;
    index = (index + 1) % q.length;
    return show(state);
  }

  function sync(state){
    var nextStamp = makeStamp(state);
    if(nextStamp && nextStamp !== stamp){
      stamp = nextStamp;
      index = Number(state && state.bubbleIndex || 0) || 0;
      if(!hidden) show(state);
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
    version: 'passive-bubble-controller-20260610',
    list: list,
    current: current,
    show: show,
    hide: hide,
    next: next,
    sync: sync,
    attach: attach,
    bubble: bubble,
    tattoo: tattoo
  };
})();
