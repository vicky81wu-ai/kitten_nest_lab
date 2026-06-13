(function(){
  var VERSION = 'coffee-corner-variant-20260613-5-lap-chest-cycle';
  var LAP_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co/storage/v1/object/public/nest-public-assets/assets/rooms/coffee-corner/variants/lap-close-01.jpg?v=20260613-lap-close-1';
  var mainSrc = '';
  var mode = 'main';
  var enterHot;
  var backHot;
  var chestHot;
  var lapBubble;
  var stateSubscribed = false;
  var lapLines = [];
  var lapIndex = 0;

  var enterCard = {
    id: 'coffeeCorner.lapEnterHot',
    label: 'coffee corner lap close enter hotspot',
    coordinate: { x: 0.48, y: 0.48, width: 0.24, height: 0.17 }
  };

  var backCard = {
    id: 'coffeeCorner.lapBackHot',
    label: 'coffee corner lap close back hotspot',
    coordinate: { x: 0.12, y: 0.86, width: 0.24, height: 0.20 }
  };

  var chestCard = {
    id: 'coffeeCorner.lapChestHot',
    label: 'coffee corner lap close chest hotspot',
    coordinate: { x: 0.56, y: 0.67, width: 0.40, height: 0.26 }
  };

  function room(){ return document.getElementById('gameRoom'); }
  function img(){ return document.getElementById('gameBg'); }
  function mainBubble(){ return document.getElementById('bubble'); }

  function cleanText(value){ return String(value || '').trim(); }

  function linesFrom(value){
    if(Array.isArray(value)) return value.map(cleanText).filter(Boolean).slice(0,30);
    return String(value || '').split(/\r?\n/).map(cleanText).filter(Boolean).slice(0,30);
  }

  function linesFromState(state){
    if(!state) return [];
    var list = linesFrom(state.coffeeCornerLapCloseBubbles);
    if(list.length) return list;
    list = linesFrom(state.lapCloseBubbles);
    if(list.length) return list;
    list = linesFrom(state.coffeeCornerLapCloseBubble);
    if(list.length) return list;
    return linesFrom(state.lapCloseBubble);
  }

  function hasLapText(){ return lapLines.length > 0; }

  function currentLapText(){
    if(!lapLines.length) return '';
    if(lapIndex < 0 || lapIndex >= lapLines.length) lapIndex = 0;
    return lapLines[lapIndex] || '';
  }

  function syncLapBubbleLines(lines){
    lapLines = Array.isArray(lines) ? lines.map(cleanText).filter(Boolean).slice(0,30) : linesFrom(lines);
    if(lapIndex >= lapLines.length) lapIndex = 0;
    var b = ensureLapBubble();
    if(!b) return false;
    b.textContent = currentLapText();
    if(hasLapText()) b.setAttribute('data-has-text', '1');
    else b.removeAttribute('data-has-text');
    return true;
  }

  function showNextLapBubble(){
    var b = ensureLapBubble();
    if(!b || mode !== 'lap' || !hasLapText()) return;
    if(b.getAttribute('data-active') === '1'){
      lapIndex = (lapIndex + 1) % lapLines.length;
    }
    b.textContent = currentLapText();
    b.setAttribute('data-has-text', '1');
    b.setAttribute('data-active', '1');
  }

  function readStateLines(){
    var client = window.KittenNestState;
    if(!client || typeof client.get !== 'function') return [];
    return linesFromState(client.get());
  }

  function attachState(){
    var client = window.KittenNestState;
    if(!client) return false;
    var list = readStateLines();
    syncLapBubbleLines(list);
    if(stateSubscribed || typeof client.subscribe !== 'function') return list.length > 0;
    stateSubscribed = true;
    client.subscribe(function(payload){
      var list = linesFromState(payload && payload.state);
      syncLapBubbleLines(list);
      updateHotspots();
    });
    return true;
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

  function ensureLapBubble(){
    var r = room();
    if(!r) return null;
    if(!lapBubble){
      lapBubble = document.createElement('div');
      lapBubble.id = 'lapCloseBubble';
      lapBubble.className = 'lapBubble';
      lapBubble.setAttribute('data-text-port', 'coffeeCorner.lapCloseBubble');
      lapBubble.setAttribute('data-director-ref', 'director.textPorts.coffeeCornerLapCloseBubble');
      lapBubble.textContent = '';
      r.appendChild(lapBubble);
    }
    return lapBubble;
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
    if(!chestHot){
      chestHot = makeHot('lapChestHot', '坐腿近景胸口互动区');
      chestHot.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); showNextLapBubble(); }, true);
      chestHot.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); showNextLapBubble(); }, true);
      r.appendChild(chestHot);
    }
    ensureLapBubble();
    return true;
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
    if(new URLSearchParams(location.search).get('debugLap') === '1'){
      hot.style.background = 'rgba(255,80,130,.18)';
      hot.style.outline = '2px solid rgba(255,80,130,.85)';
    }else{
      hot.style.background = 'transparent';
      hot.style.outline = '0';
    }
    return true;
  }

  function setMode(next){
    var image = img();
    if(!image) return;
    if(!mainSrc) mainSrc = image.getAttribute('src') || '';
    mode = next === 'lap' ? 'lap' : 'main';
    document.body.classList.toggle('coffeeLapVariant', mode === 'lap');
    image.src = mode === 'lap' ? LAP_URL : mainSrc;
    attachState();
    updateHotspots();
    setTimeout(updateHotspots, 120);
    setTimeout(updateHotspots, 520);
  }

  function enterLap(){ setMode('lap'); }
  function backMain(){ setMode('main'); }

  function updateHotspots(){
    if(!ensureHotspots()) return;
    applyCard(enterHot, enterCard);
    applyCard(backHot, backCard);
    applyCard(chestHot, chestCard);
    var b = ensureLapBubble();
    var main = mainBubble();
    if(mode === 'lap'){
      enterHot.style.display = 'none';
      enterHot.style.pointerEvents = 'none';
      backHot.style.display = 'block';
      backHot.style.pointerEvents = 'auto';
      chestHot.style.display = 'block';
      chestHot.style.pointerEvents = 'auto';
      if(b) b.removeAttribute('data-active');
      if(main) main.setAttribute('data-lap-hidden', '1');
    }else{
      enterHot.style.display = 'block';
      enterHot.style.pointerEvents = 'auto';
      backHot.style.display = 'none';
      backHot.style.pointerEvents = 'none';
      chestHot.style.display = 'none';
      chestHot.style.pointerEvents = 'none';
      if(b) b.removeAttribute('data-active');
      if(main) main.removeAttribute('data-lap-hidden');
    }
  }

  function boot(){
    var image = img();
    if(image && !mainSrc) mainSrc = image.getAttribute('src') || '';
    ensureHotspots();
    attachState();
    updateHotspots();
  }

  window.KittenNestCoffeeCornerVariant = {
    version: VERSION,
    lapUrl: LAP_URL,
    enterCard: enterCard,
    backCard: backCard,
    chestCard: chestCard,
    enterLap: enterLap,
    backMain: backMain,
    setLapBubbleText: function(text){ syncLapBubbleLines(linesFrom(text)); updateHotspots(); },
    clearLapBubbleText: function(){ syncLapBubbleLines([]); updateHotspots(); },
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