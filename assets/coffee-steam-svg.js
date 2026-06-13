(function(){
  function makePath(svg, className, d){
    var p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('class', className);
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    svg.appendChild(p);
  }

  function install(){
    var steam = document.querySelector('#gameRoom .steam');
    if(!steam || steam.getAttribute('data-steam-svg') === '1') return;
    steam.setAttribute('data-steam-svg', '1');
    steam.innerHTML = '';

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','coffeeSteamSvg');
    svg.setAttribute('viewBox','0 0 100 120');
    svg.setAttribute('preserveAspectRatio','xMidYMax meet');
    svg.setAttribute('aria-hidden','true');

    makePath(svg, 'steamWisp w1', 'M42 112 C28 92 57 80 43 61 C30 43 58 36 48 20');
    makePath(svg, 'steamWisp w2', 'M53 114 C66 94 37 82 55 62 C70 45 42 36 58 18');
    makePath(svg, 'steamWisp w3', 'M62 110 C50 94 73 82 58 66 C45 51 70 42 63 25');

    steam.appendChild(svg);
  }

  window.KittenNestCoffeeSteam = { version:'coffee-steam-svg-20260613-1', install:install };
  window.addEventListener('load', install);
  window.addEventListener('pageshow', install);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) install(); });
  setTimeout(install, 250);
  setTimeout(install, 1000);
})();
