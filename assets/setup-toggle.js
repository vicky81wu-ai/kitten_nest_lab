(function(){
  function openSetup(){
    var setup = document.getElementById('setup');
    if(setup) setup.classList.remove('hidden');
  }
  function ensureButton(){
    if(document.getElementById('setupToggleButton')) return;
    var btn = document.createElement('button');
    btn.id = 'setupToggleButton';
    btn.type = 'button';
    btn.textContent = '素材';
    btn.style.cssText = 'position:fixed;left:14px;top:max(14px,env(safe-area-inset-top));z-index:88;border:0;border-radius:999px;padding:8px 11px;background:rgba(255,245,247,.82);color:#754052;box-shadow:0 8px 22px rgba(50,20,35,.18),inset 0 0 0 1px rgba(255,255,255,.7);font-weight:800;font-size:12px;';
    btn.addEventListener('click', openSetup);
    btn.addEventListener('touchend', function(e){ e.preventDefault(); openSetup(); });
    document.body.appendChild(btn);
  }
  window.KittenNestSetupToggle = { version:'setup-toggle-20260610-1', open:openSetup };
  window.addEventListener('load', ensureButton);
  window.addEventListener('pageshow', ensureButton);
  setTimeout(ensureButton, 300);
  setTimeout(ensureButton, 1200);
})();
