(function(){
  function svgEl(tag, attrs){
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function(k){ el.setAttribute(k, attrs[k]); });
    return el;
  }

  function makeBlob(svg, className, cx, cy, rx, ry){
    svg.appendChild(svgEl('ellipse', {
      class: className,
      cx: cx,
      cy: cy,
      rx: rx,
      ry: ry
    }));
  }

  function makePath(svg, className, d){
    svg.appendChild(svgEl('path', {
      class: className,
      d: d,
      fill: 'none'
    }));
  }

  function install(){
    var steam = document.querySelector('#gameRoom .steam');
    if(!steam || steam.getAttribute('data-steam-svg') === '2') return;
    steam.setAttribute('data-steam-svg', '2');
    steam.innerHTML = '';

    var svg = svgEl('svg', {
      class: 'coffeeSteamSvg coffeeSteamMistSvg',
      viewBox: '0 0 100 112',
      preserveAspectRatio: 'xMidYMax meet',
      'aria-hidden': 'true'
    });

    makeBlob(svg, 'steamMist m1', 48, 88, 19, 11);
    makeBlob(svg, 'steamMist m2', 54, 66, 22, 14);
    makeBlob(svg, 'steamMist m3', 44, 45, 16, 13);
    makeBlob(svg, 'steamMist m4', 57, 30, 13, 10);

    makePath(svg, 'steamWisp w1', 'M42 100 C34 84 55 75 46 60 C38 47 57 39 50 25');
    makePath(svg, 'steamWisp w2', 'M56 101 C65 84 43 74 56 58 C68 44 48 37 60 24');

    steam.appendChild(svg);
  }

  window.KittenNestCoffeeSteam = { version:'coffee-steam-mist-20260613-1', install:install };
  window.addEventListener('load', install);
  window.addEventListener('pageshow', install);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) install(); });
  setTimeout(install, 250);
  setTimeout(install, 1000);
})();
