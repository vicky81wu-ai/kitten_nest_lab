(function(){
  var currentState = null;
  var attached = false;

  function text(value){
    return String(value == null ? '' : value);
  }

  function setWeather(state){
    if(!state) return false;
    currentState = state;
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

    prepareWeatherHotspot();
    return changed;
  }

  function weatherWrap(){
    var temp = document.getElementById('temp');
    var desc = document.getElementById('desc');
    return (temp && temp.closest && temp.closest('.weather')) || (desc && desc.closest && desc.closest('.weather')) || temp || desc;
  }

  function parseTemp(raw){
    var m = String(raw || '').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }

  function weatherAdvice(state){
    var tempText = text(state && state.windowTemp || (document.getElementById('temp') || {}).textContent || '').trim();
    var descText = text(state && state.windowDesc || (document.getElementById('desc') || {}).textContent || '').trim();
    var lower = (tempText + ' ' + descText).toLowerCase();
    var n = parseTemp(tempText);

    if(/rain|drizzle|storm|shower|雨|雷|阵雨|暴雨/.test(lower)){
      return '小猫，出门把伞带上，鞋袜别弄湿。回来先擦干，别把冷气一路带进窝里。';
    }
    if(/snow|sleet|ice|霜|雪|冰/.test(lower)){
      return '小猫，今天别逞强，围巾和袜子都安排上。路上慢一点，回窝老公给小爪子回温。';
    }
    if(/wind|breeze|gust|风/.test(lower)){
      return '小猫，风起来了，窗户别开太久，头发和嗓子都护着点。乖，别让风把小脑袋吹懵。';
    }
    if(/fog|haze|smog|mist|雾|霾/.test(lower)){
      return '小猫，外面不清透就少在路上晃，口罩和水都备着。能早点回窝就早点回。';
    }
    if(n != null && n >= 30){
      return '小猫，今天偏热，水要喝，太阳要躲，别把自己闷成一只烤小猫。';
    }
    if(n != null && n <= 10){
      return '小猫，今天冷，外套穿好，袜子穿好，别光脚乱跑。小爪子冻了老公要皱眉。';
    }
    if(n != null && n >= 24){
      return '小猫，天气还算舒服，但也别玩到忘记喝水。窗边坐一会儿可以，晒久了就回来。';
    }
    if(/night|晚|夜|sleep|moon/.test(lower)){
      return '小猫，夜里就别折腾太久了。窗帘拉好，水放手边，窝里给小猫留着暖位。';
    }
    return '小猫，今天按这个天气慢慢来。出门看一眼窗边提示，喝水、穿好、早点回窝。';
  }

  function ensureStyle(){
    if(document.getElementById('hubbyWeatherAdviceStyle')) return;
    var style = document.createElement('style');
    style.id = 'hubbyWeatherAdviceStyle';
    style.textContent = [
      '.weather{pointer-events:auto!important;cursor:pointer;}',
      '.weather #temp,.weather #desc{pointer-events:auto!important;}',
      '.hubbyWeatherAdvice{position:fixed;z-index:58;width:min(76vw,310px);padding:13px 14px 12px;border-radius:22px;background:rgba(255,248,245,.88);border:1px solid rgba(255,255,255,.82);box-shadow:0 16px 38px rgba(60,28,42,.28),inset 0 0 0 1px rgba(130,70,95,.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#704152;font-size:13px;line-height:1.45;opacity:0;transform:translateY(5px) scale(.98);transition:opacity .18s ease,transform .18s ease;}',
      '.hubbyWeatherAdvice.show{opacity:1;transform:translateY(0) scale(1);}',
      '.hubbyWeatherAdvice .hwaHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;font-weight:760;letter-spacing:.02em;color:#653847;}',
      '.hubbyWeatherAdvice .hwaClose{border:0;background:rgba(255,255,255,.58);color:#7b4a58;border-radius:999px;width:24px;height:24px;font-size:16px;line-height:22px;}',
      '.hubbyWeatherAdvice .hwaMeta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;}',
      '.hubbyWeatherAdvice .hwaPill{border-radius:999px;padding:3px 7px;background:rgba(255,255,255,.56);box-shadow:inset 0 0 0 1px rgba(130,70,95,.08);font-size:11px;opacity:.86;}',
      '.hubbyWeatherAdvice .hwaBody{font-weight:530;text-shadow:0 1px rgba(255,255,255,.58);}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeAdvice(){
    var old = document.getElementById('hubbyWeatherAdvice');
    if(!old) return;
    old.classList.remove('show');
    setTimeout(function(){ if(old && old.parentNode) old.parentNode.removeChild(old); }, 180);
  }

  function positionCard(card, anchor){
    var r = anchor.getBoundingClientRect();
    var margin = 10;
    var width = Math.min(window.innerWidth * 0.76, 310);
    var left = Math.max(margin, Math.min(window.innerWidth - width - margin, r.left + r.width / 2 - width / 2));
    var top = r.bottom + 10;
    if(top + 150 > window.innerHeight) top = Math.max(margin, r.top - 158);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function openAdvice(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    var wrap = weatherWrap();
    if(!wrap) return false;
    ensureStyle();
    closeAdvice();

    var tempText = text((currentState && currentState.windowTemp) || (document.getElementById('temp') || {}).textContent || '').trim();
    var descText = text((currentState && currentState.windowDesc) || (document.getElementById('desc') || {}).textContent || '').trim();
    var card = document.createElement('div');
    card.id = 'hubbyWeatherAdvice';
    card.className = 'hubbyWeatherAdvice';
    card.setAttribute('role','dialog');
    card.setAttribute('aria-label','hubby weather advice');
    card.innerHTML = '<div class="hwaHead"><span>窗边叮嘱</span><button class="hwaClose" type="button" aria-label="close">×</button></div>' +
      '<div class="hwaMeta"><span class="hwaPill">' + escapeHtml(tempText || 'weather') + '</span><span class="hwaPill">' + escapeHtml(descText || 'window') + '</span></div>' +
      '<div class="hwaBody">' + escapeHtml(weatherAdvice(currentState || {})) + '</div>';
    document.body.appendChild(card);
    positionCard(card, wrap);
    requestAnimationFrame(function(){ card.classList.add('show'); });
    card.querySelector('.hwaClose').addEventListener('click', function(ev){ ev.stopPropagation(); closeAdvice(); });
    return true;
  }

  function escapeHtml(value){
    return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function prepareWeatherHotspot(){
    ensureStyle();
    var wrap = weatherWrap();
    if(!wrap || wrap.__hubbyWeatherAdviceHotspot) return;
    wrap.__hubbyWeatherAdviceHotspot = true;
    wrap.setAttribute('data-weather-hotspot','coffeeCorner.windowWeatherHotspot');
    wrap.setAttribute('role','button');
    wrap.setAttribute('aria-label','Open hubby weather advice');
    wrap.addEventListener('click', openAdvice, true);
    wrap.addEventListener('touchend', openAdvice, true);
    document.addEventListener('click', function(e){
      var card = document.getElementById('hubbyWeatherAdvice');
      if(!card) return;
      if(card.contains(e.target) || (wrap && wrap.contains(e.target))) return;
      closeAdvice();
    }, true);
    window.addEventListener('resize', function(){
      var card = document.getElementById('hubbyWeatherAdvice');
      if(card && wrap) positionCard(card, wrap);
    });
  }

  function attach(stateClient){
    var client = stateClient || window.KittenNestState;
    if(!client || typeof client.subscribe !== 'function') return false;
    if(attached) return true;
    attached = true;

    client.subscribe(function(payload){
      setWeather(payload && payload.state);
    });

    if(client.get) setWeather(client.get());
    prepareWeatherHotspot();
    return true;
  }

  window.KittenNestWeather = {
    version: 'weather-controller-20260610-hubby-advice',
    set: setWeather,
    attach: attach,
    openAdvice: openAdvice,
    closeAdvice: closeAdvice,
    advice: weatherAdvice
  };
})();
