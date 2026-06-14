(function(){
  function showBubble(text){
    var bubble = document.getElementById('bubble');
    if(!bubble) return;
    bubble.textContent = text;
    bubble.classList.remove('hidden');
  }

  function openGameMenu(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    var menu = document.getElementById('gameMenu');
    var line = document.getElementById('menuLine');
    if(line) line.textContent = 'Alex: wanna play, kitten?';
    showBubble('wanna play, kitten?');
    if(menu) menu.classList.add('show');
    return false;
  }

  function restore(){
    var old = document.getElementById('console');
    if(!old || old.dataset.consoleRestore === 'done') return;
    var fresh = old.cloneNode(false);
    fresh.id = old.id;
    fresh.className = old.className;
    fresh.type = old.type || 'button';
    fresh.dataset.consoleRestore = 'done';
    old.parentNode.replaceChild(fresh, old);
    fresh.onclick = openGameMenu;
    fresh.addEventListener('click', openGameMenu, true);
    fresh.addEventListener('touchend', openGameMenu, true);
  }

  var lapFinal = (function(){
    var LAP='https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
    var MAIN='';
    var lock=false;
    function room(){return document.getElementById('gameRoom');}
    function bg(){return document.getElementById('gameBg');}
    function style(){
      if(document.getElementById('lapFinalStyle')) return;
      var s=document.createElement('style');
      s.id='lapFinalStyle';
      s.textContent='#gameRoom:not(.active) .steam,#gameRoom:not(.active) .photoGlow,#gameRoom.leavingCoffeeCorner .steam,#gameRoom.leavingCoffeeCorner .photoGlow,body.leavingCoffeeCorner #gameRoom .steam,body.leavingCoffeeCorner #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}#lapFinalOverlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:32;pointer-events:none;opacity:0;transform:translateZ(0) scale(1.018) translateY(6px);filter:blur(1.2px);transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter}body.lapFinalLock .lapEnterHot,body.lapFinalLock .lapBackHot{pointer-events:none!important}body.lapFinalLock #gameBg{transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter}';
      document.head.appendChild(s);
    }
    function overlay(){
      var r=room(); if(!r) return null;
      var o=document.getElementById('lapFinalOverlay');
      if(!o){ o=document.createElement('img'); o.id='lapFinalOverlay'; o.alt=''; o.setAttribute('aria-hidden','true'); r.appendChild(o); }
      return o;
    }
    function reset(){
      var i=bg(), o=overlay();
      document.body.classList.remove('lapFinalLock');
      if(i){ i.style.opacity=''; i.style.transform=''; i.style.filter=''; }
      if(o){ o.style.opacity='0'; o.style.transform='translateZ(0) scale(1.018) translateY(6px)'; o.style.filter='blur(1.2px)'; }
    }
    function run(kind){
      var api=window.KittenNestCoffeeCornerVariant, i=bg(), o=overlay();
      if(!api || !i || !o || lock) return;
      if(!MAIN) MAIN=i.getAttribute('src') || i.currentSrc || '';
      lock=true; style(); reset(); document.body.classList.add('lapFinalLock');
      if(kind==='enter'){
        o.src=LAP; o.style.opacity='0';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ i.style.opacity='0'; i.style.transform='translateZ(0) scale(1.042) translateY(6px)'; i.style.filter='blur(.9px)'; o.style.opacity='1'; o.style.transform='translateZ(0) scale(1) translateY(0)'; o.style.filter='blur(0)'; }); });
      }else{
        o.src=MAIN || '/assets/rooms/coffee-corner/morning-evening.jpg'; o.style.opacity='0';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ i.style.opacity='0'; i.style.transform='translateZ(0) scale(1.018) translateY(-4px)'; i.style.filter='blur(1.1px)'; o.style.opacity='1'; o.style.transform='translateZ(0) scale(1) translateY(0)'; o.style.filter='blur(0)'; }); });
      }
      setTimeout(function(){ reset(); kind==='enter' ? api.enterLap() : api.backMain(); lock=false; }, 840);
    }
    function leaving(e){
      var t=e.target; if(!t || !t.closest || !t.closest('.toHomeHot')) return;
      var r=room(); document.body.classList.add('leavingCoffeeCorner'); if(r) r.classList.add('leavingCoffeeCorner');
      setTimeout(function(){ document.body.classList.remove('leavingCoffeeCorner'); if(r) r.classList.remove('leavingCoffeeCorner'); }, 900);
    }
    function catchLap(e){
      var t=e.target; if(!t || !t.closest) return;
      if(t.closest('.lapEnterHot')){ e.preventDefault(); e.stopPropagation(); run('enter'); }
      if(t.closest('.lapBackHot')){ e.preventDefault(); e.stopPropagation(); run('back'); }
    }
    function boot(){
      style(); overlay();
      if(!window.__lapFinalInstalled){
        window.__lapFinalInstalled=1;
        document.addEventListener('click', catchLap, true);
        document.addEventListener('touchend', catchLap, {capture:true, passive:false});
        document.addEventListener('click', leaving, true);
        document.addEventListener('touchstart', leaving, true);
      }
    }
    return { boot:boot, run:run };
  })();

  window.KittenNestConsoleRestore = { version:'console-hot-restore-20260614-lap-final-1', restore:restore, lapFinal:lapFinal };
  window.addEventListener('load', function(){ setTimeout(restore, 700); setTimeout(restore, 1600); setTimeout(lapFinal.boot, 300); });
  window.addEventListener('pageshow', function(){ setTimeout(restore, 700); setTimeout(lapFinal.boot, 300); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden){ setTimeout(restore, 700); setTimeout(lapFinal.boot, 300); } });
  setTimeout(restore, 900);
  setTimeout(restore, 1800);
  setTimeout(lapFinal.boot, 900);
  setTimeout(lapFinal.boot, 1800);
})();