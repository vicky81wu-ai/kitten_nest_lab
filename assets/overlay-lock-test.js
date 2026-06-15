(function(){
  var VERSION = 'overlay-lock-test-20260614-1';
  var enabled = new URLSearchParams(location.search).get('overlayLockTest') === '1';
  if(!enabled) return;

  var cards = {
    steam: {
      id: 'coffeeCorner.steamOverlay',
      selector: '#gameRoom .steam',
      imageId: 'gameBg',
      roomElementId: 'gameRoom',
      coordinate: { x: 0.503, y: 0.313, width: 0.086, height: 0.132 }
    },
    photoGlow: {
      id: 'coffeeCorner.photoGlowOverlay',
      selector: '#gameRoom .photoGlow',
      imageId: 'gameBg',
      roomElementId: 'gameRoom',
      coordinate: { x: 0.280, y: 0.225, width: 0.440, height: 0.250 }
    }
  };

  function coverBox(img){
    if(!img) return null;
    var rect = img.getBoundingClientRect();
    var naturalW = img.naturalWidth || rect.width;
    var naturalH = img.naturalHeight || rect.height;
    if(!rect.width || !rect.height || !naturalW || !naturalH) return null;
    var boxRatio = rect.width / rect.height;
    var imgRatio = naturalW / naturalH;
    var drawW = rect.width;
    var drawH = rect.height;
    var offsetX = 0;
    var offsetY = 0;
    if(boxRatio > imgRatio){ drawH = rect.width / imgRatio; offsetY = (rect.height - drawH) / 2; }
    else{ drawW = rect.height * imgRatio; offsetX = (rect.width - drawW) / 2; }
    return { left: rect.left + offsetX, top: rect.top + offsetY, width: drawW, height: drawH };
  }

  function activeRoom(card){
    var room = document.getElementById(card.roomElementId);
    return !!(room && room.classList.contains('active'));
  }

  function place(card){
    var el = document.querySelector(card.selector);
    var img = document.getElementById(card.imageId);
    var box = coverBox(img);
    if(!el || !img || !box) return false;
    if(!activeRoom(card)) return false;

    var parent = el.offsetParent || document.body;
    var parentRect = parent.getBoundingClientRect();
    var point = card.coordinate;
    var w = box.width * point.width;
    var h = box.height * point.height;
    var cx = box.left + box.width * point.x;
    var cy = box.top + box.height * point.y;

    el.style.setProperty('left', (cx - parentRect.left - w / 2) + 'px', 'important');
    el.style.setProperty('top', (cy - parentRect.top - h / 2) + 'px', 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('width', w + 'px', 'important');
    el.style.setProperty('height', h + 'px', 'important');
    el.setAttribute('data-coordinate-overlay-test', card.id);
    return true;
  }

  function placeAll(){
    place(cards.steam);
    place(cards.photoGlow);
  }

  function start(){
    document.body.setAttribute('data-overlay-lock-test', VERSION);
    placeAll();
    window.addEventListener('resize', placeAll);
    window.addEventListener('orientationchange', placeAll);
    window.addEventListener('pageshow', placeAll);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) placeAll(); });
    document.addEventListener('click', function(){ setTimeout(placeAll, 60); }, true);
    setTimeout(placeAll, 200);
    setTimeout(placeAll, 700);
    setTimeout(placeAll, 1500);
  }

  window.KittenNestOverlayLockTest = { version: VERSION, placeAll: placeAll, cards: cards };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
