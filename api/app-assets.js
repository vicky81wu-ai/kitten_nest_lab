const appQ = require('./app-q');

function injectDefaultAssets(html) {
  return String(html)
    .replace('<body>', '<body class="hasHomeOn hasHomeOff hasGameRoom">')
    .replace('<img id="homeOn" class="bg home-on">', '<img id="homeOn" class="bg home-on" src="/assets/rooms/home/day.jpg">')
    .replace('<img id="homeOff" class="bg home-off">', '<img id="homeOff" class="bg home-off" src="/assets/rooms/home/night.jpg">')
    .replace('<img id="gameBg" class="bg">', '<img id="gameBg" class="bg" src="/assets/rooms/coffee-corner/morning-evening.jpg">');
}

module.exports = async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithDefaultAssets(body) {
    if (typeof body === 'string') return originalSend(injectDefaultAssets(body));
    return originalSend(body);
  };
  return appQ(req, res);
};
