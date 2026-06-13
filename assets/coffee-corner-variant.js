(function(){
  var VERSION = 'coffee-corner-variant-20260613-lap-no-default-test-1';
  var LAP_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var mainSrc = '';
  var mode = 'main';
  var enterHot;
  var backHot;

  var enterCard = {
    id: 'coffeeCorner.lapEnterHot',
    label: 'coffee corner lap close enter hotspot',
    coordinate: { x: 0.315, y: 0.52, width: 0.33, height: 0.12 },
    debugVisible: false
  };

  var backCard = {
    id: 'coffeeCorner.lapBackHot',
    label: 'coffee corner lap close back hotspot',
    coordinate: { x: 0.12, y: 0.86, width: 0.24, height: 0.20 },
    debugVisible: true
  };

  function room(){ return document.getElementById('gameRoom'); }
  function img(){ return document.getElementById('gameBg'); }
  function mainBubble(){ return document.getElementById('bubble'); }
  function lapBubble(){ return document.getElementById('lapCloseBubble'); }
  function isDebug(){ return new URLSearchParams(location.search).get('debugLap') === '1'; }

  function isLapActive(){
    var image = img();
    var src = String((image && image.currentSrc) || (image && image.src) || '');
    return mode === 'lap' && src.indexOf('lap-close-01.jpg') !== -1;
  }

  function coverBox(image){
    if(!image) return null;
    var rect = image.getBoundingClientRect();
    var naturalW = image.naturalWidth || rect.width;
    var naturalH = image.naturalHeight || rect.height;
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

  function makeHot(className, label){
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'hot ' + className;
    el.setAttribute('aria-label', label);
    el.style.position = 'absolute';
    el.style.border = '0';
    el.style.padding = '0';
    el.style.background = 'transparent';
    el.style.zIndex = '35';
    el.style.borderRadius = '22px';
    el.style.pointerEvents = 'auto';
    return el;
  }

  function ensureHotspots(){
    var r = room();
    if(!r) return false;
    if(!enterHot){
      enterHot = makeHot('lapEnterHot', '坐腿上近景');
      enterHot.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); enterLap(); }, true);
      enterHot.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); enterLap(); }, true);
      r.appendChild(enterHot);
    }
    if(!backHot){
      backHot = makeHot('lapBackHot', '返回咖啡角全景');
      backHot.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); backMain(); }, true);
      backHot.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); backMain(); }, true);
      r.appendChild(backHot);
    }
    return true;
  }

  function paintDebug(hot, card){
    if(isDebug() && card.debugVisible){
      hot.style.background = 'rgba(255,80,130,.18)';
      hot.style.outline = '2px solid rgba(255,80,130,.85)';
    }else{
      hot.style.background = 'transparent';
      hot.style.outline = '0';
    }
  }

  function hideHot(hot){
    if(!hot) return;
    hot.style.display = 'none';
    hot.style.pointerEvents = 'none';
    hot.style.background = 'transparent';
    hot.style.outline = '0';
  }

  function showHot(hot, card){
    if(!hot) return;
    hot.style.display = 'block';
    hot.style.pointerEvents = 'auto';
    paintDebug(hot, card);
  }

  function applyCard(hot, card){
    var image = img();
    var r = room();
    var box = coverBox(image);
    if(!hot || !r || !box) return false;
    var parentRect = r.getBoundingClientRect();
    var c = card.coordinate;
    var w = box.width * c.width;
    var h = box.height * c.height;
    var cx = box.left + box.width * c.x;
    var cy = box.top + box.height * c.y;
    hot.style.left = (cx - parentRect.left - w / 2) + 'px';
    hot.style.top = (cy - parentRect.top - h / 2) + 'px';
    hot.style.width = w + 'px';
    hot.style.height = h + 'px';
    hot.setAttribute('data-variant-hotspot', card.id);
    hot.setAttribute('data-hotspot-label', card.label);
    paintDebug(hot, card);
    return true;
  }

  function forceHideBubble(el, reason){
    if(!el) return;
    el.classList.add('hidden');
    el.setAttribute('data-lap-hidden', reason || '1');
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.removeAttribute('data-active');
    el.removeAttribute('data-has-text');
  }

  function releaseMainBubble(el){
    if(!el) return;
    if(el.getAttribute('data-lap-hidden') !== 'main-bubble') return;
    el.removeAttribute('data-lap-hidden');
    el.style.removeProperty('display');
    el.style.removeProperty('pointer-events');
  }

  function scrubLapBubble(){
    var oldLapBubble = lapBubble();
    if(!oldLapBubble) return;
    oldLapBubble.textContent = '';
    forceHideBubble(oldLapBubble, 'lap-bubble-empty-or-disabled');
  }

  function setMode(next){
    var image = img();
    if(!image) return;
    if(!mainSrc) mainSrc = image.getAttribute('src') || '';
    mode = next === 'lap' ? 'lap' : 'main';
    document.body.classList.toggle('coffeeLapVariant', mode === 'lap');
    image.src = mode === 'lap' ? LAP_URL : mainSrc;
    updateHotspots();
    image.onload = function(){ updateHotspots(); };
    setTimeout(updateHotspots, 120);
    setTimeout(updateHotspots, 520);
  }

  function enterLap(){ setMode('lap'); }
  function backMain(){ setMode('main'); }

  function updateHotspots(){
    if(!ensureHotspots()) return;
    applyCard(enterHot, enterCard);
    applyCard(backHot, backCard);
    var main = mainBubble();
    scrubLapBubble();
    if(isLapActive()){
      hideHot(enterHot);
      showHot(backHot, backCard);
      forceHideBubble(main, 'main-bubble');
    }else{
      showHot(enterHot, enterCard);
      hideHot(backHot);
      releaseMainBubble(main);
      scrubLapBubble();
    }
  }

  function boot(){
    var image = img();
    if(image && !mainSrc) mainSrc = image.getAttribute('src') || '';
    ensureHotspots();
    updateHotspots();
  }

  window.KittenNestCoffeeCornerVariant = {
    version: VERSION,
    lapUrl: LAP_URL,
    enterCard: enterCard,
    backCard: backCard,
    enterLap: enterLap,
    backMain: backMain,
    updateHotspots: updateHotspots,
    boot: boot
  };

  window.addEventListener('load', boot);
  window.addEventListener('resize', updateHotspots);
  window.addEventListener('orientationchange', updateHotspots);
  window.addEventListener('pageshow', boot);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) boot(); });
  setTimeout(boot, 300);
  setTimeout(boot, 1300);
})();