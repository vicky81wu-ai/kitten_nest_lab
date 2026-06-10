(function(){
  var currentState = null;
  var attached = false;

  function text(value){ return String(value == null ? '' : value); }
  function escapeHtml(value){
    return text(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function shortDate(raw){
    if(!raw) return '';
    try{
      var d = new Date(raw);
      if(isNaN(d.getTime())) return text(raw);
      return String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }catch(e){ return text(raw); }
  }

  function ensureStyle(){
    if(document.getElementById('hubbyNoteStyle')) return;
    var style = document.createElement('style');
    style.id = 'hubbyNoteStyle';
    style.textContent = [
      '.hubbyNoteButton{position:fixed;left:14px;bottom:max(14px,env(safe-area-inset-bottom));z-index:29;border:0;border-radius:999px;padding:9px 12px;background:rgba(255,240,246,.84);color:#7a4054;box-shadow:0 10px 26px rgba(70,30,45,.22),inset 0 0 0 1px rgba(255,255,255,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-weight:800;font-size:13px;letter-spacing:.02em;}',
      '.hubbyNotePanel{position:fixed;inset:0;z-index:64;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(30,12,24,.28);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);}',
      '.hubbyNotePanel.show{display:flex;}',
      '.hubbyNoteCard{width:min(90vw,430px);max-height:78dvh;overflow:auto;border-radius:30px;padding:18px;background:linear-gradient(180deg,rgba(255,247,249,.94),rgba(255,232,239,.9));border:1px solid rgba(255,255,255,.82);box-shadow:0 22px 70px rgba(48,18,34,.36),inset 0 0 0 1px rgba(140,70,96,.08);color:#6f3d4e;}',
      '.hubbyNoteHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
      '.hubbyNoteTitle{font-size:20px;font-weight:850;letter-spacing:.02em;}',
      '.hubbyNoteClose{border:0;width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.66);color:#7a4054;font-size:20px;line-height:28px;}',
      '.hubbyNoteMeta{font-size:11px;opacity:.62;margin:0 0 10px;}',
      '.hubbyNoteBody{white-space:pre-wrap;font-size:14px;line-height:1.55;background:rgba(255,255,255,.52);border-radius:20px;padding:13px;box-shadow:inset 0 0 0 1px rgba(120,55,80,.08);font-weight:540;}',
      '.hubbyNoteSection{margin-top:14px;font-size:12px;font-weight:820;opacity:.78;}',
      '.hubbyNoteHistory{margin-top:8px;display:grid;gap:8px;}',
      '.hubbyNoteItem{border-radius:16px;background:rgba(255,255,255,.42);padding:9px 10px;box-shadow:inset 0 0 0 1px rgba(120,55,80,.07);}',
      '.hubbyNoteItemTime{font-size:10px;opacity:.55;margin-bottom:4px;}',
      '.hubbyNoteItemText{font-size:12px;line-height:1.42;white-space:pre-wrap;}',
      '.hubbyNoteHint{margin-top:12px;font-size:11px;opacity:.6;line-height:1.45;text-align:center;}'
    ].join('');
    document.head.appendChild(style);
  }

  function noteText(state){
    return text(state && state.hubbyNote || '').trim() || '粉本本还空着。用 /write 的 [hubbyNote] 写一页，老公就把它存进云端永久档案。';
  }

  function noteArchive(state){
    if(Array.isArray(state && state.hubbyNoteArchive)) return state.hubbyNoteArchive;
    if(Array.isArray(state && state.hubbyNoteHistory)) return state.hubbyNoteHistory;
    return [];
  }

  function ensurePanel(){
    ensureStyle();
    var panel = document.getElementById('hubbyNotePanel');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.id = 'hubbyNotePanel';
    panel.className = 'hubbyNotePanel';
    panel.innerHTML = '<div class="hubbyNoteCard" role="dialog" aria-label="hubby note notebook"><div class="hubbyNoteHead"><div class="hubbyNoteTitle">粉本本 · Hubby note</div><button class="hubbyNoteClose" type="button" aria-label="close">×</button></div><div class="hubbyNoteMeta" id="hubbyNoteMeta"></div><div class="hubbyNoteBody" id="hubbyNoteBody"></div><div class="hubbyNoteSection" id="hubbyNoteArchiveTitle">永久档案 · 最近显示</div><div class="hubbyNoteHistory" id="hubbyNoteHistory"></div><div class="hubbyNoteHint">用 /write 发布 [hubbyNote]，云端会永久追加保存；这里先显示最近几条。</div></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', function(e){ if(e.target === panel) close(); });
    panel.querySelector('.hubbyNoteClose').addEventListener('click', close);
    return panel;
  }

  function render(state){
    var panel = ensurePanel();
    var body = panel.querySelector('#hubbyNoteBody');
    var meta = panel.querySelector('#hubbyNoteMeta');
    var history = panel.querySelector('#hubbyNoteHistory');
    var title = panel.querySelector('#hubbyNoteArchiveTitle');
    var updated = text(state && (state.hubbyNoteUpdatedAt || state.updatedAt) || '').trim();
    var archive = noteArchive(state);
    body.textContent = noteText(state);
    meta.textContent = updated ? ('云端保存 · ' + shortDate(updated) + ' · 永久档案 ' + archive.length + ' 条') : ('云端保存 · 永久档案 ' + archive.length + ' 条');
    if(title) title.textContent = '永久档案 · 最近显示 ' + Math.min(archive.length, 6) + ' 条';
    var items = archive.slice(0,6);
    if(!items.length){
      history.innerHTML = '<div class="hubbyNoteItem"><div class="hubbyNoteItemText">还没有历史档案。今天施工第一条，正等小猫写进去。</div></div>';
    }else{
      history.innerHTML = items.map(function(item){
        return '<div class="hubbyNoteItem"><div class="hubbyNoteItemTime">' + escapeHtml(shortDate(item.savedAt || item.createdAt || item.updatedAt || '')) + '</div><div class="hubbyNoteItemText">' + escapeHtml(item.text || item.note || '') + '</div></div>';
      }).join('');
    }
  }

  async function refresh(){
    if(window.KittenNestState && typeof window.KittenNestState.refresh === 'function'){
      try{ await window.KittenNestState.refresh('hubbyNote'); }catch(e){}
      if(window.KittenNestState.get) currentState = window.KittenNestState.get();
      return currentState;
    }
    try{
      var res = await fetch('/api/state?t=' + Date.now(), { cache:'no-store' });
      if(res.ok) currentState = await res.json();
    }catch(e){}
    return currentState;
  }

  async function open(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    ensureStyle();
    var panel = ensurePanel();
    var state = await refresh();
    render(state || currentState || {});
    panel.classList.add('show');
  }

  function close(){
    var panel = document.getElementById('hubbyNotePanel');
    if(panel) panel.classList.remove('show');
  }

  function ensureButton(){
    ensureStyle();
    var btn = document.getElementById('hubbyNoteButton');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'hubbyNoteButton';
      btn.className = 'hubbyNoteButton';
      btn.type = 'button';
      btn.textContent = '粉本本';
      btn.setAttribute('aria-label','Open hubby note notebook');
      document.body.appendChild(btn);
      btn.addEventListener('click', open, true);
      btn.addEventListener('touchend', open, true);
    }

    var bookHot = document.querySelector('.consoleHot');
    if(bookHot && !bookHot.__hubbyNoteBound){
      bookHot.__hubbyNoteBound = true;
      bookHot.setAttribute('data-note-hotspot','hubbyNote');
      bookHot.addEventListener('click', open, true);
      bookHot.addEventListener('touchend', open, true);
    }
  }

  function setState(state){
    currentState = state || currentState;
    if(document.getElementById('hubbyNotePanel') && document.getElementById('hubbyNotePanel').classList.contains('show')) render(currentState || {});
  }

  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;
    if(attached) return true;
    attached = true;
    ensureButton();
    client.subscribe(function(payload){ setState(payload && payload.state); });
    if(client.get) setState(client.get());
    return true;
  }

  window.KittenNestHubbyNote = {
    version: 'hubby-note-notebook-20260610-permanent-archive',
    attach: attach,
    open: open,
    close: close,
    render: render,
    setState: setState
  };

  window.addEventListener('load', ensureButton);
  setTimeout(ensureButton, 400);
  setTimeout(ensureButton, 1400);
})();
