(function(){
  var canvas;
  var ctx;
  var raf;
  var particles = [];
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
    canvas.style.opacity = '.72';
    room.appendChild(canvas);
    ctx = canvas.getContext('2d');
    particles = [];
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
      seedParticles(rect.width, rect.height);
    }
  }

  function seedParticles(w,h){
    particles = [];
    for(var i=0;i<42;i++){
      particles.push({
        x: w*(0.58 + Math.random()*0.38),
        y: h*(0.07 + Math.random()*0.52),
        r: .45 + Math.random()*1.35,
        a: .08 + Math.random()*.18,
        drift: .16 + Math.random()*.40,
        phase: Math.random()*Math.PI*2
      });
    }
  }

  function softBeam(w,h,t, spec){
    var pulse = spec.pulseBase + Math.sin(t*spec.pulseSpeed + spec.phase)*spec.pulseRange;
    var g = ctx.createLinearGradient(w*spec.x0, h*spec.y0, w*spec.x1, h*spec.y1);
    g.addColorStop(0, 'rgba(255,242,205,' + (spec.a0*pulse) + ')');
    g.addColorStop(.28, 'rgba(255,224,164,' + (spec.a1*pulse) + ')');
    g.addColorStop(.66, 'rgba(255,205,132,' + (spec.a2*pulse) + ')');
    g.addColorStop(1, 'rgba(255,205,132,0)');

    ctx.beginPath();
    spec.points.forEach(function(pt, idx){
      if(idx === 0) ctx.moveTo(w*pt[0], h*pt[1]);
      else ctx.lineTo(w*pt[0], h*pt[1]);
    });
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.filter = 'blur(' + spec.blur + 'px)';
    ctx.fill();
  }

  function drawBeam(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    softBeam(w,h,t, {
      x0:.98, y0:.04, x1:.32, y1:.63,
      a0:.24, a1:.125, a2:.045,
      pulseBase:.90, pulseRange:.10, pulseSpeed:.00040, phase:0,
      blur:22,
      points:[[.91,.03],[.99,.15],[.47,.68],[.29,.66],[.49,.43],[.70,.23]]
    });

    softBeam(w,h,t, {
      x0:.99, y0:.13, x1:.50, y1:.42,
      a0:.17, a1:.080, a2:.025,
      pulseBase:.88, pulseRange:.08, pulseSpeed:.00052, phase:1.7,
      blur:14,
      points:[[.94,.10],[.99,.20],[.55,.45],[.48,.38]]
    });

    softBeam(w,h,t, {
      x0:.88, y0:.18, x1:.40, y1:.72,
      a0:.10, a1:.048, a2:.018,
      pulseBase:.86, pulseRange:.07, pulseSpeed:.00033, phase:3.1,
      blur:28,
      points:[[.84,.17],[.94,.25],[.45,.75],[.33,.71]]
    });

    ctx.restore();
  }

  function drawDust(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(.22px)';
    particles.forEach(function(p){
      var x = p.x + Math.sin(t*.00025 + p.phase)*5 + (t*.000010*p.drift*w)%16;
      var y = p.y + Math.cos(t*.00032 + p.phase)*6;
      var a = p.a * (0.58 + Math.sin(t*.001 + p.phase)*0.42);
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,230,174,' + a + ')';
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
    ctx.clearRect(0,0,rect.width,rect.height);
    var t = Date.now() - startTime;
    drawBeam(rect.width, rect.height, t);
    drawDust(rect.width, rect.height, t);
    raf = requestAnimationFrame(frame);
  }

  function start(){
    ensureCanvas();
    resize();
    if(!raf) frame();
  }

  window.KittenNestSunbeamCanvas = { version:'sunbeam-canvas-20260613-2', start:start, resize:resize };
  window.addEventListener('load', start);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('pageshow', start);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) start(); });
  setTimeout(start, 300);
  setTimeout(start, 1200);
})();
