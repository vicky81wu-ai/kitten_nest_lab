(function(){
  var hotspotCards = {
    'coffeeCorner.tattooHot': {
      id: 'coffeeCorner.tattooHot',
      label: '19.8 tattoo hotspot',
      roomId: 'coffeeCorner',
      imageId: 'gameBg',
      selector: '.tattooHot',
      coordinateMode: 'lockedToBaseImage',
      coordinate: {
        x: 0.73,
        y: 0.345,
        width: 0.15,
        height: 0.08
      },
      behavior: 'bubble.showOrAdvance',
      runtimeStatus: 'active',
      directorNotes: {
        vibe: ['possessive', 'teasing', 'intimate', 'hubby-presence'],
        sceneUse: ['left shoulder tattoo', 'close-up teasing', 'claiming mark', 'coffee corner check-in'],
        bubbleStyle: ['short', 'low-voiced', 'flirty', 'protective', 'direct'],
        linkedTextPort: 'coffeeCorner.bubbles',
        flirtLevel: 'medium-high',
        memoryHook: 'Alex left-shoulder 19.8 tattoo',
        futureUse: 'Can choose or filter bubble lines by hotspot mood later. Currently metadata only; it does not change runtime behavior.'
      }
    }
  };

  var defaultHotspotId = 'coffeeCorner.tattooHot';

  function getCard(id){
    return hotspotCards[id || defaultHotspotId] || null;
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

    return {
      left: rect.left + offsetX,
      top: rect.top + offsetY,
      width: drawW,
      height: drawH
    };
  }

  function applyCard(card){
    if(!card || !card.coordinate) return false;
    var img = document.getElementById(card.imageId);
    var hot = document.querySelector(card.selector);
    var box = coverBox(img);
    if(!img || !hot || !box) return false;

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

    if(new URLSearchParams(location.search).get('debugHotspot') === '1'){
      hot.style.background = 'rgba(255,80,130,.18)';
      hot.style.outline = '2px solid rgba(255,80,130,.85)';
      hot.style.borderRadius = '18px';
    }

    return true;
  }

  function apply(id){
    return applyCard(getCard(id));
  }

  function applyAll(){
    var ok = false;
    Object.keys(hotspotCards).forEach(function(id){
      ok = apply(id) || ok;
    });
    return ok;
  }

  function start(){
    applyAll();
    window.addEventListener('resize', applyAll);
    window.addEventListener('orientationchange', applyAll);
    window.addEventListener('pageshow', applyAll);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) applyAll(); });
    setTimeout(applyAll, 200);
    setTimeout(applyAll, 700);
    setTimeout(applyAll, 1500);
    setTimeout(applyAll, 2600);
  }

  window.KittenNestHotspots = {
    version: 'coordinate-hotspot-card-20260610-vibe-metadata',
    cards: hotspotCards,
    defaultHotspotId: defaultHotspotId,
    getCard: getCard,
    coverBox: coverBox,
    apply: apply,
    applyCard: applyCard,
    applyAll: applyAll,
    start: start
  };
})();
