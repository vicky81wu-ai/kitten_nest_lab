const appQ = require('./app-q');

const ASSET_VERSION = 'room-assets-20260609-10';

const STATIC_ASSETS = {
  'home-day': '/assets/rooms/home/day.jpg',
  'home-night': '/assets/rooms/home/night.jpg',
  'coffee-corner-morning-evening': '/assets/rooms/coffee-corner/morning-evening.jpg'
};

function asset(key) {
  return `/api/room-asset?key=${key}&v=${ASSET_VERSION}`;
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

const setupPatchStyle = `
<style id="cloudDefaultAssetsSetupPatch">
body.cloudDefaultAssets #setup{display:none!important;}
body.cloudDefaultAssets #home{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
body.cloudDefaultAssets #home .fallback{background-image:url('${homeDay}'),url('${homeDayStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets.homeDim #home .fallback{background-image:url('${homeNight}'),url('${homeNightStatic}'),${fallbackPaint}!important;background-position:center,center,center!important;background-size:cover,cover,auto!important;background-repeat:no-repeat,no-repeat,no-repeat!important;}
body.cloudDefaultAssets #gameRoom{background-image:url('${coffeeCorner}'),url('${coffeeCornerStatic}'),${fallbackPaint};background-position:center,center,center;background-size:cover,cover,auto;background-repeat:no-repeat,no-repeat,no-repeat;background-color:#120b12;}
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

function injectDefaultAssets(html) {
  return String(html)
    .replace('<body>', '<body class="cloudDefaultAssets">')
    .replace('</head>', `${setupPatchStyle}\n</head>`)
    .replace('<div id="setup" class="setup">', '<div id="setup" class="setup hidden">')
    .replace("function say(t){$('bubble').textContent=t}", "function say(t){bubbleOn=true;$('bubble').textContent=t;syncBubble()}")
    .replace('<img id="homeOn" class="bg home-on">', `<img id="homeOn" class="bg home-on" src="${homeDay}">`)
    .replace('<img id="homeOff" class="bg home-off">', `<img id="homeOff" class="bg home-off" src="${homeNight}">`)
    .replace('<img id="gameBg" class="bg">', `<img id="gameBg" class="bg" src="${coffeeCorner}">`)
    .replace('</body>', `${defaultAssetScript}\n</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithDefaultAssets(body) {
    if (typeof body === 'string') return originalSend(injectDefaultAssets(body));
    return originalSend(body);
  };
  return appQ(req, res);
};
