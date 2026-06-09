const appQ = require('./app-q');

const ASSET_VERSION = 'room-assets-20260609-4';

function asset(key) {
  return `/api/room-asset?key=${key}&v=${ASSET_VERSION}`;
}

const defaultAssetScript = `
<script>
(function(){
  window.__kittenNestDefaultAssets = '${ASSET_VERSION}';

  function finishDefaultSetup(){
    if(document.body.classList.contains('hasHomeOn') && document.body.classList.contains('hasGameRoom')){
      var setup = document.getElementById('setup');
      if(setup) setup.classList.add('hidden');
    }
  }

  function markWhenReady(id, cls){
    var img = document.getElementById(id);
    if(!img) return;

    function loaded(){
      if(img.naturalWidth > 0){
        document.body.classList.add(cls);
        finishDefaultSetup();
      }
    }

    function failed(){
      img.style.display = 'none';
      document.body.classList.remove(cls);
      console.warn('default asset failed', id, img.getAttribute('src'));
    }

    img.addEventListener('load', loaded);
    img.addEventListener('error', failed);

    if(img.complete) loaded();
  }

  markWhenReady('homeOn', 'hasHomeOn');
  markWhenReady('homeOff', 'hasHomeOff');
  markWhenReady('gameBg', 'hasGameRoom');

  window.addEventListener('pageshow', function(){
    markWhenReady('homeOn', 'hasHomeOn');
    markWhenReady('homeOff', 'hasHomeOff');
    markWhenReady('gameBg', 'hasGameRoom');
    finishDefaultSetup();
  });

  setTimeout(finishDefaultSetup, 300);
  setTimeout(finishDefaultSetup, 1200);
})();
</script>`;

function injectDefaultAssets(html) {
  return String(html)
    .replace('<body>', '<body class="cloudDefaultAssets">')
    .replace('<img id="homeOn" class="bg home-on">', `<img id="homeOn" class="bg home-on" src="${asset('home-day')}">`)
    .replace('<img id="homeOff" class="bg home-off">', `<img id="homeOff" class="bg home-off" src="${asset('home-night')}">`)
    .replace('<img id="gameBg" class="bg">', `<img id="gameBg" class="bg" src="${asset('coffee-corner-morning-evening')}">`)
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
