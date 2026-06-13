(function(){
  var LONG_PRESS_MS = 1800;
  var pressTimer = null;
  var longPressFired = false;

  function setupEl(){ return document.getElementById('setup'); }
  function inAdminZoneFromPoint(x, y){
    var topLimit = Math.max(118, Math.round(window.innerHeight * 0.16));
    var leftLimit = Math.max(108, Math.round(window.innerWidth * 0.26));
    return x <= leftLimit && y <= topLimit;
  }
  function eventPoint(e){
    var p = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { x:p.clientX || 0, y:p.clientY || 0 };
  }

  function ensureStyle(){
    if(document.getElementById('setupTogglePanelStyle')) return;
    var style = document.createElement('style');
    style.id = 'setupTogglePanelStyle';
    style.textContent = [
      'body.cloudDefaultAssets #setup:not(.hidden){display:block!important;position:fixed!important;left:5vw!important;right:5vw!important;bottom:max(14px,env(safe-area-inset-bottom))!important;max-height:58vh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;z-index:96!important;overscroll-behavior:contain!important;}',
      '#setupCloseButton{position:sticky;top:0;float:right;z-index:3;border:0;border-radius:999px;padding:7px 10px;margin:0 0 6px 8px;background:rgba(122,64,84,.92);color:white;font-weight:900;font-size:12px;box-shadow:0 8px 18px rgba(70,30,45,.22);}',
      '#setupToggleButton{position:fixed;left:0;top:0;width:max(108px,26vw);height:max(118px,16vh);z-index:88;border:0;border-radius:0;padding:0;background:transparent!important;color:transparent!important;box-shadow:none!important;outline:0;font-size:0;opacity:1;}',
      '#setupToggleButton:before{content:"";}',
      'body.debug #setupToggleButton{background:rgba(130,80,255,.12)!important;outline:2px dashed rgba(130,80,255,.7);}',
      'body.cloudDefaultAssets .toHomeHot{left:0!important;top:auto!important;right:auto!important;bottom:0!important;width:28%!important;height:20%!important;}',
      'body.debug .toHomeHot{background:rgba(80,160,255,.16)!important;outline:2px dashed rgba(80,160,255,.8)!important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeSetup(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    var setup = setupEl();
    if(setup) setup.classList.add('hidden');
  }

  function ensureCloseButton(){
    var setup = setupEl();
    if(!setup || document.getElementById('setupCloseButton')) return;
    var close = document.createElement('button');
    close.id = 'setupCloseButton';
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSetup);
    close.addEventListener('touchend', closeSetup);
    setup.insertBefore(close, setup.firstChild);
  }

  function openSetup(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    ensureStyle();
    ensureCloseButton();
    var setup = setupEl();
    if(setup){
      setup.classList.remove('hidden');
      setup.scrollTop = 0;
    }
  }

  function clearPress(){
    if(pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
  }

  function startPress(e){
    var p = eventPoint(e);
    if(!inAdminZoneFromPoint(p.x, p.y)) return;
    if(e){ e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    ensureStyle();
    clearPress();
    longPressFired = false;
    pressTimer = setTimeout(function(){
      longPressFired = true;
      openSetup(e);
    }, LONG_PRESS_MS);
  }

  function endPress(e){
    var fired = longPressFired;
    clearPress();
    longPressFired = false;
    if(fired && e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }

  function cancelPress(){
    clearPress();
    longPressFired = false;
  }

  function ensureButton(){
    ensureStyle();
    ensureCloseButton();
    var btn = document.getElementById('setupToggleButton');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'setupToggleButton';
      btn.type = 'button';
      btn.textContent = '';
      btn.setAttribute('aria-label','长按打开猫窝管理入口');
      document.body.appendChild(btn);
    }
    if(!btn.__kittenNestLongPressBound){
      btn.__kittenNestLongPressBound = true;
      btn.addEventListener('touchstart', startPress, { passive:false });
      btn.addEventListener('touchend', endPress, { passive:false });
      btn.addEventListener('touchcancel', cancelPress, { passive:true });
      btn.addEventListener('mousedown', startPress);
      btn.addEventListener('mouseup', endPress);
      btn.addEventListener('mouseleave', cancelPress);
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }, true);
    }
  }

  function interceptLegacyLeftTopPress(e){
    var p = eventPoint(e);
    if(!inAdminZoneFromPoint(p.x, p.y)) return;
    startPress(e);
  }

  window.KittenNestSetupToggle = {
    version:'setup-toggle-20260613-admin-longpress-bottom-nav',
    open:openSetup,
    close:closeSetup,
    longPressMs:LONG_PRESS_MS
  };

  document.addEventListener('touchstart', interceptLegacyLeftTopPress, { capture:true, passive:false });
  document.addEventListener('touchend', endPress, { capture:true, passive:false });
  document.addEventListener('touchcancel', cancelPress, { capture:true, passive:true });
  window.addEventListener('load', ensureButton);
  window.addEventListener('pageshow', ensureButton);
  setTimeout(ensureButton, 300);
  setTimeout(ensureButton, 1200);
})();
