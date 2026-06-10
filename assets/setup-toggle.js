(function(){
  function setupEl(){ return document.getElementById('setup'); }

  function ensureStyle(){
    if(document.getElementById('setupTogglePanelStyle')) return;
    var style = document.createElement('style');
    style.id = 'setupTogglePanelStyle';
    style.textContent = [
      'body.cloudDefaultAssets #setup:not(.hidden){display:block!important;position:fixed!important;left:5vw!important;right:5vw!important;bottom:max(14px,env(safe-area-inset-bottom))!important;max-height:58vh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;z-index:96!important;overscroll-behavior:contain!important;}',
      '#setupCloseButton{position:sticky;top:0;float:right;z-index:3;border:0;border-radius:999px;padding:7px 10px;margin:0 0 6px 8px;background:rgba(122,64,84,.92);color:white;font-weight:900;font-size:12px;box-shadow:0 8px 18px rgba(70,30,45,.22);}',
      '#setupToggleButton{position:fixed;left:14px;top:max(14px,env(safe-area-inset-top));z-index:88;border:0;border-radius:999px;padding:8px 11px;background:rgba(255,245,247,.82);color:#754052;box-shadow:0 8px 22px rgba(50,20,35,.18),inset 0 0 0 1px rgba(255,255,255,.7);font-weight:800;font-size:12px;}'
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
    if(e){ e.preventDefault(); e.stopPropagation(); }
    ensureStyle();
    ensureCloseButton();
    var setup = setupEl();
    if(setup){
      setup.classList.remove('hidden');
      setup.scrollTop = 0;
    }
  }

  function ensureButton(){
    ensureStyle();
    ensureCloseButton();
    if(document.getElementById('setupToggleButton')) return;
    var btn = document.createElement('button');
    btn.id = 'setupToggleButton';
    btn.type = 'button';
    btn.textContent = '素材';
    btn.addEventListener('click', openSetup);
    btn.addEventListener('touchend', openSetup);
    document.body.appendChild(btn);
  }

  window.KittenNestSetupToggle = { version:'setup-toggle-20260610-close-scroll', open:openSetup, close:closeSetup };
  window.addEventListener('load', ensureButton);
  window.addEventListener('pageshow', ensureButton);
  setTimeout(ensureButton, 300);
  setTimeout(ensureButton, 1200);
})();
