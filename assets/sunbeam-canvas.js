(function(){
  var canvas;
  var ctx;
  var raf;
  var motes = [];
  var startTime = Date.now();

  function activeRoom(){
    var room = document.getElementById('gameRoom');
    return room && room.classList.contains('active') ? room : null;
  }

  function ensureCanvas(){
    var room = activeRoom();
    if(!room) return null;
    if(canvas && canvas.parentNode === room) return canvas;

    canvas = document.createElement('canvas');
    canvas.className = 'sunbeamCanvas';
    canvas.setAttribute('aria-hidden','true');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9';
    canvas.style.mixBlendMode = 'screen';
    canvas.style.opacity = '.76';
    room.appendChild(canvas);
    ctx = canvas.getContext('2d');
    motes = [];
    return canvas;
  }

  function resize(){
    var c = ensureCanvas();
    if(!c) return;
    var rect = c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if(c.width !== w || c.height !== h){
      c.width = w;
      c.height = h;
      ctx = c.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      seedMotes(rect.width, rect.height);
    }
  }

  function seedMotes(w,h){
    motes = [];
    for(var i=0;i<54;i++){
      motes.push({
        u: Math.random(),
        v: Math.random(),
        r: .35 + Math.random()*1.15,
        a: .055 + Math.random()*.155,
        speed: .018 + Math.random()*.034,
        wiggle: 2 + Math.random()*7,
        phase: Math.random()*Math.PI*2
      });
    }
  }

  function beamCenter(w,h,u,t, shift){
    var wave = Math.sin(t*.00055 + shift + u*3.2)*0.018;
    var x = w*(.94 - .54*u + wave);
    var y = h*(.12 + .53*u + Math.sin(t*.00038 + shift + u*4.1)*0.018);
    return {x:x, y:y};
  }

  function drawBreathingRibbon(w,h,t, spec){
    var breath = spec.base + Math.sin(t*spec.speed + spec.phase)*spec.range;
    var widthPulse = 1 + Math.sin(t*.00046 + spec.phase)*.09;
    var steps = 18;
    var upper = [];
    var lower = [];

    for(var i=0;i<=steps;i++){
      var u = i/steps;
      var c = beamCenter(w,h,u,t,spec.phase);
      var thickness = h*(spec.thick0*(1-u) + spec.thick1*u) * widthPulse;
      var softEdge = Math.sin(u*Math.PI);
      var nx = -0.52;
      var ny = 0.86;
      var flutter = Math.sin(t*.00075 + u*8 + spec.phase)*h*.006*softEdge;
      upper.push({ x:c.x + nx*(thickness+flutter), y:c.y + ny*(thickness+flutter) });
      lower.push({ x:c.x - nx*(thickness-flutter), y:c.y - ny*(thickness-flutter) });
    }

    var g = ctx.createLinearGradient(w*.96, h*.08, w*.35, h*.66);
    g.addColorStop(0, 'rgba(255,242,202,' + (spec.a0*breath) + ')');
    g.addColorStop(.22, 'rgba(255,226,166,' + (spec.a1*breath) + ')');
    g.addColorStop(.55, 'rgba(255,213,145,' + (spec.a2*breath) + ')');
    g.addColorStop(1, 'rgba(255,213,145,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(' + spec.blur + 'px)';
    ctx.beginPath();
    ctx.moveTo(upper[0].x, upper[0].y);
    upper.forEach(function(p, idx){ if(idx) ctx.lineTo(p.x,p.y); });
    lower.reverse().forEach(function(p){ ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function drawAirShimmer(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(9px)';
    for(var i=0;i<5;i++){
      var u = (i+1)/6;
      var c = beamCenter(w,h,u,t,2.4+i);
      var r = h*(.020 + i*.004);
      var a = .018 + Math.sin(t*.0009+i)*.010;
      var rg = ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,r*4.5);
      rg.addColorStop(0,'rgba(255,238,190,' + a + ')');
      rg.addColorStop(1,'rgba(255,238,190,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(c.x,c.y,r*4.5,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMotes(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(.25px)';
    motes.forEach(function(m){
      var u = (m.u + t*.00002*m.speed) % 1;
      var c = beamCenter(w,h,u,t,m.phase);
      var spread = h*(.035 + .09*u);
      var x = c.x + Math.sin(t*.0006 + m.phase)*m.wiggle + (m.v-.5)*spread;
      var y = c.y + Math.cos(t*.0005 + m.phase)*m.wiggle*.7;
      var fade = Math.sin(u*Math.PI);
      var a = m.a * fade * (.55 + .45*Math.sin(t*.0012 + m.phase));
      ctx.beginPath();
      ctx.arc(x,y,m.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,231,174,' + a + ')';
      ctx.fill();
    });
    ctx.restore();
  }

  function frame(){
    var room = activeRoom();
    if(!room){
      raf = requestAnimationFrame(frame);
      return;
    }
    resize();
    if(!canvas || !ctx){ raf = requestAnimationFrame(frame); return; }
    var rect = canvas.getBoundingClientRect();
    var t = Date.now() - startTime;
    ctx.clearRect(0,0,rect.width,rect.height);

    drawBreathingRibbon(rect.width,rect.height,t,{ base:.86, range:.13, speed:.00032, phase:0, thick0:.022, thick1:.055, a0:.20, a1:.105, a2:.040, blur:24 });
    drawBreathingRibbon(rect.width,rect.height,t,{ base:.78, range:.11, speed:.00044, phase:1.8, thick0:.010, thick1:.030, a0:.12, a1:.060, a2:.020, blur:14 });
    drawBreathingRibbon(rect.width,rect.height,t,{ base:.72, range:.10, speed:.00028, phase:3.5, thick0:.035, thick1:.075, a0:.070, a1:.034, a2:.014, blur:34 });
    drawAirShimmer(rect.width,rect.height,t);
    drawMotes(rect.width,rect.height,t);

    raf = requestAnimationFrame(frame);
  }

  function start(){
    ensureCanvas();
    resize();
    if(!raf) frame();
  }

  window.KittenNestSunbeamCanvas = { version:'sunbeam-canvas-breathing-20260613-1', start:start, resize:resize };
  window.addEventListener('load', start);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('pageshow', start);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) start(); });
  setTimeout(start, 300);
  setTimeout(start, 1200);
})();
