(function(){
  function token(){ return localStorage.getItem('kittenNestToken') || localStorage.getItem('nestToken') || ''; }
  function saveToken(value){
    var v = String(value || '').trim();
    if(v) localStorage.setItem('kittenNestToken', v);
  }
  function ensureStyle(){
    if(document.getElementById('hubbyNoteAuthGuardStyle')) return;
    var style = document.createElement('style');
    style.id = 'hubbyNoteAuthGuardStyle';
    style.textContent = '.hubbyNoteAuthChip{border:0;border-radius:14px;padding:10px;background:rgba(255,255,255,.62);box-shadow:inset 0 0 0 1px rgba(120,55,80,.09);color:#7a4054;font-size:12px;font-weight:760;text-align:center}.hubbyNoteAuthChip:active{transform:scale(.99)}';
    document.head.appendChild(style);
  }
  function chipFor(input){
    var chip = document.getElementById('hubbyNoteAuthChip');
    if(chip) return chip;
    chip = document.createElement('button');
    chip.id = 'hubbyNoteAuthChip';
    chip.className = 'hubbyNoteAuthChip';
    chip.type = 'button';
    chip.addEventListener('click', function(e){
      e.preventDefault();
      input.dataset.editingKey = '1';
      input.type = 'password';
      input.value = '';
      input.placeholder = '填新 Nest key，保存后会再次隐藏';
      input.style.display = '';
      chip.style.display = 'none';
      input.focus();
    });
    input.parentNode.insertBefore(chip, input.nextSibling);
    return chip;
  }
  function guard(){
    ensureStyle();
    var input = document.getElementById('hubbyNoteToken');
    if(!input) return;
    if(!input.__hubbyNoteAuthGuardBound){
      input.__hubbyNoteAuthGuardBound = true;
      input.type = 'password';
      input.addEventListener('change', function(){ saveToken(input.value); input.dataset.editingKey = ''; guard(); });
      input.addEventListener('blur', function(){ saveToken(input.value); input.dataset.editingKey = ''; guard(); });
    }
    var chip = chipFor(input);
    if(token() && input.dataset.editingKey !== '1'){
      input.value = '';
      input.style.display = 'none';
      chip.textContent = '已授权 · 点这里换 key';
      chip.style.display = '';
    }else{
      input.type = 'password';
      input.style.display = '';
      chip.style.display = 'none';
    }
  }
  window.KittenNestHubbyNoteAuthGuard = { version:'hubby-note-auth-guard-20260610-1', guard:guard };
  window.addEventListener('load', guard);
  window.addEventListener('pageshow', guard);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) guard(); });
  setInterval(guard, 250);
  setTimeout(guard, 50);
  setTimeout(guard, 200);
  setTimeout(guard, 800);
})();
