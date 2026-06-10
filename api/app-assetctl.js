const appWeather = require('./app-weather');

const assetControllerScript = '<script src="/assets/asset-controller.js?v=20260610-1"></script>';
const assetBootScript = `
<script>
(function(){
  function boot(){
    if(window.KittenNestAssets && window.KittenNestAssets.applyDefaults){
      window.KittenNestAssets.applyDefaults();
    }
  }
  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 200);
  setTimeout(boot, 1200);
})();
</script>`;

function injectAssetController(html) {
  const bundle = `${assetControllerScript}\n${assetBootScript}\n`;
  return String(html).replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithAssetController(body) {
    if (typeof body === 'string') return originalSend(injectAssetController(body));
    return originalSend(body);
  };
  return appWeather(req, res);
};
