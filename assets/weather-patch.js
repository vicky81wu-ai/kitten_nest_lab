(function(){
  function setWeather(state){
    if(!state) return;
    var temp = document.getElementById('temp');
    var desc = document.getElementById('desc');
    if(temp && state.windowTemp) temp.textContent = String(state.windowTemp);
    if(desc && state.windowDesc) desc.textContent = String(state.windowDesc);
  }
  async function refreshWeather(){
    try{
      var res = await fetch('/api/state?weather=' + Date.now(), { cache:'no-store' });
      if(!res.ok) return;
      setWeather(await res.json());
    }catch(e){}
  }
  window.addEventListener('load', function(){ refreshWeather(); setInterval(refreshWeather, 5000); });
  window.addEventListener('focus', refreshWeather);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) refreshWeather(); });
  setTimeout(refreshWeather, 250);
  setTimeout(refreshWeather, 1200);
})();
