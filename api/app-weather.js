const appAssets = require('./app-assets');

const stateClientScript = '<script src="/assets/state-client.js?v=20260610-1"></script>';
const weatherControllerScript = '<script src="/assets/weather-controller.js?v=20260610-1"></script>';
const weatherBootScript = `
<script>
(function(){
  function boot(){
    if(!window.KittenNestState || !window.KittenNestWeather) return;
    if(!window.__kittenNestWeatherAttached){
      window.__kittenNestWeatherAttached = window.KittenNestWeather.attach(window.KittenNestState);
    }
    window.KittenNestState.refresh('weather').catch(function(){});
  }
  window.addEventListener('load', boot);
  window.addEventListener('focus', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 250);
  setTimeout(boot, 1200);
})();
</script>`;

function injectWeatherController(html) {
  const marker = '<script src="/assets/weather-patch.js';
  const bundle = `${stateClientScript}\n${weatherControllerScript}\n${weatherBootScript}\n`;
  if (String(html).includes(marker)) return String(html).replace(marker, bundle + marker);
  return String(html).replace('</body>', `${bundle}</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithWeatherController(body) {
    if (typeof body === 'string') return originalSend(injectWeatherController(body));
    return originalSend(body);
  };
  return appAssets(req, res);
};
