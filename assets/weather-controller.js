(function(){
  function text(value){
    return String(value == null ? '' : value);
  }

  function setWeather(state){
    if(!state) return false;
    var temp = document.getElementById('temp');
    var desc = document.getElementById('desc');
    var changed = false;

    if(temp && state.windowTemp && temp.textContent !== text(state.windowTemp)){
      temp.textContent = text(state.windowTemp);
      changed = true;
    }

    if(desc && state.windowDesc && desc.textContent !== text(state.windowDesc)){
      desc.textContent = text(state.windowDesc);
      changed = true;
    }

    return changed;
  }

  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;

    client.subscribe(function(payload){
      setWeather(payload && payload.state);
    });

    if(client.get) setWeather(client.get());
    return true;
  }

  window.KittenNestWeather = {
    version: 'passive-weather-controller-20260610',
    set: setWeather,
    attach: attach
  };
})();
