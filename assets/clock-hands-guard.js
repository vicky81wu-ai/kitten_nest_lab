(function(){
  var VERSION = 'clock-hands-guard-20260614-1';
  var installed = false;
  var timer = 0;

  function $(id){ return document.getElementById(id); }
  function home(){ return $('home'); }
  function clock(){ return document.querySelector('#home .clock'); }

  function ensureStyle(){
    if($('clockHandsGuardStyle')) return;
    var s = document.createElement('style');
    s.id = 'clockHandsGuardStyle';
    s.textContent = [
      '#home.active .clock{display:block!important;visibility:visible!important;opacity:.94!important;-webkit-transform:rotate(7deg) translateZ(0);transform:rotate(7deg) translateZ(0);-webkit-backface-visibility:hidden;backface-visibility:hidden;contain:layout paint style}',
      '#home.active .clock .hand{display:block!important;visibility:visible!important;opacity:1;-webkit-backface-visibility:hidden;backface-visibility:hidden;will-change:transform}',
      '#home.active .clock .second{opacity:.55!important}',
      'body.homeDim #home.active .clock{opacity:.9!important}',
      'body.homeDim #home.active .clock .second{opacity:.62!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function makeHand(id, cls){
    var el = document.createElement('div');
    el.id = id;
    el.className = cls;
    return el;
  }

  function ensureHands(){
    var c = clock();
    if(!c) return false;
    if(!$('hourHand')) c.insertBefore(makeHand('hourHand', 'hand hour'), c.firstChild);
    if(!$('minuteHand')) c.insertBefore(makeHand('minuteHand', 'hand minute'), $('hourHand') ? $('hourHand').nextSibling : c.firstChild);
    if(!$('secondHand')) c.insertBefore(makeHand('secondHand', 'hand second'), $('minuteHand') ? $('minuteHand').nextSibling : c.firstChild);
    return true;
  }

  function visibleEnough(el){
    if(!el) return false;
    var cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function wake(){
    ensureStyle();
    var h = home();
    if(!h || !h.classList.contains('active')) return;
    ensureHands();
    var c = clock();
    if(!c) return;
    var hour = $('hourHand');
    var minute = $('minuteHand');
    var second = $('secondHand');
    [c, hour, minute, second].forEach(function(el){
      if(!el) return;
      el.style.webkitBackfaceVisibility = 'hidden';
      el.style.backfaceVisibility = 'hidden';
      void el.offsetHeight;
    });
    if(!visibleEnough(hour) || !visibleEnough(minute) || !visibleEnough(second)){
      c.style.display = 'none';
      void c.offsetHeight;
      c.style.display = '';
    }
  }

  function schedule(delay){
    clearTimeout(timer);
    timer = setTimeout(wake, delay || 0);
  }

  function install(){
    if(installed) return;
    installed = true;
    ensureStyle();
    ['pageshow','focus','resize','orientationchange'].forEach(function(name){
      window.addEventListener(name, function(){ schedule(60); setTimeout(wake, 360); });
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden){ schedule(60); setTimeout(wake, 360); } });
    document.addEventListener('click', function(e){
      var t = e && e.target;
      if(t && t.closest && (t.closest('.toGameHot') || t.closest('.toHomeHot') || t.closest('.moonHot'))){
        schedule(80); setTimeout(wake, 360);
      }
    }, true);
    document.addEventListener('touchend', function(e){
      var t = e && e.target;
      if(t && t.closest && (t.closest('.toGameHot') || t.closest('.toHomeHot') || t.closest('.moonHot'))){
        schedule(80); setTimeout(wake, 360);
      }
    }, {capture:true, passive:true});
    try{
      var mo = new MutationObserver(function(){ schedule(80); });
      if(home()) mo.observe(home(), { attributes:true, attributeFilter:['class'] });
      mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    }catch(e){}
    schedule(120); setTimeout(wake, 900);
  }

  window.KittenNestClockHandsGuard = { version: VERSION, install: install, wake: wake };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
})();
