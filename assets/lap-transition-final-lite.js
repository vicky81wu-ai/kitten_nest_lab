(function(){
  var LAP='https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var MAIN='';
  var locked=false;
  function r(){return document.getElementById('gameRoom')}
  function g(){return document.getElementById('gameBg')}
  function style(){
    if(document.getElementById('lapFinalLiteStyle'))return;
    var s=document.createElement('style');
    s.id='lapFinalLiteStyle';
    s.textContent='#gameRoom:not(.active) .steam,#gameRoom:not(.active) .photoGlow,#gameRoom.leavingCoffeeCorner .steam,#gameRoom.leavingCoffeeCorner .photoGlow,body.leavingCoffeeCorner #gameRoom .steam,body.leavingCoffeeCorner #gameRoom .photoGlow{display:none!important;opacity:0!important;pointer-events:none!important}#lapFinalLiteOverlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:32;pointer-events:none;opacity:0;transform:translateZ(0) scale(1.018) translateY(6px);filter:blur(1.2px);transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter}body.lapFinalLiteLock .lapEnterHot,body.lapFinalLiteLock .lapBackHot{pointer-events:none!important}body.lapFinalLiteLock #gameBg{transition:opacity 820ms cubic-bezier(.22,.8,.25,1),transform 820ms cubic-bezier(.22,.8,.25,1),filter 820ms cubic-bezier(.22,.8,.25,1);will-change:opacity,transform,filter}';
    document.head.appendChild(s);
  }
  function over(){
    var room=r(); if(!room)return null;
    var o=document.getElementById('lapFinalLiteOverlay');
    if(!o){o=document.createElement('img');o.id='lapFinalLiteOverlay';o.alt='';o.setAttribute('aria-hidden','true');room.appendChild(o)}
    return o;
  }
  function reset(){
    var img=g(),o=over();
    document.body.classList.remove('lapFinalLiteLock');
    if(img){img.style.opacity='';img.style.transform='';img.style.filter=''}
    if(o){o.style.opacity='0';o.style.transform='translateZ(0) scale(1.018) translateY(6px)';o.style.filter='blur(1.2px)'}
  }
  function run(kind){
    var api=window.KittenNestCoffeeCornerVariant,img=g(),o=over();
    if(!api||!img||!o||locked)return;
    if(!MAIN)MAIN=img.getAttribute('src')||img.currentSrc||'';
    locked=true;style();reset();document.body.classList.add('lapFinalLiteLock');
    if(kind==='enter'){
      o.src=LAP;o.style.opacity='0';
      requestAnimationFrame(function(){requestAnimationFrame(function(){img.style.opacity='0';img.style.transform='translateZ(0) scale(1.042) translateY(6px)';img.style.filter='blur(.9px)';o.style.opacity='1';o.style.transform='translateZ(0) scale(1) translateY(0)';o.style.filter='blur(0)'})});
    }else{
      o.src=MAIN||'/assets/rooms/coffee-corner/morning-evening.jpg';o.style.opacity='0';
      requestAnimationFrame(function(){requestAnimationFrame(function(){img.style.opacity='0';img.style.transform='translateZ(0) scale(1.018) translateY(-4px)';img.style.filter='blur(1.1px)';o.style.opacity='1';o.style.transform='translateZ(0) scale(1) translateY(0)';o.style.filter='blur(0)'})});
    }
    setTimeout(function(){reset();kind==='enter'?api.enterLap():api.backMain();locked=false},840);
  }
  function guardHome(e){
    var t=e.target;if(!t||!t.closest||!t.closest('.toHomeHot'))return;
    var room=r();document.body.classList.add('leavingCoffeeCorner');if(room)room.classList.add('leavingCoffeeCorner');
    setTimeout(function(){document.body.classList.remove('leavingCoffeeCorner');if(room)room.classList.remove('leavingCoffeeCorner')},900);
  }
  function intercept(e){
    var t=e.target;if(!t||!t.closest)return;
    if(t.closest('.lapEnterHot')){e.preventDefault();e.stopPropagation();run('enter')}
    if(t.closest('.lapBackHot')){e.preventDefault();e.stopPropagation();run('back')}
  }
  function boot(){
    style();over();
    if(!window.__lapFinalLite){window.__lapFinalLite=1;document.addEventListener('click',intercept,true);document.addEventListener('touchend',intercept,{capture:true,passive:false});document.addEventListener('click',guardHome,true);document.addEventListener('touchstart',guardHome,true)}
  }
  window.KittenNestLapTransitionFinalLite={version:'lap-final-lite-20260614-1',run:run,boot:boot};
  window.addEventListener('load',boot);window.addEventListener('pageshow',boot);setTimeout(boot,300);setTimeout(boot,1300);
})();