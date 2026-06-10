(function(){
  var defaults = {
    homeOn: '/assets/rooms/home/day.jpg',
    homeOff: '/assets/rooms/home/night.jpg',
    gameBg: '/assets/rooms/coffee-corner/morning-evening.jpg'
  };

  function el(id){ return document.getElementById(id); }

  function hasImage(img){
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  function mark(id, className){
    var img = el(id);
    if(!img) return false;
    if(hasImage(img)){
      document.body.classList.add(className);
      return true;
    }
    return false;
  }

  function hideSetup(){
    var setup = el('setup');
    if(setup) setup.classList.add('hidden');
  }

  function applyDefault(id, src){
    var img = el(id);
    if(!img || img.getAttribute('src')) return false;
    img.src = src;
    return true;
  }

  function applyDefaults(){
    applyDefault('homeOn', defaults.homeOn);
    applyDefault('homeOff', defaults.homeOff);
    applyDefault('gameBg', defaults.gameBg);
    mark('homeOn', 'hasHomeOn');
    mark('homeOff', 'hasHomeOff');
    mark('gameBg', 'hasGameRoom');
    hideSetup();
  }

  window.KittenNestAssets = {
    version: 'passive-asset-controller-20260610',
    defaults: defaults,
    applyDefaults: applyDefaults,
    hideSetup: hideSetup,
    mark: mark
  };
})();
