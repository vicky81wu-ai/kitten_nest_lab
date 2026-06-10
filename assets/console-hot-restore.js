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

  window.KittenNestConsoleRestore = { version:'console-hot-restore-20260610-1', restore:restore };
  window.addEventListener('load', function(){ setTimeout(restore, 700); setTimeout(restore, 1600); });
  window.addEventListener('pageshow', function(){ setTimeout(restore, 700); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) setTimeout(restore, 700); });
  setTimeout(restore, 900);
  setTimeout(restore, 1800);
})();
