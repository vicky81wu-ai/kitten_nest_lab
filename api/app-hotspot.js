const appBubble = require('./app-bubble');

const hotspotScript = '<script src="/assets/hotspot-positioner.js?v=20260610-1"></script>';
const hotspotBoot = `
<script>
(function(){
  function boot(){
    if(window.KittenNestHotspots && window.KittenNestHotspots.start){
      window.KittenNestHotspots.start();
    }
  }
  window.addEventListener('load', boot);
  window.addEventListener('pageshow', boot);
  setTimeout(boot, 300);
  setTimeout(boot, 1400);
})();
</script>`;

function injectHotspot(html) {
  return String(html).replace('</body>', `${hotspotScript}\n${hotspotBoot}\n</body>`);
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithHotspot(body) {
    if (typeof body === 'string') return originalSend(injectHotspot(body));
    return originalSend(body);
  };
  return appBubble(req, res);
};
