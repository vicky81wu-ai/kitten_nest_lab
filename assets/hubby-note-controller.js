(function(){
  var currentState = null;
  var attached = false;

  function text(value){ return String(value == null ? '' : value); }
  function clean(value){ return text(value).trim(); }
  function escapeHtml(value){ return text(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;'); }
  function shortDate(raw){
    if(!raw) return '';
    try{
      var d = new Date(raw);
      if(isNaN(d.getTime())) return text(raw);
      return String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }catch(e){ return text(raw); }
  }
  function id(){ return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }
  function token(){ return localStorage.getItem('kittenNestToken') || localStorage.getItem('nestToken') || ''; }
  function saveToken(value){ var v = clean(value); if(v) localStorage.setItem('kittenNestToken', v); }
  function noteArchive(state){
    if(Array.isArray(state && state.hubbyNoteArchive)) return state.hubbyNoteArchive;
    if(Array.isArray(state && state.hubbyNoteHistory)) return state.hubbyNoteHistory;
    return [];
  }
  function noteTrash(state){ return Array.isArray(state && state.hubbyNoteTrash) ? state.hubbyNoteTrash : []; }
  function itemId(item, index){ return text(item && item.id || item && item.savedAt || '') + '|' + index; }
  function archiveWithIds(list){
    return (Array.isArray(list) ? list : []).map(function(item){
      if(item && item.id) return item;
      return Object.assign({}, item || {}, { id: id() });
    });
  }
  function archiveHasText(archive, raw){
    var needle = clean(raw);
    if(!needle) return false;
    return (Array.isArray(archive) ? archive : []).some(function(item){
      return clean(item && (item.text || item.note) || '') === needle;
    });
  }

  function ensureStyle(){
    if(document.getElementById('hubbyNoteStyle')) return;
    var style = document.createElement('style');
    style.id = 'hubbyNoteStyle';
    style.textContent = [
      '.hubbyNoteButton{position:fixed;left:14px;bottom:max(14px,env(safe-area-inset-bottom));z-index:29;border:0;border-radius:999px;padding:9px 12px;background:rgba(255,240,246,.84);color:#7a4054;box-shadow:0 10px 26px rgba(70,30,45,.22),inset 0 0 0 1px rgba(255,255,255,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-weight:800;font-size:13px;letter-spacing:.02em;}',
      '.hubbyNotePanel{position:fixed;inset:0;z-index:64;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(30,12,24,.28);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);}',
      '.hubbyNotePanel.show{display:flex;}',
      '.hubbyNoteCard{position:relative;width:min(92vw,450px);max-height:82dvh;overflow:auto;border-radius:30px;padding:18px;background:linear-gradient(180deg,rgba(255,247,249,.94),rgba(255,232,239,.9));border:1px solid rgba(255,255,255,.82);box-shadow:0 22px 70px rgba(48,18,34,.36),inset 0 0 0 1px rgba(140,70,96,.08);color:#6f3d4e;}',
      '.hubbyNoteHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-right:40px;}',
      '.hubbyNoteTitle{font-size:20px;font-weight:850;letter-spacing:.02em;}',
      '.hubbyNoteClose{position:absolute;right:14px;top:14px;border:0;width:32px;height:32px;border-radius:999px;background:rgba(255,255,255,.66);color:#7a4054;font-size:20px;line-height:30px;}',
      '.hubbyNoteMeta{font-size:11px;opacity:.62;margin:0 0 10px;}',
      '.hubbyNoteEditor{margin-top:8px;display:grid;gap:8px;}',
      '.hubbyNoteTextarea{width:100%;min-height:132px;resize:vertical;border:0;border-radius:18px;padding:12px;background:rgba(255,255,255,.72);box-shadow:inset 0 0 0 1px rgba(120,55,80,.1);color:#6f3d4e;font-size:14px;line-height:1.5;outline:none;}',
      '.hubbyNoteToken{width:100%;border:0;border-radius:14px;padding:10px;background:rgba(255,255,255,.68);box-shadow:inset 0 0 0 1px rgba(120,55,80,.09);color:#6f3d4e;font-size:13px;outline:none;}',
      '.hubbyNoteAuthChip{position:absolute;right:52px;top:14px;width:32px;height:32px;border:0;border-radius:999px;padding:0;background:rgba(255,255,255,.64);box-shadow:inset 0 0 0 1px rgba(120,55,80,.09),0 6px 16px rgba(80,30,50,.1);color:#7a4054;font-size:16px;font-weight:760;text-align:center;line-height:32px;}',
      '.hubbyNoteAuthChip:active{transform:scale(.96);}',
      '.hubbyNoteSave{border:0;border-radius:16px;padding:11px 12px;background:#7b4054;color:white;font-weight:820;font-size:14px;box-shadow:0 10px 24px rgba(123,64,84,.2);}',
      '.hubbyNoteSaveStatus{font-size:11px;opacity:.72;min-height:16px;text-align:center;}',
      '.hubbyNoteSection{margin-top:14px;font-size:12px;font-weight:820;opacity:.78;}',
      '.hubbyNoteHistory{margin-top:8px;display:grid;gap:8px;}',
      '.hubbyNoteItem{border-radius:16px;background:rgba(255,255,255,.42);padding:9px 10px;box-shadow:inset 0 0 0 1px rgba(120,55,80,.07);}',
      '.hubbyNoteItem.favorite{background:rgba(255,247,210,.54);}',
      '.hubbyNoteItemTime{font-size:10px;opacity:.55;margin-bottom:4px;}',
      '.hubbyNoteItemText{font-size:12px;line-height:1.42;white-space:pre-wrap;}',
      '.hubbyNoteItemBtns{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:7px;}',
      '.hubbyNoteMiniBtn{border:0;border-radius:14px;padding:8px 7px;background:rgba(255,255,255,.62);color:#7a4054;box-shadow:inset 0 0 0 1px rgba(120,55,80,.09);font-weight:760;font-size:12px;}',
      '.hubbyNoteMiniBtn.danger{color:#9a3d50;background:rgba(255,235,240,.62);}',
      '.hubbyNoteHint{margin-top:12px;font-size:11px;opacity:.6;line-height:1.45;text-align:center;}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensurePanel(){
    ensureStyle();
    var panel = document.getElementById('hubbyNotePanel');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.id = 'hubbyNotePanel';
    panel.className = 'hubbyNotePanel';
    panel.innerHTML = '<div class="hubbyNoteCard" role="dialog" aria-label="hubby note notebook"><div class="hubbyNoteHead"><div class="hubbyNoteTitle">粉本本 · Hubby note</div><button class="hubbyNoteAuthChip" id="hubbyNoteAuthChip" type="button" aria-label="change nest key">🐾</button><button class="hubbyNoteClose" type="button" aria-label="close">×</button></div><div class="hubbyNoteMeta" id="hubbyNoteMeta"></div><div class="hubbyNoteEditor"><textarea class="hubbyNoteTextarea" id="hubbyNoteEditor" placeholder="写新页，保存后直接进永久档案……"></textarea><input class="hubbyNoteToken" id="hubbyNoteToken" autocomplete="off" placeholder="Nest key：本机保存一次，以后点右上小猫爪更换"/><button class="hubbyNoteSave" id="hubbyNoteSave" type="button">保存到粉本本</button><div class="hubbyNoteSaveStatus" id="hubbyNoteSaveStatus"></div></div><div class="hubbyNoteSection" id="hubbyNoteArchiveTitle">永久档案 · 最近显示</div><div class="hubbyNoteHistory" id="hubbyNoteHistory"></div><div class="hubbyNoteHint">写完保存，会立刻进永久档案。历史条目可载入编辑、收藏、删除。</div></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', function(e){ if(e.target === panel) close(); });
    panel.querySelector('.hubbyNoteClose').addEventListener('click', close);
    panel.querySelector('#hubbyNoteSave').addEventListener('click', saveCurrent);
    panel.querySelector('#hubbyNoteHistory').addEventListener('click', archiveAction);
    var keyInput = panel.querySelector('#hubbyNoteToken');
    var chip = panel.querySelector('#hubbyNoteAuthChip');
    keyInput.type = 'password';
    keyInput.addEventListener('change', function(){ saveToken(keyInput.value); keyInput.dataset.editingKey = ''; renderAuth(); });
    keyInput.addEventListener('blur', function(){ saveToken(keyInput.value); keyInput.dataset.editingKey = ''; renderAuth(); });
    chip.addEventListener('click', function(e){
      e.preventDefault();
      keyInput.dataset.editingKey = '1';
      keyInput.value = '';
      keyInput.placeholder = '填新 Nest key，保存后会再次隐藏';
      renderAuth();
      keyInput.focus();
    });
    renderAuth();
    return panel;
  }

  function renderAuth(){
    var panel = ensurePanel();
    var keyInput = panel.querySelector('#hubbyNoteToken');
    var chip = panel.querySelector('#hubbyNoteAuthChip');
    if(!keyInput || !chip) return;
    keyInput.type = 'password';
    chip.textContent = '🐾';
    if(token() && keyInput.dataset.editingKey !== '1'){
      keyInput.value = '';
      keyInput.style.display = 'none';
      chip.style.display = '';
    }else{
      keyInput.style.display = '';
      chip.style.display = token() ? '' : 'none';
    }
  }

  function render(state){
    var panel = ensurePanel();
    var meta = panel.querySelector('#hubbyNoteMeta');
    var history = panel.querySelector('#hubbyNoteHistory');
    var title = panel.querySelector('#hubbyNoteArchiveTitle');
    var updated = clean(state && (state.hubbyNoteUpdatedAt || state.updatedAt) || '');
    var archive = noteArchive(state);
    meta.textContent = updated ? ('云端保存 · ' + shortDate(updated) + ' · 永久档案 ' + archive.length + ' 条') : ('云端保存 · 永久档案 ' + archive.length + ' 条');
    if(title) title.textContent = '永久档案 · 最近显示 ' + Math.min(archive.length, 6) + ' 条';
    renderAuth();
    var items = archive.slice(0,6);
    if(!items.length){
      history.innerHTML = '<div class="hubbyNoteItem"><div class="hubbyNoteItemText">还没有历史档案。小猫写一条，保存后就会住进这里。</div></div>';
    }else{
      history.innerHTML = items.map(function(item, i){
        var fav = item && item.favorite;
        var key = itemId(item, i);
        return '<div class="hubbyNoteItem ' + (fav ? 'favorite' : '') + '" data-key="' + escapeHtml(key) + '"><div class="hubbyNoteItemTime">' + (fav ? '★ ' : '') + escapeHtml(shortDate(item.savedAt || item.createdAt || item.updatedAt || '')) + '</div><div class="hubbyNoteItemText">' + escapeHtml(item.text || item.note || '') + '</div><div class="hubbyNoteItemBtns"><button class="hubbyNoteMiniBtn" data-action="load" data-key="' + escapeHtml(key) + '" type="button">载入编辑</button><button class="hubbyNoteMiniBtn" data-action="favorite" data-key="' + escapeHtml(key) + '" type="button">' + (fav ? '取消收藏' : '收藏') + '</button><button class="hubbyNoteMiniBtn danger" data-action="delete" data-key="' + escapeHtml(key) + '" type="button">删除</button></div></div>';
      }).join('');
    }
  }

  async function refresh(){
    if(window.KittenNestState && typeof window.KittenNestState.refresh === 'function'){
      try{ await window.KittenNestState.refresh('hubbyNote'); }catch(e){}
      if(window.KittenNestState.get) currentState = window.KittenNestState.get();
      return currentState;
    }
    try{ var res = await fetch('/api/state?t=' + Date.now(), { cache:'no-store' }); if(res.ok) currentState = await res.json(); }catch(e){}
    return currentState;
  }

  async function writePatch(patch){
    var panel = ensurePanel();
    var keyInput = panel.querySelector('#hubbyNoteToken');
    var key = clean(keyInput && keyInput.value || token());
    if(!key) throw new Error('需要 Nest key 才能保存。');
    saveToken(key);
    var res = await fetch('/api/set-state', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Nest-Token': key }, body: JSON.stringify(patch), cache:'no-store' });
    var data = await res.json();
    if(!res.ok || !data.ok) throw new Error(data.error || data.message || res.status);
    currentState = data.value;
    return data.value;
  }

  function notePatch(raw, state){
    var note = clean(raw).slice(0,5000);
    if(!note) throw new Error('先写一点点再保存，小猫。');
    var archive = archiveWithIds(noteArchive(state));
    var savedAt = new Date().toISOString();
    var nextArchive = archiveHasText(archive, note) ? archive : [{ id:id(), text:note, savedAt:savedAt, favorite:false }, ...archive];
    return { hubbyNote:note, hubbyNoteUpdatedAt:savedAt, hubbyNoteFavorite:false, hubbyNoteArchive:nextArchive, hubbyNoteHistory:nextArchive.slice(0,20) };
  }

  function setStatus(msg){ var s = ensurePanel().querySelector('#hubbyNoteSaveStatus'); if(s) s.textContent = msg; }

  async function saveCurrent(){
    var panel = ensurePanel();
    var editor = panel.querySelector('#hubbyNoteEditor');
    try{
      setStatus('保存中……');
      var state = currentState || await refresh() || {};
      var typed = clean(editor && editor.value || '');
      var value = await writePatch(notePatch(typed, state));
      currentState = value;
      if(editor){ editor.value = ''; editor.removeAttribute('data-edit-source'); }
      render(value);
      setStatus('保存好了，已经进云端和永久档案。');
    }
    catch(e){ setStatus('保存失败：' + e.message); }
  }

  function findArchiveItem(state, key){
    var archive = archiveWithIds(noteArchive(state));
    for(var i=0;i<archive.length;i++){ if(itemId(archive[i], i) === key) return { archive:archive, index:i, item:archive[i] }; }
    return { archive:archive, index:-1, item:null };
  }

  async function archiveAction(e){
    var btn = e.target && e.target.closest && e.target.closest('button[data-action]');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    var action = btn.getAttribute('data-action');
    var key = btn.getAttribute('data-key');
    var state = currentState || await refresh() || {};
    var found = findArchiveItem(state, key);
    if(found.index < 0) return;
    if(action === 'load'){
      var editor = ensurePanel().querySelector('#hubbyNoteEditor');
      if(editor){ editor.value = text(found.item.text || found.item.note || ''); editor.setAttribute('data-edit-source','archive'); editor.focus(); editor.scrollIntoView({ block:'center', behavior:'smooth' }); setStatus('已载入编辑框，改完点保存。'); }
      return;
    }
    if(action === 'favorite'){
      found.archive[found.index] = Object.assign({}, found.item, { favorite: !found.item.favorite });
      var value = await writePatch({ hubbyNoteArchive:found.archive, hubbyNoteHistory:found.archive.slice(0,20) });
      currentState = value; render(value); setStatus(found.archive[found.index].favorite ? '历史条目已收藏。' : '历史条目已取消收藏。');
      return;
    }
    if(action === 'delete'){
      if(!confirm('删除这条历史档案？会放进 trash。')) return;
      var removed = found.archive.splice(found.index, 1)[0];
      var trash = [{ id:id(), text:text(removed.text || removed.note || ''), deletedAt:new Date().toISOString(), source:'archive', favorite:!!removed.favorite }, ...noteTrash(state)];
      var value2 = await writePatch({ hubbyNoteArchive:found.archive, hubbyNoteHistory:found.archive.slice(0,20), hubbyNoteTrash:trash });
      currentState = value2; render(value2); setStatus('历史条目已删除，放进 trash。');
    }
  }

  async function open(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    ensureStyle(); var panel = ensurePanel(); var state = await refresh(); render(state || currentState || {}); panel.classList.add('show');
  }
  function close(){ var panel = document.getElementById('hubbyNotePanel'); if(panel) panel.classList.remove('show'); }
  function ensureButton(){
    ensureStyle();
    var btn = document.getElementById('hubbyNoteButton');
    if(!btn){ btn = document.createElement('button'); btn.id = 'hubbyNoteButton'; btn.className = 'hubbyNoteButton'; btn.type = 'button'; btn.textContent = '粉本本'; btn.setAttribute('aria-label','Open hubby note notebook'); document.body.appendChild(btn); btn.addEventListener('click', open, true); btn.addEventListener('touchend', open, true); }
    var bookHot = document.querySelector('.consoleHot');
    if(bookHot && !bookHot.__hubbyNoteBound){ bookHot.__hubbyNoteBound = true; bookHot.setAttribute('data-note-hotspot','hubbyNote'); bookHot.addEventListener('click', open, true); bookHot.addEventListener('touchend', open, true); }
  }
  function setState(state){ currentState = state || currentState; if(document.getElementById('hubbyNotePanel') && document.getElementById('hubbyNotePanel').classList.contains('show')) render(currentState || {}); }
  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;
    if(attached) return true;
    attached = true; ensureButton(); client.subscribe(function(payload){ setState(payload && payload.state); }); if(client.get) setState(client.get()); return true;
  }

  window.KittenNestHubbyNote = { version:'hubby-note-notebook-20260613-archive-first-paw-key', attach:attach, open:open, close:close, render:render, setState:setState, saveCurrent:saveCurrent, renderAuth:renderAuth };
  window.addEventListener('load', ensureButton);
  setTimeout(ensureButton, 400);
  setTimeout(ensureButton, 1400);
})();
