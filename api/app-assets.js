const appQ = require('./app-q');

const ASSET_VERSION = 'supa-assets-20260612-2';
const SUPABASE_PUBLIC_BASE = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets';

const STATIC_ASSETS = {
  'home-day': '/assets/rooms/home/day.jpg',
  'home-night': '/assets/rooms/home/night.jpg',
  'coffee-corner-morning-evening': '/assets/rooms/coffee-corner/morning-evening.jpg'
};

const SUPABASE_ASSETS = {
  'home-day': `${SUPABASE_PUBLIC_BASE}/assets/rooms/home/day.jpg`,
  'home-night': `${SUPABASE_PUBLIC_BASE}/assets/rooms/home/night.jpg`,
  'coffee-corner-morning-evening': `${SUPABASE_PUBLIC_BASE}/assets/rooms/coffee-corner/morning-evening.jpg`
};

function asset(key) {
  return `${SUPABASE_ASSETS[key]}?v=${ASSET_VERSION}`;
}

function staticAsset(key) {
  return `${STATIC_ASSETS[key]}?v=${ASSET_VERSION}`;
}

const homeDay = asset('home-day');
const homeNight = asset('home-night');
const coffeeCorner = asset('coffee-corner-morning-evening');
const homeDayStatic = staticAsset('home-day');
const homeNightStatic = staticAsset('home-night');
const coffeeCornerStatic = staticAsset('coffee-corner-morning-evening');

const fallbackPaint = `radial-gradient(circle at 42% 37%,rgba(255,255,255,.55),transparent 22%),radial-gradient(circle at 72% 31%,rgba(100,170,255,.45),transparent 13%),linear-gradient(180deg,#ffd0bf,#c58da9)`;
const canvasFillCss = '<link rel="stylesheet" href="/assets/canvas-fill.css?v=20260610-1">';

const setupPatchStyle = `
<style id="cloudDefaultAssetsSetupPatch">
body.cloudDefaultAssets #setup.hidden{display:none!important;}
body.cloudDefaultAssets #home{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
body.cloudDefaultAssets #home .fallback{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets.homeDim #home .fallback{background-image:url('${homeNight}'),url('${homeNightStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets #gameRoom{background-image:url('${coffeeCorner}'),url('${coffeeCornerStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
</style>`;

const localAssetManagerStyle = `
<style id="cloudLocalAssetManagerStyle">
.localAssetManager{margin-top:10px;padding:10px;border-radius:16px;background:rgba(255,255,255,.58);box-shadow:inset 0 0 0 1px rgba(151,83,103,.14);font-size:12px;line-height:1.35;color:#6b3d49}
.localAssetTitle{font-weight:800;text-align:center;margin-bottom:8px;color:#704153}
.localAssetRow{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;margin:7px 0;padding:7px;border-radius:13px;background:rgba(255,255,255,.62)}
.localAssetName{font-weight:700}.localAssetState{display:block;margin-top:2px;font-size:11px;opacity:.72}
.localAssetReset{border:0;border-radius:12px;padding:8px 9px;background:rgba(255,245,248,.94);box-shadow:inset 0 0 0 1px rgba(151,83,103,.16);font-size:12px;color:#6b3d49}
.localAssetReset:active{transform:scale(.98)}
</style>`;

const defaultAssetScript = `
<script>
(function(){
  window.__kittenNestDefaultAssets = '${ASSET_VERSION}';

  var fallbackSrc = {
    homeOn: '${homeDayStatic}',
    homeOff: '${homeNightStatic}',
    gameBg: '${coffeeCornerStatic}'
  };

  function hideSetup(){
    var setup = document.getElementById('setup');
    if(setup) setup.classList.add('hidden');
  }

  function markWhenReady(id, cls){
    var img = document.getElementById(id);
    if(!img) return;

    function loaded(){
      if(img.naturalWidth > 0){
        img.style.display = '';
        document.body.classList.add(cls);
        hideSetup();
      }
    }

    function failed(){
      var fallback = fallbackSrc[id];
      if(fallback && img.getAttribute('src') !== fallback){
        img.src = fallback;
        return;
      }
      img.style.display = 'none';
      document.body.classList.remove(cls);
      hideSetup();
    }

    img.addEventListener('load', loaded);
    img.addEventListener('error', failed);

    if(img.complete) loaded();
  }

  document.body.classList.add('cloudDefaultAssets');
  hideSetup();
  markWhenReady('homeOn', 'hasHomeOn');
  markWhenReady('homeOff', 'hasHomeOff');
  markWhenReady('gameBg', 'hasGameRoom');

  window.addEventListener('pageshow', function(){
    hideSetup();
    markWhenReady('homeOn', 'hasHomeOn');
    markWhenReady('homeOff', 'hasHomeOff');
    markWhenReady('gameBg', 'hasGameRoom');
  });

  window.addEventListener('load', hideSetup);
  document.addEventListener('visibilitychange', hideSetup);
  setTimeout(hideSetup, 0);
  setTimeout(hideSetup, 50);
  setTimeout(hideSetup, 300);
  setTimeout(hideSetup, 1200);
  setTimeout(hideSetup, 2500);
})();
</script>`;

const localAssetManagerScript = `
<script>
(function(){
  window.__kittenNestLocalAssetManager = 'local-asset-manager-20260612-1';
  var DB = 'kittenNestLabDB';
  var STORE = 'images';
  var defaults = {
    homeOn: '${homeDay}',
    homeOff: '${homeNight}',
    gameRoom: '${coffeeCorner}'
  };
  var labels = {
    homeOn: '主页亮图',
    homeOff: '主页暗图',
    gameRoom: '第二房间 / 咖啡角'
  };
  var imageIds = {
    homeOn: 'homeOn',
    homeOff: 'homeOff',
    gameRoom: 'gameBg'
  };
  var bodyClasses = {
    homeOn: 'hasHomeOn',
    homeOff: 'hasHomeOff',
    gameRoom: 'hasGameRoom'
  };

  function flashLocal(text){
    var toast = document.getElementById('toast');
    if(window.flash) return window.flash(text);
    if(!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(function(){ toast.classList.remove('show'); }, 1400);
  }

  function openDB(){
    return new Promise(function(resolve, reject){
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function(){
        var db = req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
  }

  async function getLocal(key){
    var db = await openDB();
    return new Promise(function(resolve, reject){
      var tx = db.transaction(STORE, 'readonly');
      var q = tx.objectStore(STORE).get(key);
      q.onsuccess = function(){ resolve(q.result); };
      q.onerror = function(){ reject(q.error); };
    });
  }

  async function deleteLocal(key){
    var db = await openDB();
    return new Promise(function(resolve, reject){
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = function(){ reject(tx.error); };
    });
  }

  function setDefaultSource(key){
    var img = document.getElementById(imageIds[key]);
    if(!img) return;
    img.src = defaults[key];
    img.style.display = '';
    document.body.classList.add(bodyClasses[key]);
  }

  function managerHtml(){
    return '<div id="localAssetManager" class="localAssetManager">'
      + '<div class="localAssetTitle">本地图管理</div>'
      + rowHtml('homeOn')
      + rowHtml('homeOff')
      + rowHtml('gameRoom')
      + '<div class="tiny">“恢复云端默认”只清除这个设备里的本地图，不会删除 Supabase 或 GitHub 图片。</div>'
      + '</div>';
  }

  function rowHtml(key){
    return '<div class="localAssetRow" data-local-row="' + key + '">'
      + '<div><span class="localAssetName">' + labels[key] + '</span><span class="localAssetState" data-local-state="' + key + '">检测中…</span></div>'
      + '<button class="localAssetReset" type="button" data-clear-local="' + key + '">恢复云端默认</button>'
      + '</div>';
  }

  async function refreshStates(){
    var keys = ['homeOn', 'homeOff', 'gameRoom'];
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      var el = document.querySelector('[data-local-state="' + key + '"]');
      if(!el) continue;
      try{
        var local = await getLocal(key);
        el.textContent = local ? '当前来源：本地图 local override' : '当前来源：云端默认 / fallback';
      }catch(e){
        el.textContent = '当前来源：无法检测';
      }
    }
  }

  function install(){
    if(document.getElementById('localAssetManager')) return;
    var target = document.getElementById('miscPage') || document.getElementById('roomPage') || document.getElementById('setup');
    if(!target) return;
    target.insertAdjacentHTML('beforeend', managerHtml());
    refreshStates();
  }

  document.addEventListener('click', async function(e){
    var btn = e.target.closest && e.target.closest('[data-clear-local]');
    if(!btn) return;
    var key = btn.getAttribute('data-clear-local');
    btn.disabled = true;
    try{
      await deleteLocal(key);
      setDefaultSource(key);
      flashLocal('已恢复云端默认');
      await refreshStates();
    }catch(err){
      flashLocal('清除失败');
    }finally{
      btn.disabled = false;
    }
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('pageshow', function(){ install(); refreshStates(); });
})();
</script>`;

const cloudTextPatchScript = `
<script>
(function(){
  window.__kittenNestTextPatch = 'text-patch-20260610-2';
  var lastStamp = '';
  var index = 0;
  function bubble(){ return document.getElementById('bubble'); }
  function items(state){
    if(!state) return [];
    if(Array.isArray(state.alexBubbles)) return state.alexBubbles.map(function(x){ return String(x||'').trim(); }).filter(Boolean);
    return state.alexBubble ? [String(state.alexBubble)] : [];
  }
  function show(text){
    var b = bubble();
    if(!b || !text) return;
    b.textContent = text;
    b.classList.remove('hidden');
    b.setAttribute('data-cloud-refresh','1');
  }
  async function refresh(force){
    try{
      var res = await fetch('/api/state?t=' + Date.now(), { cache:'no-store' });
      if(!res.ok) return;
      var state = await res.json();
      var q = items(state);
      if(!q.length) return;
      var stamp = String(state.updatedAt || '') + '|' + JSON.stringify(q);
      if(stamp !== lastStamp){
        lastStamp = stamp;
        index = Number(state.bubbleIndex || 0) || 0;
        show(q[index % q.length]);
      }else if(force){
        show(q[index % q.length]);
      }
    }catch(e){}
  }
  window.addEventListener('load', function(){ refresh(true); setInterval(function(){ refresh(false); }, 2500); });
  window.addEventListener('focus', function(){ refresh(true); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) refresh(true); });
  setTimeout(function(){ refresh(true); }, 200);
  setTimeout(function(){ refresh(true); }, 1000);
})();
</script>`;

function injectDefaultAssets(html) {
  return String(html)
    .replace('<body>', '<body class="cloudDefaultAssets">')
    .replace('</head>', `${canvasFillCss}\n${setupPatchStyle}\n${localAssetManagerStyle}\n</head>`)
    .replace('<div id="setup" class="setup">', '<div id="setup" class="setup hidden">')
    .replace("function say(t){$('bubble').textContent=t}", "function say(t){bubbleOn=true;$('bubble').textContent=t;syncBubble()}")
    .replace('<img id="homeOn" class="bg home-on">', `<img id="homeOn" class="bg home-on" src="${homeDay}">`)
    .replace('<img id="homeOff" class="bg home-off">', `<img id="homeOff" class="bg home-off" src="${homeNight}">`)
    .replace('<img id="gameBg" class="bg">', `<img id="gameBg" class="bg" src="${coffeeCorner}">`)
    .replace('</body>', `${defaultAssetScript}\n${localAssetManagerScript}\n${cloudTextPatchScript}\n</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithDefaultAssets(body) {
    if (typeof body === 'string') return originalSend(injectDefaultAssets(body));
    return originalSend(body);
  };
  return appQ(req, res);
};