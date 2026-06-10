(function(){
  function ensureStyle(){
    if(document.getElementById('weatherAdviceHotspotGuardStyle')) return;
    var style = document.createElement('style');
    style.id = 'weatherAdviceHotspotGuardStyle';
    style.textContent = '.weather{pointer-events:auto!important;cursor:pointer!important;z-index:26!important}.weather *{pointer-events:auto!important}';
    document.head.appendChild(style);
  }

  function weatherElFromEvent(e){
    var t = e && e.target;
    if(t && t.closest){
      var w = t.closest('.weather');
      if(w) return w;
    }
    return null;
  }

  function arm(){
    ensureStyle();
    var w = document.querySelector('.weather');
    if(w){
      w.setAttribute('data-weather-hotspot','coffeeCorner.windowWeatherHotspot');
      w.setAttribute('role','button');
      w.setAttribute('aria-label','Open weather advice');
    }
  }

  function open(e){
    var w = weatherElFromEvent(e);
    if(!w) return;
    if(window.KittenNestWeather && typeof window.KittenNestWeather.openAdvice === 'function'){
      window.KittenNestWeather.openAdvice(e);
    }
  }

  document.addEventListener('click', open, true);
  document.addEventListener('touchend', open, true);
  window.addEventListener('load', arm);
  window.addEventListener('pageshow', arm);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) arm(); });
  setTimeout(arm, 150);
  setTimeout(arm, 700);
  setTimeout(arm, 1600);
})();
