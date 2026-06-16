(function(){
  var VERSION = 'coffee-corner-bubble-coordinate-source-test-20260616-1';
  var qs = new URLSearchParams(location.search);
  if(qs.get('coffeeCornerBubbleCoordinateSourceTest') !== '1') return;

  function installStyle(){
    if(document.getElementById('coffeeCornerBubbleCoordinateSourceTestStyle')) return;
    var s = document.createElement('style');
    s.id = 'coffeeCornerBubbleCoordinateSourceTestStyle';
    s.textContent = [
      'body[data-coffee-corner-bubble-coordinate-source-test="1"] #bubble:not([data-coordinate-overlay="coffeeCorner.bubbleOverlay"]){display:none!important;opacity:0!important;pointer-events:none!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important}',
      'body[data-coffee-corner-bubble-coordinate-source-test="1"] #bubble[data-coordinate-overlay="coffeeCorner.bubbleOverlay"]{right:auto!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function mark(){
    document.body.setAttribute('data-coffee-corner-bubble-coordinate-source-test', '1');
  }

  function applyBubbleOverlay(){
    mark();
    installStyle();
    if(window.KittenNestHotspots && window.KittenNestHotspots.applyOverlay){
      window.KittenNestHotspots.applyOverlay('coffeeCorner.bubbleOverlay');
      return true;
    }
    return false;
  }

  function request(){
    applyBubbleOverlay();
    setTimeout(applyBubbleOverlay, 80);
    setTimeout(applyBubbleOverlay, 260);
    setTimeout(applyBubbleOverlay, 700);
  }

  function start(){
    mark();
    installStyle();
    request();
    ['load','pageshow','focus','resize','orientationchange'].forEach(function(name){ window.addEventListener(name, request); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) request(); });
    document.addEventListener('click', function(){ setTimeout(request, 40); }, true);
    document.addEventListener('touchend', function(){ setTimeout(request, 40); }, true);
  }

  window.KittenNestCoffeeCornerBubbleCoordinateSourceTest = {
    version: VERSION,
    request: request,
    apply: applyBubbleOverlay
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
