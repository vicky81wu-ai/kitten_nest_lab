(function(){
  var qs = new URLSearchParams(location.search);
  var overlayLifecycleTest = qs.get('sceneOverlayLifecycleTest') === '1';

  var hotspotCards = {
    'coffeeCorner.tattooHot': {
      id: 'coffeeCorner.tattooHot',
      label: '19.8 tattoo hotspot',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '.tattooHot',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.73, y: 0.345, width: 0.15, height: 0.08 },
      behavior: 'bubble.showOrAdvance',
      runtimeStatus: 'active'
    },
    'coffeeCorner.photoWallHot': {
      id: 'coffeeCorner.photoWallHot',
      label: 'photo wall memories hotspot',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '.photoHot',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.250, y: 0.215, width: 0.340, height: 0.200 },
      behavior: 'memories.open',
      visual: 'transparent',
      runtimeStatus: 'active'
    },
    'coffeeCorner.gameConsoleHotspot': {
      id: 'coffeeCorner.gameConsoleHotspot',
      label: 'game console hotspot',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '.consoleHot',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.205, y: 0.700, width: 0.310, height: 0.125 },
      behavior: 'gameMenu.open',
      visual: 'transparent',
      runtimeStatus: 'active'
    },
    'home.hubbyNoteHot': {
      id: 'home.hubbyNoteHot',
      label: 'pink notebook hubby note hotspot',
      roomId: 'home',
      roomElementId: 'home',
      imageId: 'homeOn',
      selector: '.hubbyNoteButton',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.800, y: 0.605, width: 0.22, height: 0.18, rotation: 7.1, transformOrigin: '0 0' },
      behavior: 'hubbyNote.open',
      visual: 'transparent',
      runtimeStatus: 'active'
    }
  };

  var overlayCards = {
    'home.clockHandsOverlay': {
      id: 'home.clockHandsOverlay',
      label: 'clock hands overlay',
      roomId: 'home',
      roomElementId: 'home',
      imageId: 'homeOn',
      selector: '.clock',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.2108, y: 0.3353, width: 0.312, aspectRatio: 1 },
      runtimeStatus: 'active'
    },
    'coffeeCorner.bubbleOverlay': {
      id: 'coffeeCorner.bubbleOverlay',
      label: 'coffee corner speech bubble overlay',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '.bubble',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.905, y: 0.230, width: 0.480, anchor: 'bottomRight', heightMode: 'auto', growthDirection: 'upward' },
      runtimeStatus: 'active'
    },
    'coffeeCorner.steamOverlay': {
      id: 'coffeeCorner.steamOverlay',
      label: 'coffee cup steam overlay',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '#gameRoom .steam',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.503, y: 0.313, width: 0.086, height: 0.132 },
      runtimeStatus: 'active'
    },
    'coffeeCorner.photoGlowOverlay': {
      id: 'coffeeCorner.photoGlowOverlay',
      label: 'photo wall glow overlay',
      roomId: 'coffeeCorner',
      roomElementId: 'gameRoom',
      imageId: 'gameBg',
      selector: '#gameRoom .photoGlow',
      coordinateMode: 'lockedToBaseImage',
      coordinate: { x: 0.280, y: 0.225, width: 0.440, height: 0.250 },
      runtimeStatus: 'active'
    }
  };

  var defaultHotspotId = 'coffeeCorner.tattooHot';
  var defaultOverlayId = 'home.clockHandsOverlay';

  function getCard(id){ return hotspotCards[id || defaultHotspotId] || null; }
  function getOverlayCard(id){ return overlayCards[id || defaultOverlayId] || null; }

  function installOverlayCardGate(){
    if(!overlayLifecycleTest || document.getElementById('overlayCardPositionerGateStyle')) return;
    var selectors = Object.keys(overlayCards).map(function(id){
      return overlayCards[id].selector + ':not([data-positioner-applied="1"])';
    }).join(',');
    if(!selectors) return;
    var s = document.createElement('style');
    s.id = 'overlayCardPositionerGateStyle';
    s.textContent = selectors + '{opacity:0!important;pointer-events:none!important}';
    document.head.appendChild(s);
  }

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

    if(boxRatio > imgRatio){
      drawH = rect.width / imgRatio;
      offsetY = (rect.height - drawH) / 2;
    }else{
      drawW = rect.height * imgRatio;
      offsetX = (rect.width - drawW) / 2;
    }

    return { left: rect.left + offsetX, top: rect.top + offsetY, width: drawW, height: drawH };
  }

  function isCardRoomActive(card){
    if(!card || !card.roomElementId) return true;
    var room = document.getElementById(card.roomElementId);
    return !!(room && room.classList.contains('active'));
  }

  function hideInactiveTarget(target, card){
    if(!target || !card) return;
    if(target.getAttribute('data-coordinate-hotspot') === card.id || target.getAttribute('data-coordinate-overlay') === card.id){
      target.style.pointerEvents = 'none';
      target.style.opacity = '0';
      target.setAttribute('data-coordinate-inactive', '1');
      if(target.getAttribute('data-coordinate-overlay') === card.id) target.removeAttribute('data-positioner-applied');
    }
  }

  function showActiveTarget(target){
    if(!target) return;
    target.style.pointerEvents = '';
    target.style.opacity = '';
    target.removeAttribute('data-coordinate-inactive');
  }

  function setImportant(el, name, value){
    el.style.setProperty(name, value, 'important');
  }

  function applyTransparentVisual(hot){
    hot.style.padding = '0';
    hot.style.border = '0';
    hot.style.background = 'transparent';
    hot.style.boxShadow = 'none';
    hot.style.backdropFilter = 'none';
    hot.style.webkitBackdropFilter = 'none';
    hot.style.color = 'transparent';
    hot.style.fontSize = '0';
    hot.style.textShadow = 'none';
    hot.style.borderRadius = '18px';
  }

  function applyRotation(hot, point){
    var rotation = Number(point.rotation || 0);
    var origin = point.transformOrigin || '50% 50%';
    hot.style.transformOrigin = origin;
    hot.style.transform = rotation ? ('rotate(' + rotation + 'deg)') : '';
  }

  function applyCard(card){
    if(!card || !card.coordinate) return false;
    var hot = document.querySelector(card.selector);
    if(!hot) return false;
    if(!isCardRoomActive(card)){
      hideInactiveTarget(hot, card);
      return false;
    }

    var img = document.getElementById(card.imageId);
    var box = coverBox(img);
    if(!img || !box) return false;

    showActiveTarget(hot);
    var point = card.coordinate;
    var parent = hot.offsetParent || document.body;
    var parentRect = parent.getBoundingClientRect();
    var w = box.width * point.width;
    var h = box.height * point.height;
    var cx = box.left + point.x * box.width;
    var cy = box.top + point.y * box.height;

    hot.style.left = (cx - parentRect.left - w / 2) + 'px';
    hot.style.top = (cy - parentRect.top - h / 2) + 'px';
    hot.style.right = 'auto';
    hot.style.bottom = 'auto';
    hot.style.width = w + 'px';
    hot.style.height = h + 'px';
    hot.style.zIndex = '28';
    hot.setAttribute('data-coordinate-hotspot', card.id);
    hot.setAttribute('data-hotspot-label', card.label || card.id);
    hot.setAttribute('data-hotspot-behavior', card.behavior || '');

    if(card.visual === 'transparent') applyTransparentVisual(hot);
    applyRotation(hot, point);

    if(qs.get('debugHotspot') === '1'){
      hot.style.background = 'rgba(255,80,130,.18)';
      hot.style.outline = '2px solid rgba(255,80,130,.85)';
      hot.style.borderRadius = '18px';
      hot.style.color = 'rgba(122,64,84,.95)';
      hot.style.fontSize = '12px';
    }

    return true;
  }

  function applyBottomRightAutoOverlay(overlay, card, box, parentRect){
    var point = card.coordinate;
    var w = box.width * point.width;
    var rightEdge = box.left + point.x * box.width;
    var bottomEdge = box.top + point.y * box.height;
    var left = rightEdge - w - parentRect.left;
    var bottom = parentRect.bottom - bottomEdge;

    setImportant(overlay, 'left', left + 'px');
    setImportant(overlay, 'right', 'auto');
    setImportant(overlay, 'top', 'auto');
    setImportant(overlay, 'bottom', bottom + 'px');
    setImportant(overlay, 'width', w + 'px');
    setImportant(overlay, 'max-width', w + 'px');
    setImportant(overlay, 'height', 'auto');
    overlay.style.transformOrigin = '100% 100%';
  }

  function applyOverlayCard(card){
    if(!card || !card.coordinate) return false;
    var overlay = document.querySelector(card.selector);
    if(!overlay) return false;
    if(!isCardRoomActive(card)){
      hideInactiveTarget(overlay, card);
      return false;
    }

    var img = document.getElementById(card.imageId);
    var box = coverBox(img);
    if(!img || !box) return false;

    var point = card.coordinate;
    var parent = overlay.offsetParent || document.body;
    var parentRect = parent.getBoundingClientRect();

    if(point.anchor === 'bottomRight' && point.heightMode === 'auto'){
      applyBottomRightAutoOverlay(overlay, card, box, parentRect);
    }else{
      var w = box.width * point.width;
      var ratio = point.aspectRatio || 1;
      var h = point.height != null ? box.height * point.height : w / ratio;
      var cx = box.left + point.x * box.width;
      var cy = box.top + point.y * box.height;
      setImportant(overlay, 'left', (cx - parentRect.left - w / 2) + 'px');
      setImportant(overlay, 'top', (cy - parentRect.top - h / 2) + 'px');
      setImportant(overlay, 'right', 'auto');
      setImportant(overlay, 'bottom', 'auto');
      setImportant(overlay, 'width', w + 'px');
      setImportant(overlay, 'height', h + 'px');
    }

    overlay.setAttribute('data-coordinate-overlay', card.id);
    overlay.setAttribute('data-overlay-label', card.label || card.id);
    overlay.setAttribute('data-positioner-applied', '1');
    showActiveTarget(overlay);

    if(qs.get('debugOverlay') === '1'){
      overlay.style.outline = '2px solid rgba(80,160,255,.85)';
      overlay.style.background = 'rgba(80,160,255,.10)';
    }

    return true;
  }

  function apply(id){ return applyCard(getCard(id)); }
  function applyOverlay(id){ return applyOverlayCard(getOverlayCard(id)); }

  function applyAll(){
    var ok = false;
    Object.keys(hotspotCards).forEach(function(id){ ok = applyCard(hotspotCards[id]) || ok; });
    Object.keys(overlayCards).forEach(function(id){ ok = applyOverlayCard(overlayCards[id]) || ok; });
    return ok;
  }

  function start(){
    installOverlayCardGate();
    applyAll();
    window.addEventListener('resize', applyAll);
    window.addEventListener('orientationchange', applyAll);
    window.addEventListener('pageshow', applyAll);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) applyAll(); });
    document.addEventListener('click', function(){ setTimeout(applyAll, 80); }, true);
    setTimeout(applyAll, 200);
    setTimeout(applyAll, 700);
    setTimeout(applyAll, 1500);
    setTimeout(applyAll, 2600);
  }

  window.KittenNestHotspots = {
    version: overlayLifecycleTest ? 'coordinate-hotspot-overlay-card-20260615-overlay-gated-test-1' : 'coordinate-hotspot-overlay-card-20260614-steam-overlay-locked-1',
    cards: hotspotCards,
    overlayCards: overlayCards,
    defaultHotspotId: defaultHotspotId,
    defaultOverlayId: defaultOverlayId,
    getCard: getCard,
    getOverlayCard: getOverlayCard,
    coverBox: coverBox,
    apply: apply,
    applyOverlay: applyOverlay,
    applyCard: applyCard,
    applyOverlayCard: applyOverlayCard,
    applyAll: applyAll,
    start: start
  };
})();
