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
const assetResolverLibScript = '<script src="/lib/asset-resolver.js?v=static-20260612-1"></script>';

const setupPatchStyle = `
<style id="cloudDefaultAssetsSetupPatch">
body.cloudDefaultAssets #setup.hidden{display:none!important;}
body.cloudDefaultAssets #home{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
body.cloudDefaultAssets #home .fallback{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets.homeDim #home .fallback{background-image:url('${homeNight}'),url('${homeNightStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets #gameRoom{background-image:url('${coffeeCorner}'),url('${coffeeCornerStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
.assetAdminLink{display:block;text-align:center;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.78);box-shadow:inset 0 0 0 1px rgba(151,83,103,.14);color:#6b3d49;text-decoration:none;font-size:12px;font-weight:800;}
.assetAdminLink:active{transform:scale(.98)}
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

const dynamicAssetResolverScript = `
<script>
(function(){
  window.__kittenNestDynamicAssets = 'static-resolver-20260612-1';

  var slots = [
    { id: 'homeOn', room: 'home', slot: 'background.day', label: 'home.day' },
    { id: 'homeOff', room: 'home', slot: 'background.night', label: 'home.night' },
    { id: 'gameBg', room: 'coffeeCorner', slot: 'background.main', label: 'coffeeCorner.main' }
  ];

  function resolver(){
    return window.KittenNestAssetResolver;
  }

  function cleanUrl(url){
    return String(url || '');
  }

  async function applyOne(item){
    var api = resolver();
    var img = document.getElementById(item.id);
    if(!api || !api.resolveAsset || !img) return null;

    var result = await api.resolveAsset(item.room, item.slot);
    if(!result || !result.url) return null;

    var next = cleanUrl(result.url);
    img.setAttribute('data-asset-source', result.source || '');
    img.setAttribute('data-asset-room', item.room);
    img.setAttribute('data-asset-slot', item.slot);
    if(result.local_key) img.setAttribute('data-local-key', result.local_key);

    if(img.getAttribute('src') !== next){
      img.src = next;
    }

    return result;
  }

  async function applyAll(){
    try{
      if(!resolver()) return false;
      var report = {};
      for(var i=0;i<slots.length;i++){
        var item = slots[i];
        var result = await applyOne(item);
        if(result) report[item.label] = result.source;
      }
      window.__kittenNestAssetSources = report;
      document.body.setAttribute('data-asset-resolver', 'on');
      return true;
    }catch(e){
      console.log('kitten nest dynamic asset resolver failed', e);
      return false;
    }
  }

  function boot(){
    applyAll();
  }

  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  window.addEventListener('focus', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 120);
  setTimeout(boot, 500);
  setTimeout(boot, 1400);
})();
</script>`;

function injectDefaultAssets(html) {
  return String(html)
    .replace('<body>', '<body class="cloudDefaultAssets">')
    .replace('</head>', `${canvasFillCss}\n${setupPatchStyle}\n</head>`)
    .replace('<div id="setup" class="setup">', '<div id="setup" class="setup hidden">')
    .replace('<div id="miscPage" class="setupPage"><div class="tiny">', '<div id="miscPage" class="setupPage"><a class="assetAdminLink" href="/assets-admin/?v=from-cloud-setup">素材库后台</a><a class="assetAdminLink" href="/local-reset/?v=from-cloud-setup">撤下本地图</a><div class="tiny">')
    .replace("function say(t){$('bubble').textContent=t}", "function say(t){if(window.__coffeeCornerBubbleClean&&window.__coffeeCornerBubbleClean.setQueue){window.__coffeeCornerBubbleClean.setQueue([t],0).show();return;}$('bubble').textContent=t}")
    .replace('<img id="homeOn" class="bg home-on">', `<img id="homeOn" class="bg home-on" src="${homeDay}">`)
    .replace('<img id="homeOff" class="bg home-off">', `<img id="homeOff" class="bg home-off" src="${homeNight}">`)
    .replace('<img id="gameBg" class="bg">', `<img id="gameBg" class="bg" src="${coffeeCorner}">`)
    .replace('</body>', `${assetResolverLibScript}\n${defaultAssetScript}\n${dynamicAssetResolverScript}\n</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithDefaultAssets(body) {
    if (typeof body === 'string') return originalSend(injectDefaultAssets(body));
    return originalSend(body);
  };
  return appQ(req, res);
};
