(function(){
  var state = null;
  var stamp = '';
  var listeners = [];

  function copy(x){
    try { return JSON.parse(JSON.stringify(x)); }
    catch(e) { return x; }
  }

  function makeStamp(s){
    if(!s) return '';
    return [
      s.updatedAt || '',
      s.alexBubble || '',
      JSON.stringify(s.alexBubbles || []),
      String(s.bubbleIndex || 0),
      s.windowTemp || '',
      s.windowDesc || ''
    ].join('|');
  }

  function each(fn){
    listeners.slice().forEach(function(listener){
      try { listener(fn); } catch(e) {}
    });
  }

  async function refresh(reason){
    var oldState = state;
    var oldStamp = stamp;
    var res = await fetch('/api/state?ts=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) throw new Error('state read failed');
    state = await res.json();
    stamp = makeStamp(state);
    if(stamp !== oldStamp){
      each({ state: copy(state), previousState: copy(oldState), stamp: stamp, previousStamp: oldStamp, reason: reason || 'refresh' });
    }
    return copy(state);
  }

  function subscribe(listener){
    if(typeof listener !== 'function') return function(){};
    listeners.push(listener);
    if(state) listener({ state: copy(state), previousState: null, stamp: stamp, previousStamp: '', reason: 'subscribe' });
    return function(){ listeners = listeners.filter(function(x){ return x !== listener; }); };
  }

  window.KittenNestState = {
    version: 'passive-state-reader-20260610',
    get: function(){ return copy(state); },
    stamp: function(){ return stamp; },
    refresh: refresh,
    subscribe: subscribe
  };
})();
