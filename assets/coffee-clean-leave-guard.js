(function(){
  var VERSION = 'coffee-clean-leave-guard-20260614-1';
  var timer = 0;

  function game(){ return document.getElementById('gameRoom'); }

  function ensureStyle(){
    if(document.getElementById('coffeeCleanLeaveGuardStyle')) return;
    var s = document.createElement('style');
    s.id = 'coffeeCleanLeaveGuardStyle';
    s.textContent = [
      'body.coffeeCleanLeaving #gameRoom .steam,body.coffeeCleanLeaving #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}',
      '#gameRoom:not(.active) .steam,#gameRoom:not(.active) .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function leaving(){
    var g = game();
    if(!g || !g.classList.contains('active')) return;
    ensureStyle();
    document.body.classList.add('coffeeCleanLeaving');
    clearTimeout(timer);
    timer = setTimeout(function(){ document.body.classList.remove('coffeeCleanLeaving'); }, 420);
  }

  function catchLeave(e){
    var t = e && e.target;
    if(!t || !t.closest) return;
    if(t.closest('.toHomeHot')) leaving();
  }

  function install(){
    ensureStyle();
    if(window.__coffeeCleanLeaveGuardInstalled) return;
    window.__coffeeCleanLeaveGuardInstalled = true;
    document.addEventListener('touchstart', catchLeave, true);
    document.addEventListener('click', catchLeave, true);
  }

  window.KittenNestCoffeeCleanLeaveGuard = { version: VERSION, install: install, leaving: leaving };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
})();
