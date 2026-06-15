(function(){
  var q = new URLSearchParams(location.search);
  if(q.get('lapBubbleTest') !== '1') return;
  var VERSION = 'lap-target-offset-test-20260615-1';

  function apply(){
    var api = window.KittenNestLapCloseBubbleClean;
    var key = 'body' + 'Card';
    if(!api || !api[key] || !api[key].coordinate) return false;
    api[key].coordinate.y = 0.695;
    document.documentElement.setAttribute('data-lap-target-offset-test', VERSION);
    if(typeof api.sync === 'function') api.sync();
    return true;
  }

  function start(){
    apply();
    setTimeout(apply, 100);
    setTimeout(apply, 300);
    setTimeout(apply, 900);
    window.addEventListener('pageshow', apply);
    window.addEventListener('focus', apply);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) apply(); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
