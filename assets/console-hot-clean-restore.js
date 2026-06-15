(function(){
  var VERSION = 'console-hot-clean-restore-20260614-1';

  function bubbleHidden(){
    var b = document.getElementById('bubble');
    return !!(b && (b.classList.contains('hidden') || b.getAttribute('data-bubble-user-hidden') === '1'));
  }

  function showBubble(text){
    var bubble = document.getElementById('bubble');
    if(!bubble) return;
    if(window.KittenNestBubble && window.KittenNestBubble.markHidden){
      window.KittenNestBubble.markHidden(false);
    }else{
      bubble.removeAttribute('data-bubble-user-hidden');
    }
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
    if(!bubbleHidden()) showBubble('wanna play, kitten?');
    if(menu) menu.classList.add('show');
    return false;
  }

  function restore(){
    var old = document.getElementById('console');
    if(!old || old.dataset.consoleCleanRestore === 'done') return;
    var fresh = old.cloneNode(false);
    fresh.id = old.id;
    fresh.className = old.className;
    fresh.type = old.type || 'button';
    fresh.dataset.consoleCleanRestore = 'done';
    old.parentNode.replaceChild(fresh, old);
    fresh.onclick = openGameMenu;
    fresh.addEventListener('click', openGameMenu, true);
    fresh.addEventListener('touchend', openGameMenu, { capture:true, passive:false });
  }

  window.KittenNestConsoleCleanRestore = { version: VERSION, restore: restore };
  window.addEventListener('load', function(){ setTimeout(restore, 300); setTimeout(restore, 900); });
  window.addEventListener('pageshow', function(){ setTimeout(restore, 300); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) setTimeout(restore, 300); });
  setTimeout(restore, 300);
  setTimeout(restore, 1200);
})();
