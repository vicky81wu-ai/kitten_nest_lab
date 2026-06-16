(function(){
  var VERSION = 'source-of-truth-gate-20260616-test-1';
  var qs = new URLSearchParams(location.search);
  if(qs.get('sourceOfTruthGateTest') !== '1') return;

  function $(id){ return document.getElementById(id); }
  function weatherWrap(){
    var temp = $('temp');
    var desc = $('desc');
    return (temp && temp.closest && temp.closest('.weather')) || (desc && desc.closest && desc.closest('.weather')) || null;
  }

  function installStyle(){
    if($('sourceOfTruthGateStyle')) return;
    var s = document.createElement('style');
    s.id = 'sourceOfTruthGateStyle';
    s.textContent = [
      'body[data-source-of-truth-gate-test="1"] .weather:not([data-state-applied="1"]){opacity:0!important;pointer-events:none!important}',
      'body[data-source-of-truth-gate-test="1"] #home.active .clock:not([data-positioner-applied="1"]){opacity:0!important;pointer-events:none!important}',
      'body[data-source-of-truth-gate-test="1"] #gameRoom.active #bubble:not([data-positioner-applied="1"]){display:none!important;opacity:0!important;pointer-events:none!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function mark(){
    document.body.setAttribute('data-source-of-truth-gate-test', '1');
    installStyle();
  }

  function applyWeatherState(state){
    if(!state) return false;
    var temp = $('temp');
    var desc = $('desc');
    var wrap = weatherWrap();
    var hasTemp = String(state.windowTemp || '').trim();
    var hasDesc = String(state.windowDesc || '').trim();
    if(temp && hasTemp) temp.textContent = hasTemp;
    if(desc && hasDesc) desc.textContent = hasDesc;
    if(wrap && (hasTemp || hasDesc)){
      wrap.setAttribute('data-state-applied', '1');
      wrap.setAttribute('data-source-of-truth-object', 'home.windowWeatherDisplay');
      if(temp) temp.setAttribute('data-state-applied', '1');
      if(desc) desc.setAttribute('data-state-applied', '1');
      return true;
    }
    return false;
  }

  function applyPositioners(){
    if(window.KittenNestHotspots && window.KittenNestHotspots.applyOverlay){
      window.KittenNestHotspots.applyOverlay('home.clockHandsOverlay');
      window.KittenNestHotspots.applyOverlay('coffeeCorner.bubbleOverlay');
    }
  }

  function refreshState(){
    if(window.KittenNestState && window.KittenNestState.get){
      var current = window.KittenNestState.get();
      if(applyWeatherState(current)) return;
    }
    if(window.KittenNestState && window.KittenNestState.refresh){
      window.KittenNestState.refresh('source-of-truth-gate').then(function(state){ applyWeatherState(state); }).catch(function(){});
      return;
    }
    fetch('/api/state?ts=' + Date.now(), { cache:'no-store' })
      .then(function(res){ return res.ok ? res.json() : null; })
      .then(applyWeatherState)
      .catch(function(){});
  }

  function bindState(){
    if(window.KittenNestState && window.KittenNestState.subscribe && !window.__sourceOfTruthGateStateBound){
      window.__sourceOfTruthGateStateBound = true;
      window.KittenNestState.subscribe(function(payload){ applyWeatherState(payload && payload.state); });
    }
  }

  function reconcile(){
    mark();
    bindState();
    refreshState();
    applyPositioners();
  }

  function start(){
    reconcile();
    ['load','pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, reconcile); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) reconcile(); });
    document.addEventListener('click', function(){ setTimeout(reconcile, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(reconcile, 40); }, true);
    setTimeout(reconcile, 120);
    setTimeout(reconcile, 400);
    setTimeout(reconcile, 1000);
  }

  window.KittenNestSourceOfTruthGate = {
    version: VERSION,
    reconcile: reconcile,
    applyWeatherState: applyWeatherState,
    applyPositioners: applyPositioners
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
