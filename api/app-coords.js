const appBubble = require('./app-bubble');

const coordScript = '<script src="/assets/coordinate-controller.js?v=20260610-1"></script>';
const hotspotScript = '<script src="/assets/hotspot-positioner.js?v=20260610-1"></script>';
const coordBoot = `
<script>
(function(){
  function boot(){
    var q = new URLSearchParams(location.search);
    var hotspotMode = q.get('hotspot') === '1' || location.pathname.indexOf('cloud-hotspot-test') >= 0;
    if(hotspotMode){
      if(window.KittenNestHotspots && window.KittenNestHotspots.start){
        window.KittenNestHotspots.start();
      }
      return;
    }
    if(window.KittenNestCoords && window.KittenNestCoords.start){
      window.KittenNestCoords.start();
    }
  }
  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  setTimeout(boot, 300);
  setTimeout(boot, 1400);
})();
</script>`;

function injectCoords(html) {
  return String(html).replace('</body>', `${coordScript}\n${hotspotScript}\n${coordBoot}\n</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithCoords(body) {
    if (typeof body === 'string') return originalSend(injectCoords(body));
    return originalSend(body);
  };
  return appBubble(req, res);
};
