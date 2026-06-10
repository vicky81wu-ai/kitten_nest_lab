(function(){
  var anchor = {
    imageId: 'gameBg',
    selector: '.tattooHot',
    x: 0.73,
    y: 0.385,
    width: 0.24,
    height: 0.17
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

  function apply(){
    var img = document.getElementById(anchor.imageId);
    var hot = document.querySelector(anchor.selector);
    var box = coverBox(img);
    if(!img || !hot || !box) return false;

    var parent = hot.offsetParent || document.body;
    var parentRect = parent.getBoundingClientRect();
    var w = box.width * anchor.width;
    var h = box.height * anchor.height;
    var cx = box.left + anchor.x * box.width;
    var cy = box.top + anchor.y * box.height;

    hot.style.left = (cx - parentRect.left - w / 2) + 'px';
    hot.style.top = (cy - parentRect.top - h / 2) + 'px';
    hot.style.right = 'auto';
    hot.style.bottom = 'auto';
    hot.style.width = w + 'px';
    hot.style.height = h + 'px';
    hot.style.zIndex = '28';
    hot.setAttribute('data-coordinate-hotspot', 'coffeeCorner.tattooHot');

    if(new URLSearchParams(location.search).get('debugHotspot') === '1'){
      hot.style.background = 'rgba(255,80,130,.18)';
      hot.style.outline = '2px solid rgba(255,80,130,.85)';
      hot.style.borderRadius = '18px';
    }

    return true;
  }

  function start(){
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    window.addEventListener('pageshow', apply);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) apply(); });
    setTimeout(apply, 200);
    setTimeout(apply, 700);
    setTimeout(apply, 1500);
    setTimeout(apply, 2600);
  }

  window.KittenNestHotspots = {
    version: 'coordinate-hotspot-20260610',
    anchor: anchor,
    coverBox: coverBox,
    apply: apply,
    start: start
  };
})();
