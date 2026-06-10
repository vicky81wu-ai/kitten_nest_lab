(function(){
  var defaults = {
    coffeeCornerTattoo: { room: 'gameRoom', imageId: 'gameBg', x: 0.73, y: 0.385, label: '19.8' }
  };

  function number(value, fallback){
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function coverPoint(img, x, y){
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
      drawW = rect.width;
      drawH = rect.width / imgRatio;
      offsetY = (rect.height - drawH) / 2;
    }else{
      drawH = rect.height;
      drawW = rect.height * imgRatio;
      offsetX = (rect.width - drawW) / 2;
    }

    return {
      left: rect.left + offsetX + x * drawW,
      top: rect.top + offsetY + y * drawH,
      drawWidth: drawW,
      drawHeight: drawH,
      offsetX: offsetX,
      offsetY: offsetY,
      naturalWidth: naturalW,
      naturalHeight: naturalH
    };
  }

  function ensureLayer(){
    var layer = document.getElementById('coordDebugLayer');
    if(layer) return layer;
    layer = document.createElement('div');
    layer.id = 'coordDebugLayer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:140;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;';
    document.body.appendChild(layer);
    return layer;
  }

  function ensureMarker(key){
    var layer = ensureLayer();
    var marker = document.getElementById('coordMarker_' + key);
    if(marker) return marker;
    marker = document.createElement('div');
    marker.id = 'coordMarker_' + key;
    marker.style.cssText = 'position:fixed;width:34px;height:34px;margin-left:-17px;margin-top:-17px;border:2px solid rgba(255,80,130,.95);border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.9),0 0 14px rgba(255,80,130,.75);pointer-events:none;';
    marker.innerHTML = '<i style="position:absolute;left:50%;top:-12px;width:2px;height:58px;background:rgba(255,80,130,.9);transform:translateX(-50%);"></i><i style="position:absolute;left:-12px;top:50%;width:58px;height:2px;background:rgba(255,80,130,.9);transform:translateY(-50%);"></i><b style="position:absolute;left:28px;top:-20px;padding:3px 7px;border-radius:999px;background:rgba(255,247,250,.9);color:#7b4054;font-size:12px;white-space:nowrap;box-shadow:0 4px 14px rgba(70,20,38,.22);"></b>';
    layer.appendChild(marker);
    return marker;
  }

  function place(key, point){
    var marker = ensureMarker(key);
    var img = document.getElementById(point.imageId);
    var p = coverPoint(img, point.x, point.y);
    if(!p){ marker.style.display = 'none'; return false; }
    marker.style.display = '';
    marker.style.left = p.left + 'px';
    marker.style.top = p.top + 'px';
    var label = marker.querySelector('b');
    if(label) label.textContent = point.label + ' x=' + point.x.toFixed(3) + ' y=' + point.y.toFixed(3);
    return true;
  }

  function params(){
    var q = new URLSearchParams(location.search);
    return {
      x: number(q.get('x'), defaults.coffeeCornerTattoo.x),
      y: number(q.get('y'), defaults.coffeeCornerTattoo.y)
    };
  }

  function refresh(){
    var p = params();
    var point = {
      room: 'gameRoom',
      imageId: 'gameBg',
      x: p.x,
      y: p.y,
      label: '19.8'
    };
    place('coffeeCornerTattoo', point);
  }

  function start(){
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) refresh(); });
    setTimeout(refresh, 250);
    setTimeout(refresh, 900);
    setTimeout(refresh, 1800);
  }

  window.KittenNestCoords = {
    version: 'passive-coordinates-20260610',
    defaults: defaults,
    coverPoint: coverPoint,
    place: place,
    refresh: refresh,
    start: start
  };
})();
